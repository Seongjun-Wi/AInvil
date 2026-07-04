import { findLatestAInvilFile, loadProductionStateGraph } from "./loaders.mjs";
import { summarizeGraph } from "./summaries.mjs";
import { createProjectDashboard } from "./project-dashboard.mjs";
import { createTraceabilityView } from "./traceability-view.mjs";

export async function createSyncReport(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const graph = options.graph || (await loadProductionStateGraph({ strict: true })).data;
  const traceability = options.traceability || (await createTraceabilityView({ graph, generatedAt }));
  const dashboard = options.dashboard || (await createProjectDashboard({ graph, generatedAt }));
  const graphSummary = summarizeGraph(graph);
  const driftFindings = driftFromRows(traceability.rows);
  return {
    schemaVersion: "1.0.0",
    syncReportId: `SYNC-${graph.graphId || "Graph"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    sourceFiles: [
      { kind: "Production State Graph", path: "state/production_state_graph.json", used: true },
      { kind: "Traceability View", path: "reports/traceability_view.json", used: true },
      { kind: "Project Dashboard", path: "reports/project_dashboard.json", used: true },
      { kind: "Validation Evidence", path: latestRel(await findLatestAInvilFile("validation/evidence", /\.json$/i)), used: true }
    ],
    graphSummary: {
      graphId: graph.graphId,
      nodeCount: graphSummary.nodeCount,
      edgeCount: graphSummary.edgeCount,
      activeFeatureNodeId: graph.activeFeatureNodeId,
      currentMilestoneNodeId: graph.currentMilestoneNodeId
    },
    traceabilitySummary: traceability.summary,
    dashboardSummary: {
      projectName: dashboard.projectName,
      currentMilestone: dashboard.currentMilestone,
      activeFeature: dashboard.activeFeature,
      nextRecommendedAction: dashboard.nextRecommendedAction
    },
    driftFindings,
    blockedSyncItems: driftFindings.filter((finding) => ["Needs Validation", "Orphan Implementation", "Needs Requirement Definition"].includes(finding.status)),
    recommendedNextActions: driftFindings.slice(0, 5).map((finding) => ({
      actionId: `SYNC-ACTION-${finding.rowId}`,
      summary: finding.nextAction,
      evidence: finding.rowId
    }))
  };
}

function driftFromRows(rows) {
  return rows
    .filter((row) => row.status !== "Complete")
    .map((row) => ({
      driftType: driftType(row),
      rowId: row.rowId,
      status: row.status,
      missingLinks: row.missingLinks,
      nextAction: row.nextAction
    }));
}

function driftType(row) {
  if (!row.requirementId) return "RequirementWithoutTask";
  if (!row.taskId) return "RequirementWithoutTask";
  if (!row.unityTargetId) return "TaskWithoutUnityTarget";
  if (!row.acceptanceId) return "NeedsAcceptanceCriteria";
  if (!row.validationEvidenceId) return "AcceptanceWithoutEvidence";
  if (row.status === "Needs Validation") return "ValidationLevelInsufficient";
  if (row.status === "Orphan Implementation") return "UnityTargetWithoutRequirement";
  return "TraceabilityGap";
}

function latestRel(filePath) {
  return filePath ? filePath.replaceAll("\\", "/").split("/plugins/ainvil/").pop() : null;
}
