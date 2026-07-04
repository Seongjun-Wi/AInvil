import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";
import { createWorkflowRuntimeReport } from "./workflow-report.mjs";
import { createWorkflowTransitionPlan } from "./workflow-transitions.mjs";
import { createWorkflowTransitionApproval } from "./workflow-approvals.mjs";

const runtimeVersion = "0.1.0";

export async function runGuardedWorkflowRuntime(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const report = await createWorkflowRuntimeReport({ generatedAt });
  const plan = await createWorkflowTransitionPlan({ generatedAt, workflowReport: report });
  const approval = await createWorkflowTransitionApproval({ generatedAt, transitionPlan: plan });
  const graph = await readJson("state/production_state_graph.json");
  const operations = [];

  await writeJson("reports/workflow_runtime_report.json", report);
  operations.push(operation("WriteArtifact", "reports/workflow_runtime_report.json", "Written", "Workflow Runtime Report persisted."));

  await writeJson("reports/workflow_transition_plan.json", plan);
  operations.push(operation("WriteArtifact", "reports/workflow_transition_plan.json", "Written", "Workflow Transition Plan persisted."));

  await writeJson("reports/workflow_transition_approval.json", approval);
  operations.push(operation("WriteArtifact", "reports/workflow_transition_approval.json", "Written", "Workflow Transition Approval persisted."));

  const graphResult = syncGraphNextAction(graph, report, generatedAt);
  await writeJson("state/production_state_graph.json", graphResult.graph);
  operations.push(...graphResult.operations);

  const traceabilityPath = "reports/traceability_matrix.generated.md";
  await writeText(traceabilityPath, createTraceabilityMatrix(graphResult.graph, report, generatedAt));
  operations.push(operation("WriteArtifact", traceabilityPath, "Written", "Graph-derived traceability matrix generated."));

  const dashboardPath = "reports/project_dashboard.generated.md";
  await writeText(dashboardPath, createProjectDashboard(graphResult.graph, report, plan, approval, generatedAt));
  operations.push(operation("WriteArtifact", dashboardPath, "Written", "Graph-derived project dashboard generated."));

  const runRecordPath = "reports/workflow_run_latest.json";
  const runHistoryPath = `reports/workflow_runs/WFRUN-${report.currentState.graphId || "Graph"}-${generatedAt.replace(/[:.]/g, "-")}.json`;
  const runWriteOperations = [
    operation("WriteArtifact", runRecordPath, "Written", "Latest workflow run record persisted."),
    operation("WriteArtifact", runHistoryPath, "Written", "Workflow run history record persisted.")
  ];

  const runRecord = {
    schemaVersion: "1.0.0",
    runtimeVersion,
    runId: `WFRUN-${report.currentState.graphId || "Graph"}-${generatedAt.replace(/[:.]/g, "-")}`,
    generatedAt,
    mode: "GuardedExecution",
    sourceReportId: report.reportId,
    sourcePlanId: plan.planId,
    sourceApprovalId: approval.approvalId,
    executionPolicy: {
      executionAllowed: true,
      guarded: true,
      notes:
        "This runtime only executes evidence-safe synchronization and artifact generation. It does not promote validation levels, approve user decisions, modify Unity, or replace source-of-truth design intent."
    },
    appliedOperations: [...operations, ...runWriteOperations],
    skippedTransitions: classifySkippedTransitions(approval),
    safestNextApprovedAction: approval.safestNextApprovedAction,
    nextAction: report.nextAction,
    remainingGaps: {
      workflowBlockers: report.workflowBlockers.length,
      validationLevelGaps: report.validationStatus.validationLevelGaps.length,
      acceptanceCriteriaWithoutEvidence: report.validationStatus.acceptanceCriteriaWithoutEvidence.length,
      missingRequiredReviews: report.reviewStatus.missingRequiredReviews.length,
      missingKpiEvidence: report.benchmarkKpiStatus.missingKpiEvidence
    }
  };

  await writeJson(runRecordPath, runRecord);
  await writeJson(runHistoryPath, runRecord);
  operations.push(...runWriteOperations);

  return { report, plan, approval, runRecord: { ...runRecord, appliedOperations: operations } };
}

