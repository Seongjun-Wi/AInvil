import { loadJsonArtifact } from "./loaders.mjs";
import { createWorkflowRuntimeReport } from "./workflow-report.mjs";

const transitionPriorityOrder = [
  "AddressBlockedNode",
  "ResolveValidationGap",
  "RequestReview",
  "ResolveOpenQuestion",
  "ImproveTraceability",
  "RunBenchmark",
  "UpdateKpiDashboard"
];

export async function createWorkflowTransitionPlan(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const workflowReport = options.workflowReport || (await loadWorkflowReportOrCreate());
  const candidates = transitionCandidates(workflowReport);
  const safestNextTransition = chooseSafestTransition(candidates);

  return {
    schemaVersion: "1.0.0",
    planVersion: "0.1.0",
    planId: `WTP-${workflowReport.currentState?.graphId || "Graph"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    sourceReportId: workflowReport.reportId,
    sourceFiles: [
      {
        kind: "Workflow Runtime Report",
        path: "reports/workflow_runtime_report.json",
        used: true
      }
    ],
    transitionCandidates: candidates,
    safestNextTransition,
    executionPolicy: {
      mode: "ReadOnlyPlanning",
      executionAllowed: false,
      notes: "This plan recommends transition candidates only. It does not execute transitions or mutate project state."
    }
  };
}

async function loadWorkflowReportOrCreate() {
  const existing = await loadJsonArtifact("reports/workflow_runtime_report.json");
  if (existing.exists) return existing.data;
  return createWorkflowRuntimeReport();
}

function transitionCandidates(report) {
  return [
    ...addressBlockedNodeCandidates(report),
    ...resolveValidationGapCandidates(report),
    ...requestReviewCandidates(report),
    ...resolveOpenQuestionCandidates(report),
    ...improveTraceabilityCandidates(report),
    ...runBenchmarkCandidates(report),
    ...updateKpiDashboardCandidates(report)
  ];
}

function addressBlockedNodeCandidates(report) {
  return (report.workflowBlockers || [])
    .filter((blocker) => ["BlockedGraphNode", "BlockedTask"].includes(blocker.kind))
    .map((blocker, index) =>
      candidate({
        transitionId: `TRANS-AddressBlockedNode-${index + 1}`,
        transitionType: "AddressBlockedNode",
        sourceState: "Blocked",
        targetState: "Unblocked",
        targetArtifactId: blocker.id,
        targetArtifactType: "GraphNode",
        status: "Available",
        priority: "P0",
        reason: blocker.summary,
        prerequisites: ["Blocked graph node exists."],
        missingPrerequisites: [],
        evidenceRefs: blocker.evidenceNodeIds.map((id) => evidence("GraphNode", id)),
        recommendedBy: "Workflow Transition Planner",
        confidence: "High",
        safetyNotes: "Plan only. A user or future runtime must decide how to resolve the blocker."
      })
    );
}

function resolveValidationGapCandidates(report) {
  return (report.validationStatus?.validationLevelGaps || []).map((gap, index) =>
    candidate({
      transitionId: `TRANS-ResolveValidationGap-${index + 1}`,
      transitionType: "ResolveValidationGap",
      sourceState: gap.currentLevel,
      targetState: gap.requiredLevel,
      targetArtifactId: gap.nodeId,
      targetArtifactType: "GraphNode",
      status: "Available",
      priority: index === 0 ? "P0" : "P1",
      reason: gap.reason,
      prerequisites: ["Referenced graph node exists.", "Required validation level is known."],
      missingPrerequisites: [],
      evidenceRefs: [evidence("GraphNode", gap.nodeId)],
      recommendedBy: "Workflow Runtime Report",
      confidence: "High",
      safetyNotes: "The planner does not run validation. It only recommends that validation evidence be produced."
    })
  );
}

function requestReviewCandidates(report) {
  return (report.reviewStatus?.missingRequiredReviews || []).map((review, index) =>
    candidate({
      transitionId: `TRANS-RequestReview-${index + 1}`,
      transitionType: "RequestReview",
      sourceState: "Review Missing",
      targetState: "Review Requested",
      targetArtifactId: review.referencesNodeIds[0] || review.reviewType,
      targetArtifactType: review.referencesNodeIds[0] ? "GraphNode" : "ReviewType",
      status: "Available",
      priority: "P1",
      reason: review.reason,
      prerequisites: ["Governance-derived missing review exists."],
      missingPrerequisites: [],
      evidenceRefs: review.referencesNodeIds.map((id) => evidence("GraphNode", id)),
      recommendedBy: "Workflow Runtime Report",
      confidence: "Medium",
      safetyNotes: "The planner does not create review records. It only recommends requesting the review."
    })
  );
}

function resolveOpenQuestionCandidates(report) {
  return (report.workflowBlockers || [])
    .filter((blocker) => blocker.kind === "OpenQuestion")
    .map((blocker, index) =>
      candidate({
        transitionId: `TRANS-ResolveOpenQuestion-${index + 1}`,
        transitionType: "ResolveOpenQuestion",
        sourceState: "Open",
        targetState: "Resolved or Deferred",
        targetArtifactId: blocker.id,
        targetArtifactType: "GraphNode",
        status: "Available",
        priority: "P1",
        reason: blocker.summary,
        prerequisites: ["Open question exists."],
        missingPrerequisites: [],
        evidenceRefs: blocker.evidenceNodeIds.map((id) => evidence("GraphNode", id)),
        recommendedBy: "Workflow Runtime Report",
        confidence: "Medium",
        safetyNotes: "The user remains the creative owner for design-question resolution."
      })
    );
}

function improveTraceabilityCandidates(report) {
  return (report.workflowBlockers || [])
    .filter((blocker) => blocker.kind === "MissingTraceabilityLink")
    .map((blocker, index) =>
      candidate({
        transitionId: `TRANS-ImproveTraceability-${index + 1}`,
        transitionType: "ImproveTraceability",
        sourceState: "Traceability Gap",
        targetState: "Traceability Improved",
        targetArtifactId: blocker.id,
        targetArtifactType: "TraceabilityGap",
        status: blocker.evidenceNodeIds.length > 0 ? "Available" : "Needs Review",
        priority: "P2",
        reason: blocker.summary,
        prerequisites: ["Traceability gap is reported."],
        missingPrerequisites: blocker.evidenceNodeIds.length > 0 ? [] : ["Specific graph node evidence is missing."],
        evidenceRefs: blocker.evidenceNodeIds.map((id) => evidence("GraphNode", id)),
        recommendedBy: "Workflow Runtime Report",
        confidence: blocker.evidenceNodeIds.length > 0 ? "Medium" : "Low",
        safetyNotes: "The planner cannot infer missing links beyond the reported traceability gap."
      })
    );
}

function runBenchmarkCandidates(report) {
  if (report.benchmarkKpiStatus?.latestBenchmarkReportAvailable) {
    return [
      candidate({
        transitionId: "TRANS-RunBenchmark-NotApplicable",
        transitionType: "RunBenchmark",
        sourceState: "Benchmark Report Available",
        targetState: "No Transition Needed",
        targetArtifactId: report.benchmarkKpiStatus.latestBenchmarkReportPath || "BenchmarkReport",
        targetArtifactType: "BenchmarkReport",
        status: "Not Applicable",
        priority: "Future",
        reason: "A benchmark report is already available.",
        prerequisites: ["Benchmark report exists."],
        missingPrerequisites: [],
        evidenceRefs: [],
        recommendedBy: "Workflow Transition Planner",
        confidence: "Medium",
        safetyNotes: "No benchmark transition is recommended."
      }),
      candidate({
        transitionId: "TRANS-RunBenchmark-Refresh",
        transitionType: "RunBenchmark",
        sourceState: "Benchmark Report Available",
        targetState: "Benchmark Report Refreshed",
        targetArtifactId: report.benchmarkKpiStatus.latestBenchmarkReportPath || "BenchmarkReport",
        targetArtifactType: "BenchmarkReport",
        status: "Available",
        priority: "Future",
        reason: "A benchmark report exists; refreshing it is safe and records execution evidence.",
        prerequisites: ["Benchmark report exists.", "Benchmark datasets exist."],
        missingPrerequisites: [],
        evidenceRefs: [],
        recommendedBy: "Workflow Transition Planner",
        confidence: "Medium",
        safetyNotes: "This low-risk transition regenerates benchmark report artifacts and does not mutate design state."
      })
    ];
  }

  return [
    candidate({
      transitionId: "TRANS-RunBenchmark-001",
      transitionType: "RunBenchmark",
      sourceState: "Benchmark Report Missing",
      targetState: "Benchmark Report Recorded",
      targetArtifactId: "CapabilityBenchmark",
      targetArtifactType: "BenchmarkSuite",
      status: report.benchmarkKpiStatus?.benchmarkCaseCount > 0 ? "Available" : "Blocked",
      priority: "P2",
      reason: "Benchmark datasets exist but no benchmark report was found.",
      prerequisites: ["Benchmark datasets exist."],
      missingPrerequisites: report.benchmarkKpiStatus?.benchmarkCaseCount > 0 ? [] : ["Benchmark datasets are missing."],
      evidenceRefs: [],
      recommendedBy: "Workflow Runtime Report",
      confidence: report.benchmarkKpiStatus?.benchmarkCaseCount > 0 ? "High" : "Low",
      safetyNotes: "The planner does not run benchmark evaluation. It only recommends recording benchmark evidence."
    })
  ];
}

function updateKpiDashboardCandidates(report) {
  if (report.benchmarkKpiStatus?.kpiDashboardAvailable) {
    return [
      candidate({
        transitionId: "TRANS-UpdateKpiDashboard-NotApplicable",
        transitionType: "UpdateKpiDashboard",
        sourceState: "KPI Dashboard Available",
        targetState: "No Transition Needed",
        targetArtifactId: report.benchmarkKpiStatus.kpiDashboardPath || "KpiDashboard",
        targetArtifactType: "KpiDashboard",
        status: "Not Applicable",
        priority: "Future",
        reason: "A KPI dashboard is already available.",
        prerequisites: ["KPI dashboard exists."],
        missingPrerequisites: [],
        evidenceRefs: [],
        recommendedBy: "Workflow Transition Planner",
        confidence: "Medium",
        safetyNotes: "No KPI dashboard transition is recommended."
      })
    ];
  }

  return [
    candidate({
      transitionId: "TRANS-UpdateKpiDashboard-001",
      transitionType: "UpdateKpiDashboard",
      sourceState: "KPI Evidence Missing",
      targetState: "KPI Dashboard Updated",
      targetArtifactId: "KpiDashboard",
      targetArtifactType: "KpiDashboard",
      status: (report.benchmarkKpiStatus?.kpiCategories || []).length > 0 ? "Available" : "Blocked",
      priority: "Future",
      reason: "KPI framework exists but KPI dashboard values were not found.",
      prerequisites: ["KPI framework exists."],
      missingPrerequisites: report.benchmarkKpiStatus?.missingKpiEvidence || [],
      evidenceRefs: (report.benchmarkKpiStatus?.missingKpiEvidence || []).map((item) => evidence("KpiItem", item)),
      recommendedBy: "Workflow Runtime Report",
      confidence: "Medium",
      safetyNotes: "The planner does not create KPI values. It only identifies missing KPI evidence."
    })
  ];
}

function chooseSafestTransition(candidates) {
  const available = candidates.filter((item) => item.status === "Available" || item.status === "Needs Review");
  if (available.length === 0) {
    return {
      transitionId: "TRANS-NoSafeTransition",
      transitionType: "NoSafeTransition",
      reason: "No safe transition available from current evidence.",
      evidenceRefs: [],
      confidence: "Medium"
    };
  }

  return [...available].sort((a, b) => {
    const typeDelta = transitionPriorityOrder.indexOf(a.transitionType) - transitionPriorityOrder.indexOf(b.transitionType);
    if (typeDelta !== 0) return typeDelta;
    return priorityRank(a.priority) - priorityRank(b.priority);
  })[0];
}

function priorityRank(priority) {
  return { P0: 0, P1: 1, P2: 2, Future: 3 }[priority] ?? 99;
}

function candidate(input) {
  return {
    transitionId: input.transitionId,
    transitionType: input.transitionType,
    sourceState: input.sourceState,
    targetState: input.targetState,
    targetArtifactId: input.targetArtifactId,
    targetArtifactType: input.targetArtifactType,
    status: input.status,
    priority: input.priority,
    reason: input.reason,
    prerequisites: input.prerequisites,
    missingPrerequisites: input.missingPrerequisites,
    evidenceRefs: input.evidenceRefs,
    recommendedBy: input.recommendedBy,
    confidence: input.confidence,
    safetyNotes: input.safetyNotes
  };
}

function evidence(kind, id) {
  return { kind, id };
}
