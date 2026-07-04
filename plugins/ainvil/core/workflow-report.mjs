import {
  existsAInvilArtifact,
  findLatestAInvilFile,
  loadBenchmarkCases,
  loadKpiArtifacts,
  loadProductionIntelligenceReport,
  loadProductionStateGraph,
  loadReviewRecords
} from "./loaders.mjs";
import {
  formatRelativePath,
  summarizeBenchmarks,
  summarizeGraph,
  summarizeIntelligenceReport,
  summarizeKpi,
  summarizeReviews,
  summarizeStatus
} from "./summaries.mjs";

export async function createWorkflowRuntimeReport(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const graphResult = await loadProductionStateGraph({ strict: true });
  const intelligenceResult = await loadProductionIntelligenceReport();
  const reviewFiles = await loadReviewRecords();
  const benchmarkFiles = await loadBenchmarkCases();
  const kpiArtifacts = await loadKpiArtifacts();
  const latestBenchmarkReportPath = await findLatestAInvilFile("benchmarks/reports", /\.(md|json)$/i);
  const latestKpiDashboardPath = kpiArtifacts.latestDashboardPath;

  const graph = graphResult.data;
  const intelligence = intelligenceResult.exists ? intelligenceResult.data : null;
  const graphSummary = summarizeGraph(graph);
  const statusSummary = summarizeStatus(graph, intelligence, latestKpiDashboardPath);
  const intelligenceSummary = intelligence ? summarizeIntelligenceReport(intelligence) : null;
  const reviewSummary = summarizeReviews(reviewFiles);
  const benchmarkSummary = summarizeBenchmarks(benchmarkFiles, {
    scoringRubricAvailable: await existsAInvilArtifact("templates/scoring_rubric.md"),
    benchmarkReportTemplateAvailable: await existsAInvilArtifact("templates/benchmark_report.md"),
    latestBenchmarkReportPath
  });
  const kpiSummary = summarizeKpi(kpiArtifacts);

  const validationStatus = summarizeValidationStatus(graph, intelligence);
  const reviewStatus = summarizeReviewStatus(reviewSummary, graph, validationStatus);
  const workflowBlockers = summarizeWorkflowBlockers(graphSummary, validationStatus, reviewStatus, intelligenceSummary);
  const benchmarkKpiStatus = summarizeBenchmarkKpiStatus(benchmarkSummary, kpiSummary);
  const nextAction = chooseNextAction(graph, workflowBlockers, reviewStatus, validationStatus, benchmarkKpiStatus);

  return {
    schemaVersion: "1.0.0",
    reportVersion: "0.1.0",
    reportId: `WFR-${graph.graphId || "Graph"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    sourceFiles: sourceFiles(intelligenceResult, reviewFiles, benchmarkFiles, latestBenchmarkReportPath, latestKpiDashboardPath),
    currentState: {
      projectId: graph.projectId || null,
      projectName: graph.projectName || null,
      graphId: graph.graphId || null,
      currentVision: nodeRef(statusSummary.vision),
      currentMilestone: nodeRef(statusSummary.milestone),
      activeFeature: nodeRef(statusSummary.activeFeature),
      currentNextRecommendedAction: statusSummary.nextAction
        ? {
            title: statusSummary.nextAction.title || "Untitled next action",
            reason: statusSummary.nextAction.reason || "No reason provided.",
            owner: statusSummary.nextAction.owner || "Orchestrator",
            status: statusSummary.nextAction.status || "Unknown",
            referencesNodeIds: [statusSummary.nextAction.referencesNodeId].filter(Boolean),
            requiredValidationLevel: statusSummary.nextAction.requiredValidationLevel || null
          }
        : null
    },
    workflowBlockers,
    reviewStatus,
    validationStatus,
    benchmarkKpiStatus,
    nextAction
  };
}

function sourceFiles(intelligenceResult, reviewFiles, benchmarkFiles, latestBenchmarkReportPath, latestKpiDashboardPath) {
  return [
    { kind: "Production State Graph", path: "state/production_state_graph.json", used: true },
    {
      kind: "Production Intelligence Report",
      path: "reports/production_intelligence_report.json",
      used: intelligenceResult.exists
    },
    ...reviewFiles.map((file) => ({ kind: "Review Record", path: formatRelativePath(file.path), used: true })),
    ...benchmarkFiles.map((file) => ({ kind: "Benchmark Case", path: formatRelativePath(file.path), used: true })),
    {
      kind: "Benchmark Report",
      path: latestBenchmarkReportPath ? formatRelativePath(latestBenchmarkReportPath) : "benchmarks/reports/",
      used: Boolean(latestBenchmarkReportPath)
    },
    {
      kind: "KPI Dashboard",
      path: latestKpiDashboardPath ? formatRelativePath(latestKpiDashboardPath) : "reports/",
      used: Boolean(latestKpiDashboardPath)
    }
  ];
}

function summarizeWorkflowBlockers(graphSummary, validationStatus, reviewStatus, intelligenceSummary) {
  const blockers = [];

  for (const node of graphSummary.blockedNodes) {
    blockers.push(blocker("BlockedGraphNode", node.id, node.title || node.id, [node.id]));
  }
  for (const node of graphSummary.openQuestions) {
    blockers.push(blocker("OpenQuestion", node.id, node.title || node.id, [node.id]));
  }
  for (const link of graphSummary.missingLinks) {
    blockers.push(blocker("MissingTraceabilityLink", link, link, []));
  }
  for (const item of reviewStatus.missingRequiredReviews) {
    blockers.push(blocker("MissingRequiredReview", item.reviewType, item.reason, item.referencesNodeIds));
  }
  for (const item of validationStatus.acceptanceCriteriaWithoutEvidence) {
    blockers.push(blocker("MissingValidationEvidence", item.nodeId, item.reason, [item.nodeId]));
  }
  for (const item of validationStatus.validationLevelGaps) {
    blockers.push(blocker("ValidationLevelGap", item.nodeId, item.reason, [item.nodeId]));
  }
  for (const id of intelligenceSummary?.blockedTasks || []) {
    blockers.push(blocker("BlockedTask", id, `${id} is blocked according to Production Intelligence.`, [id]));
  }

  return blockers;
}

function summarizeReviewStatus(reviewSummary, graph, validationStatus) {
  const missingRequiredReviews = [];
  const hasValidationReview = reviewSummary.countsByType["Validation Review"] > 0;
  if ((validationStatus.acceptanceCriteriaWithoutEvidence.length > 0 || validationStatus.validationLevelGaps.length > 0) && !hasValidationReview) {
    missingRequiredReviews.push({
      reviewType: "Validation Review",
      reason: "Validation gaps exist but no Validation Review record is available.",
      referencesNodeIds: validationStatus.validationLevelGaps.map((item) => item.nodeId)
    });
  }

  const activeFeatureId = graph.activeFeatureNodeId;
  const hasActiveFeatureReview = activeFeatureId
    ? [...reviewSummary.pending, ...reviewSummary.changesRequested, ...reviewSummary.approved].some((review) => review.artifactNodeId === activeFeatureId || review.artifactId === activeFeatureId)
    : false;
  if (activeFeatureId && !hasActiveFeatureReview) {
    missingRequiredReviews.push({
      reviewType: "Production Review",
      reason: "Active feature has no review record.",
      referencesNodeIds: [activeFeatureId]
    });
  }

  return {
    reviewCount: reviewSummary.count,
    reviewCountByType: reviewSummary.countsByType,
    pendingReviewIds: reviewSummary.pending.map((review) => review.reviewId),
    approvedReviewIds: reviewSummary.approved.map((review) => review.reviewId),
    changesRequestedReviewIds: reviewSummary.changesRequested.map((review) => review.reviewId),
    majorRisks: reviewSummary.majorRisks,
    missingRequiredReviews
  };
}

function summarizeValidationStatus(graph, intelligence) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const evidenceTargets = new Set(edges.filter((edge) => edge.type === "validates").map((edge) => edge.to));
  const acceptanceCriteria = nodes.filter((node) => node.type === "AcceptanceCriterion");
  const evidenceNodes = nodes.filter((node) => node.type === "ValidationEvidence");
  const acceptanceCriteriaWithoutEvidence = acceptanceCriteria
    .filter((node) => !evidenceTargets.has(node.id))
    .map((node) => ({
      nodeId: node.id,
      reason: `${node.id} has no ValidationEvidence edge.`
    }));
  const validationLevelGaps = [...acceptanceCriteria, ...evidenceNodes]
    .filter((node) => ["Not Checked", "Document Review", undefined, null].includes(node.validationLevel || node.evidence?.validationLevel))
    .map((node) => ({
      nodeId: node.id,
      currentLevel: node.validationLevel || node.evidence?.validationLevel || "Unknown",
      requiredLevel: graph.nextRecommendedAction?.requiredValidationLevel || "Play Mode Verified",
      reason: `${node.id} is below the required validation confidence.`
    }));

  return {
    validationCoverage: intelligence?.validationCoverage || {},
    featuresWithoutEvidence: nodes
      .filter((node) => node.type === "Feature")
      .filter((feature) => !featureHasValidationPath(feature.id, nodes, edges))
      .map((node) => node.id),
    acceptanceCriteriaWithoutEvidence,
    validationLevelGaps
  };
}

function summarizeBenchmarkKpiStatus(benchmarkSummary, kpiSummary) {
  return {
    benchmarkCaseCount: benchmarkSummary.count,
    benchmarkCaseCountByCategory: benchmarkSummary.countsByCategory,
    missingBenchmarkExpectedOutputs: benchmarkSummary.missingExpectedOutputs,
    latestBenchmarkReportAvailable: Boolean(benchmarkSummary.latestBenchmarkReportPath),
    latestBenchmarkReportPath: benchmarkSummary.latestBenchmarkReportPath ? formatRelativePath(benchmarkSummary.latestBenchmarkReportPath) : null,
    kpiCategories: kpiSummary.categories,
    kpiDashboardAvailable: Boolean(kpiSummary.latestDashboardPath),
    kpiDashboardPath: kpiSummary.latestDashboardPath ? formatRelativePath(kpiSummary.latestDashboardPath) : null,
    missingKpiEvidence: kpiSummary.missingData
  };
}

function chooseNextAction(graph, workflowBlockers, reviewStatus, validationStatus, benchmarkKpiStatus) {
  const validationGap = validationStatus.validationLevelGaps[0] || validationStatus.acceptanceCriteriaWithoutEvidence[0];
  if (validationGap) {
    return {
      actionId: "WFA-Validate-Gap",
      title: "Resolve the highest validation gap.",
      reason: validationGap.reason,
      suggestedOwner: "Input Agent",
      priority: "High",
      referencesNodeIds: [validationGap.nodeId].filter(Boolean),
      referencesReviewIds: [],
      referencesBenchmarkIds: [],
      referencesKpiItems: [],
      evidenceStatus: "Evidence exists for the referenced graph node, but required validation evidence or confidence is missing."
    };
  }

  const missingReview = reviewStatus.missingRequiredReviews[0];
  if (missingReview) {
    return {
      actionId: "WFA-Run-Required-Review",
      title: `Run required ${missingReview.reviewType}.`,
      reason: missingReview.reason,
      suggestedOwner: "Orchestrator",
      priority: "Medium",
      referencesNodeIds: missingReview.referencesNodeIds,
      referencesReviewIds: [],
      referencesBenchmarkIds: [],
      referencesKpiItems: [],
      evidenceStatus: "Required review is missing according to governance-derived workflow checks."
    };
  }

  if (!benchmarkKpiStatus.latestBenchmarkReportAvailable) {
    return {
      actionId: "WFA-Run-Benchmark",
      title: "Run or record the Capability Benchmark before release confidence claims.",
      reason: "Benchmark datasets exist but no benchmark report was found.",
      suggestedOwner: "Orchestrator",
      priority: "Medium",
      referencesNodeIds: [],
      referencesReviewIds: [],
      referencesBenchmarkIds: [],
      referencesKpiItems: [],
      evidenceStatus: "Benchmark report evidence is missing."
    };
  }

  if (!benchmarkKpiStatus.kpiDashboardAvailable) {
    return {
      actionId: "WFA-Create-KPI-Dashboard",
      title: "Create or update the KPI Dashboard for the current milestone.",
      reason: "KPI framework exists but no KPI dashboard values were found.",
      suggestedOwner: "Orchestrator",
      priority: "Low",
      referencesNodeIds: [],
      referencesReviewIds: [],
      referencesBenchmarkIds: [],
      referencesKpiItems: benchmarkKpiStatus.missingKpiEvidence,
      evidenceStatus: "KPI dashboard evidence is missing."
    };
  }

  const graphNext = graph.nextRecommendedAction;
  return {
    actionId: graphNext?.actionId || "WFA-No-Blocking-Gap",
    title: graphNext?.title || "Continue with the graph next recommended action.",
    reason: graphNext?.reason || "No blocking workflow gaps were found by the read-only report.",
    suggestedOwner: graphNext?.owner || "Orchestrator",
    priority: "Medium",
    referencesNodeIds: [graphNext?.referencesNodeId].filter(Boolean),
    referencesReviewIds: [],
    referencesBenchmarkIds: [],
    referencesKpiItems: [],
    evidenceStatus: graphNext?.referencesNodeId ? "References existing graph nextRecommendedAction evidence." : "No specific graph evidence was available."
  };
}

function featureHasValidationPath(featureId, nodes, edges) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set();
  const stack = [featureId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    if (byId.get(current)?.type === "ValidationEvidence") return true;
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) {
      stack.push(edge.from === current ? edge.to : edge.from);
    }
  }
  return false;
}

function nodeRef(node) {
  if (!node) return null;
  return {
    nodeId: node.id,
    title: node.title || node.id,
    status: node.status || "Unknown",
    owner: node.owner || "Unknown"
  };
}

function blocker(kind, id, summary, evidenceNodeIds) {
  return {
    kind,
    id,
    summary,
    evidenceNodeIds
  };
}