function syncGraphNextAction(graph, report, generatedAt) {
  const next = report.nextAction;
  const targetNodeId = next.referencesNodeIds[0] || graph.activeFeatureNodeId || graph.currentMilestoneNodeId || graph.currentVisionNodeId;
  const nextActionNodeId = "NA-WorkflowRuntime-NextAction";
  const nextAction = {
    actionId: next.actionId,
    title: next.title,
    owner: normalizeOwner(next.suggestedOwner),
    status: "Planned",
    reason: next.reason,
    referencesNodeId: targetNodeId,
    requiredValidationLevel: requiredValidationLevel(next)
  };
  const nodes = [...(graph.nodes || [])];
  const existingIndex = nodes.findIndex((node) => node.id === nextActionNodeId);
  const nextActionNode = {
    id: nextActionNodeId,
    type: "NextAction",
    title: next.title,
    summary: next.reason,
    status: "Planned",
    owner: "Orchestrator",
    refs: [{ kind: "Workflow Runtime Report", path: "reports/workflow_runtime_report.json" }],
    nextAction,
    metadata: {
      sourceReportId: report.reportId,
      priority: next.priority,
      evidenceStatus: next.evidenceStatus,
      updatedBy: "GuardedWorkflowRuntime"
    }
  };

  if (existingIndex >= 0) {
    nodes[existingIndex] = { ...nodes[existingIndex], ...nextActionNode };
  } else {
    nodes.push(nextActionNode);
  }

  const edges = [...(graph.edges || [])].filter((edge) => edge.id !== "EDGE-WorkflowRuntime-NextAction");
  if (targetNodeId) {
    edges.push({
      id: "EDGE-WorkflowRuntime-NextAction",
      type: "next_step_for",
      from: nextActionNodeId,
      to: targetNodeId,
      status: "Planned",
      summary: "Workflow runtime selected this as the graph-backed next action."
    });
  }

  return {
    graph: {
      ...graph,
      updatedAt: generatedAt,
      nextRecommendedAction: nextAction,
      nodes,
      edges
    },
    operations: [
      operation("UpdateGraph", "state/production_state_graph.json", "Applied", "Updated graph nextRecommendedAction from Workflow Runtime Report."),
      operation("UpsertGraphNode", nextActionNodeId, "Applied", "Upserted runtime NextAction node."),
      ...(targetNodeId ? [operation("UpsertGraphEdge", "EDGE-WorkflowRuntime-NextAction", "Applied", `Linked runtime NextAction to ${targetNodeId}.`)] : [])
    ]
  };
}

function createTraceabilityMatrix(graph, report, generatedAt) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const features = nodes.filter((node) => node.type === "Feature");
  const rows = features.length ? features.flatMap((feature) => traceRowsForFeature(feature, nodes, edges)) : [];

  return [
    "# AInvil Traceability Matrix: Generated",
    "",
    `- Generated at: ${generatedAt}`,
    `- Source graph: ${graph.graphId}`,
    `- Source workflow report: ${report.reportId}`,
    "- Status: Generated operational view; source-of-truth remains the Production State Graph and source documents.",
    "",
    "| Feature | Requirement | Task | Unity Target | Acceptance | Validation Evidence | Status | Gap |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...(rows.length ? rows : [["Unknown", "Missing link", "Missing link", "Missing link", "Missing link", "Missing link", "Needs Requirement Definition", "No feature nodes found."]]).map(
      (row) => `| ${row.map(escapeCell).join(" | ")} |`
    ),
    ""
  ].join("\n");
}

function traceRowsForFeature(feature, nodes, edges) {
  const requirements = linked(nodes, edges, feature.id, "Requirement");
  if (requirements.length === 0) return [[label(feature), "Missing link", "Missing link", "Missing link", "Missing link", "Missing link", feature.status, "No requirement linked."]];

  return requirements.flatMap((requirement) => {
    const tasks = linked(nodes, edges, requirement.id, "ImplementationTask");
    if (tasks.length === 0) return [[label(feature), label(requirement), "Missing link", "Missing link", "Missing link", "Missing link", requirement.status, "No implementation task linked."]];
    const requirementCriteria = linked(nodes, edges, requirement.id, "AcceptanceCriterion");
    return tasks.flatMap((task) => {
      const targets = linked(nodes, edges, task.id, "UnityTarget");
      const criteria = mergeNodes(linked(nodes, edges, task.id, "AcceptanceCriterion"), requirementCriteria);
      const targetLabels = targets.length ? targets.map(label).join("<br>") : "Missing link";
      if (criteria.length === 0) return [[label(feature), label(requirement), label(task), targetLabels, "Missing link", "Missing link", task.status, "No acceptance criterion linked."]];
      return criteria.map((criterion) => {
        const evidence = linked(nodes, edges, criterion.id, "ValidationEvidence", "validates");
        return [
          label(feature),
          label(requirement),
          label(task),
          targetLabels,
          label(criterion),
          evidence.length ? evidence.map(label).join("<br>") : "Missing link",
          criterion.status,
          evidence.length ? "None found" : "Needs validation"
        ];
      });
    });
  });
}

