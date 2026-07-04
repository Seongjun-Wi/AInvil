import { findLatestAInvilFile, loadJsonArtifact, loadProductionIntelligenceReport, loadProductionStateGraph, loadValidationEvidence } from "./loaders.mjs";
import { findNode, summarizeGraph, summarizeStatus } from "./summaries.mjs";

export async function createProjectDashboard(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const graph = options.graph || (await loadProductionStateGraph({ strict: true })).data;
  const intelligence = (await loadProductionIntelligenceReport()).data;
  const evidenceRecords = options.evidenceRecords || (await loadValidationEvidence()).map((item) => item.data);
  const latestBenchmarkReport = await findLatestAInvilFile("benchmarks/reports", /latest-benchmark-report\.json$/i);
  const latestLiveHarnessReport = await findLatestAInvilFile("harness/reports", /latest-live-harness-report\.json$/i);
  const latestExecutionRecord = await findLatestAInvilFile("workflow/runs", /latest\.json$/i);
  const productization = await loadJsonArtifact("reports/productization_status_report.json");
  const productionCoreReview = await loadJsonArtifact("reports/production_core_review_evaluation.json");
  const status = summarizeStatus(graph, intelligence, null);
  const graphSummary = summarizeGraph(graph);
  return {
    schemaVersion: "1.0.0",
    dashboardId: `DASH-${graph.graphId || "Graph"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    projectName: graph.projectName || graph.projectId || "Unknown",
    currentVision: nodeRef(findNode(graph, graph.currentVisionNodeId)),
    currentMilestone: nodeRef(findNode(graph, graph.currentMilestoneNodeId)),
    activeFeature: nodeRef(findNode(graph, graph.activeFeatureNodeId)),
    healthSummary: graph.healthSummary || null,
    validationCoverage: intelligence?.validationCoverage || {},
    implementedFeatures: implementedFeatures(graph),
    validatedFeatures: validatedFeatures(graph, evidenceRecords),
    blockedTasks: graphSummary.blockedNodes.map((node) => node.id),
    openQuestions: graphSummary.openQuestions.map((node) => node.id),
    latestBenchmarkReport: rel(latestBenchmarkReport),
    latestLiveHarnessReport: rel(latestLiveHarnessReport),
    latestExecutionRecord: rel(latestExecutionRecord),
    productizationStatus: productization.exists ? {
      reportId: productization.data.reportId,
      decision: productization.data.summary?.decision || "Unknown",
      graphClassification: productization.data.graphClassification || "Unknown",
      releaseBlockerCount: productization.data.releaseBlockers?.length || 0,
      featureCounts: productization.data.summary?.featureCounts || {},
      e2eCounts: productization.data.summary?.e2eCounts || {},
      operationalValidation: productization.data.operationalValidation || null,
      productMvpWorkflow: productization.data.productMvpWorkflow || null,
      releaseLevel: productization.data.releaseLevel || null
    } : null,
    productionCoreReview: productionCoreReview.exists ? {
      evaluationId: productionCoreReview.data.evaluationId,
      reviewedGateId: productionCoreReview.data.reviewedGateId,
      previousStatus: productionCoreReview.data.previousStatus,
      newStatus: productionCoreReview.data.newStatus,
      resolvedChangeCount: productionCoreReview.data.resolvedChanges?.length || 0,
      remainingChangeCount: productionCoreReview.data.remainingChanges?.length || 0,
      remainingChanges: productionCoreReview.data.remainingChanges || [],
      evidenceUsed: productionCoreReview.data.evidenceUsed || []
    } : null,
    nextRecommendedAction: status.nextAction || graph.nextRecommendedAction || null
  };
}

function nodeRef(node) {
  return node ? { nodeId: node.id, title: node.title, status: node.status, owner: node.owner } : null;
}

function implementedFeatures(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  return nodes.filter((node) => node.type === "Feature" && hasLinkedStatus(node.id, nodes, edges, "ImplementationTask", ["Implemented", "Validated"])).map((node) => node.id);
}

function validatedFeatures(graph, evidenceRecords = []) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  return nodes.filter((node) => node.type === "Feature" && hasValidationEvidence(node.id, nodes, edges, evidenceRecords)).map((node) => node.id);
}

function hasLinkedStatus(id, nodes, edges, type, statuses) {
  const linkedIds = new Set(edges.filter((edge) => edge.from === id || edge.to === id).flatMap((edge) => [edge.from, edge.to]));
  return nodes.some((node) => node.type === type && linkedIds.has(node.id) && statuses.includes(node.status));
}

function hasValidationEvidence(id, nodes, edges, evidenceRecords) {
  const acceptanceIds = linkedAcceptanceIds(id, nodes, edges);
  if (evidenceRecords.some((evidence) => isPassedEvidence(evidence) && acceptanceIds.some((acceptanceId) => acceptanceIdsFor(evidence).includes(acceptanceId)))) {
    return true;
  }

  const visited = new Set();
  const stack = [id];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const node = byId.get(current);
    if (node?.type === "ValidationEvidence" && isPassedEvidence(node)) return true;
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) stack.push(edge.from === current ? edge.to : edge.from);
  }
  return false;
}

function linkedAcceptanceIds(startId, nodes, edges) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set();
  const stack = [startId];
  const ids = new Set();
  while (stack.length) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    if (byId.get(current)?.type === "AcceptanceCriterion") ids.add(current);
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) stack.push(edge.from === current ? edge.to : edge.from);
  }
  return [...ids];
}

function acceptanceIdsFor(evidence) {
  const values = Array.isArray(evidence?.acceptanceIds) ? [...evidence.acceptanceIds] : [];
  if (evidence?.acceptanceId) values.push(evidence.acceptanceId);
  return [...new Set(values.filter(Boolean))];
}

function isPassedEvidence(evidence) {
  const status = evidence?.status || evidence?.evidence?.status || "Not Checked";
  const level = evidence?.validationLevel || evidence?.evidence?.validationLevel || "Not Checked";
  return status === "Passed" && !["Not Checked", "Document Review"].includes(level);
}

function rel(filePath) {
  return filePath ? filePath.replaceAll("\\", "/").split("/plugins/ainvil/").pop() : null;
}
