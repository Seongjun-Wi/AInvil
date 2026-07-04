import { relativeAInvilPath } from "./ainvil-paths.mjs";

export function summarizeStatus(graph, intelligenceReport, kpiDashboardPath) {
  const vision = findNode(graph, graph.currentVisionNodeId);
  const milestone = findNode(graph, graph.currentMilestoneNodeId);
  const activeFeature = findNode(graph, graph.activeFeatureNodeId);
  const blockedNodes = getBlockedNodes(graph);
  const nextAction = graph.nextRecommendedAction || findNodesByType(graph, "NextAction")[0]?.nextAction || null;

  return {
    project: graph.projectName || graph.projectId || "Unknown",
    vision,
    milestone,
    activeFeature,
    healthSummary: graph.healthSummary || null,
    blockedNodes,
    nextAction,
    intelligenceSummary: intelligenceReport?.overallSummary || null,
    validationCoverage: intelligenceReport?.validationCoverage || null,
    kpiDashboardPath
  };
}

export function summarizeGraph(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const invalidEdgeReferences = edges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
  const openQuestions = nodes.filter((node) => /question/i.test(node.type || "") || /open question/i.test(node.status || ""));

  return {
    graphId: graph.graphId || "Unknown",
    nodeCount: nodes.length,
    nodeCountsByType: countBy(nodes, "type"),
    edgeCount: edges.length,
    edgeCountsByType: countBy(edges, "type"),
    invalidEdgeReferences,
    missingLinks: findMissingGraphLinks(graph),
    openQuestions,
    blockedNodes: getBlockedNodes(graph)
  };
}

export function summarizeIntelligenceReport(report) {
  return {
    reportId: report.reportId || "Unknown",
    generatedAt: report.generatedAt || "Unknown",
    summary: report.overallSummary || "No summary",
    health: report.health || [],
    coverageGaps: report.coverage || [],
    risks: report.risks || [],
    recommendations: report.recommendations || [],
    validationCoverage: report.validationCoverage || null
  };
}

export function summarizeReviews(reviewFiles) {
  const records = reviewFiles.map((file) => file.data);
  const pending = records.filter((review) => ["Draft", "Review Requested", "Review In Progress"].includes(review.lifecycleState));
  const changesRequested = records.filter((review) => review.decision === "Changes Requested" || review.lifecycleState === "Changes Requested");
  const approved = records.filter((review) => review.decision === "Approved" || review.lifecycleState === "Approved");
  const majorRisks = records.flatMap((review) =>
    (review.risks || [])
      .filter((risk) => ["High", "Critical"].includes(risk.severity))
      .map((risk) => ({
        reviewId: review.reviewId,
        severity: risk.severity,
        summary: risk.summary
      }))
  );

  return {
    count: records.length,
    countsByType: countBy(records, "reviewType"),
    pending,
    changesRequested,
    approved,
    majorRisks
  };
}

export function summarizeBenchmarks(benchmarkFiles, availability = {}) {
  const missingExpectedOutputs = [];
  for (const file of benchmarkFiles) {
    for (const field of ["expectedObservations", "expectedRecommendations", "scoringCriteria", "failureModes"]) {
      if (!Array.isArray(file.data[field]) || file.data[field].length === 0) {
        missingExpectedOutputs.push(`${file.name}: missing ${field}`);
      }
    }
  }

  return {
    count: benchmarkFiles.length,
    countsByCategory: countBy(benchmarkFiles.map((file) => file.data), "category"),
    missingExpectedOutputs,
    scoringRubricAvailable: Boolean(availability.scoringRubricAvailable),
    benchmarkReportTemplateAvailable: Boolean(availability.benchmarkReportTemplateAvailable),
    latestBenchmarkReportPath: availability.latestBenchmarkReportPath || null
  };
}

export function summarizeKpi(kpiArtifacts) {
  const categories = kpiArtifacts.framework.exists
    ? extractMarkdownHeadings(kpiArtifacts.framework.text, 3).filter((heading) => /KPIs$/.test(heading.replace(/^[0-9.]+\s*/, "")))
    : [];

  return {
    categories,
    collectionStrategyAvailable: kpiArtifacts.collectionStrategyExists,
    reviewProcessAvailable: kpiArtifacts.reviewProcessExists,
    dashboardTemplateAvailable: kpiArtifacts.dashboardTemplateExists,
    latestDashboardPath: kpiArtifacts.latestDashboardPath,
    evidenceSources: [
      "Production State Graph",
      "RFC records",
      "Review records",
      "Validation evidence",
      "Benchmark reports",
      "Architecture Retrospectives",
      "Conversation summaries",
      "Implementation history"
    ],
    missingData: kpiArtifacts.latestDashboardPath
      ? []
      : ["Current KPI values", "Historical trends", "Regression warnings", "Improvement opportunities"]
  };
}

export function countBy(items, field) {
  const counts = {};
  for (const item of items) {
    const key = item[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function findNode(graph, id) {
  return (graph.nodes || []).find((node) => node.id === id);
}

export function findNodesByType(graph, type) {
  return (graph.nodes || []).filter((node) => node.type === type);
}

export function getBlockedNodes(graph) {
  return (graph.nodes || []).filter((node) => /blocked/i.test(`${node.status || ""} ${node.type || ""} ${node.title || ""}`));
}

export function findMissingGraphLinks(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const links = [];

  for (const requirement of nodes.filter((node) => node.type === "Requirement")) {
    if (!edges.some((edge) => edge.type === "implements" && edge.to === requirement.id)) {
      links.push(`${requirement.id}: no implementation task implements this requirement`);
    }
  }

  for (const task of nodes.filter((node) => node.type === "ImplementationTask")) {
    if (!edges.some((edge) => edge.to === task.id && edge.type === "maps_to")) {
      links.push(`${task.id}: no Unity target maps to this task`);
    }
  }

  for (const criterion of nodes.filter((node) => node.type === "AcceptanceCriterion")) {
    if (!edges.some((edge) => edge.type === "validates" && edge.to === criterion.id)) {
      links.push(`${criterion.id}: no validation evidence validates this acceptance criterion`);
    }
  }

  return links;
}

export function extractMarkdownHeadings(text, level) {
  const prefix = "#".repeat(level);
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith(`${prefix} `))
    .map((line) => line.slice(prefix.length + 1).trim());
}

export function formatNode(node) {
  if (!node) return "Unknown";
  return `${node.title || node.id} (${node.id || "no id"}, ${node.status || "Unknown"})`;
}

export function formatFinding(item) {
  return `${item.findingId || item.riskId || item.coverageId || "Finding"}: ${item.title || item.summary || item.reason || "No summary"}`;
}

export function formatRisk(item) {
  return `${item.reviewId}: ${item.severity} - ${item.summary}`;
}

export function summarizeHealth(health) {
  if (!health) return "Unknown";
  return [
    `Design=${health.designHealth || "Unknown"}`,
    `Implementation=${health.implementationHealth || "Unknown"}`,
    `Documentation=${health.documentationHealth || "Unknown"}`,
    `Validation=${health.validationCoverage || "Unknown"}`,
    `Risk=${health.productionRisk || "Unknown"}`
  ].join(", ");
}

export function summarizeValidationCoverage(coverage) {
  if (!coverage) return "Unknown";
  return Object.entries(coverage).map(([level, count]) => `${level}: ${count}`).join(", ");
}

export function formatRelativePath(filePath) {
  return filePath ? relativeAInvilPath(filePath) : null;
}