function mergeNodes(...groups) {
  const byId = new Map();
  for (const group of groups) {
    for (const node of group) byId.set(node.id, node);
  }
  return [...byId.values()];
}

function createProjectDashboard(graph, report, plan, approval, generatedAt) {
  return [
    "# AInvil Project Dashboard: Generated",
    "",
    `- Generated at: ${generatedAt}`,
    `- Project: ${graph.projectName || graph.projectId}`,
    `- Graph: ${graph.graphId}`,
    `- Workflow report: ${report.reportId}`,
    `- Transition plan: ${plan.planId}`,
    `- Approval record: ${approval.approvalId}`,
    "",
    "## Current State",
    "",
    `- Vision: ${nodeRef(report.currentState.currentVision)}`,
    `- Milestone: ${nodeRef(report.currentState.currentMilestone)}`,
    `- Active feature: ${nodeRef(report.currentState.activeFeature)}`,
    `- Next action: ${report.nextAction.title}`,
    `- Next owner: ${report.nextAction.suggestedOwner}`,
    `- Evidence status: ${report.nextAction.evidenceStatus}`,
    "",
    "## Health And Gaps",
    "",
    `- Workflow blockers: ${report.workflowBlockers.length}`,
    `- Validation level gaps: ${report.validationStatus.validationLevelGaps.length}`,
    `- Acceptance criteria without evidence: ${report.validationStatus.acceptanceCriteriaWithoutEvidence.length}`,
    `- Missing required reviews: ${report.reviewStatus.missingRequiredReviews.length}`,
    `- KPI evidence gaps: ${report.benchmarkKpiStatus.missingKpiEvidence.length}`,
    "",
    "## Guarded Runtime",
    "",
    `- Auto-ready action: ${approval.safestNextApprovedAction.transitionId}`,
    `- Runtime mode: guarded synchronization only`,
    "- Validation promotion: requires actual evidence and is not automated by this runtime.",
    ""
  ].join("\n");
}

function linked(nodes, edges, id, type, edgeType = null) {
  const ids = new Set(
    edges
      .filter((edge) => (edge.from === id || edge.to === id) && (!edgeType || edge.type === edgeType))
      .flatMap((edge) => [edge.from, edge.to])
      .filter((item) => item !== id)
  );
  return nodes.filter((node) => node.type === type && ids.has(node.id));
}

function label(node) {
  return `${node.title || node.id} (${node.id})`;
}

function nodeRef(node) {
  return node ? `${node.title} (${node.nodeId}, ${node.status})` : "Unknown";
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function requiredValidationLevel(next) {
  const match = /Play Mode Verified|Runtime Tested|Compile Verified|Unity Inspection|Static Analysis|Document Review|User Confirmed|Not Checked/.exec(`${next.reason} ${next.evidenceStatus}`);
  return match?.[0] || "Play Mode Verified";
}

function normalizeOwner(owner) {
  if (["Director Layer", "Orchestrator", "GDD Agent", "Unity Agent", "Input Agent", "User"].includes(owner)) return owner;
  return "Orchestrator";
}

function classifySkippedTransitions(approval) {
  return (approval.approvalRecords || [])
    .filter((record) => record.executionReadiness !== "Ready" || record.approvalClass !== "AutoEligible")
    .map((record) => ({
      transitionId: record.transitionId,
      approvalClass: record.approvalClass,
      executionReadiness: record.executionReadiness,
      reason: record.reason,
      missingEvidence: record.missingEvidence,
      missingReviews: record.missingReviews
    }));
}

function operation(kind, target, status, summary) {
  return { kind, target, status, summary };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolveAInvilPath(relativePath), "utf8"));
}

async function writeJson(relativePath, value) {
  await writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(relativePath, text) {
  const filePath = resolveAInvilPath(relativePath);
  if (!filePath.startsWith(pluginRoot)) throw new Error(`Refusing to write outside plugin root: ${relativeAInvilPath(filePath)}`);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}
