import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const graphPath = path.resolve(pluginRoot, process.argv[2] || "state/production_state_graph.json");

const allowedNodeTypes = new Set([
  "Vision",
  "Milestone",
  "DesignDecision",
  "Requirement",
  "Feature",
  "FeatureSpec",
  "TechnicalSystem",
  "ImplementationTask",
  "UnityTarget",
  "InputSpec",
  "AcceptanceCriterion",
  "ValidationEvidence",
  "Risk",
  "OpenQuestion",
  "ProjectHealth",
  "NextAction"
]);

const allowedEdgeTypes = new Set([
  "derives_from",
  "confirms",
  "supersedes",
  "depends_on",
  "implements",
  "maps_to",
  "validates",
  "blocked_by",
  "affects",
  "owned_by",
  "next_step_for"
]);

const allowedStatuses = new Set([
  "Proposed",
  "Confirmed",
  "Planned",
  "In Progress",
  "Implemented",
  "Validated",
  "Blocked",
  "Deferred",
  "Cut",
  "Superseded",
  "Needs design confirmation",
  "Needs technical confirmation",
  "Needs Requirement Definition",
  "Needs Acceptance Criteria",
  "Needs validation",
  "Stale",
  "Conflict"
]);

const allowedValidationLevels = new Set([
  "Not Checked",
  "Document Review",
  "Static Analysis",
  "Unity Inspection",
  "Compile Verified",
  "Play Mode Verified",
  "Runtime Tested",
  "User Confirmed"
]);

const allowedOwners = new Set([
  "Director Layer",
  "Orchestrator",
  "GDD Agent",
  "Unity Agent",
  "Input Agent",
  "User"
]);

const errors = [];
const graph = await readJson(graphPath);

validateGraphShape(graph);
validateNodes(graph.nodes || []);
validateEdges(graph.edges || [], new Set((graph.nodes || []).map((node) => node.id)));
validateTopLevelReferences(graph);
validateNextActions(graph);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log(`Production state graph validation passed: ${path.relative(pluginRoot, graphPath)} (${graph.nodes.length} nodes, ${graph.edges.length} edges).`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return { nodes: [], edges: [] };
  }
}

function validateGraphShape(candidate) {
  for (const field of ["schemaVersion", "graphId", "projectId", "version", "updatedAt", "nodes", "edges"]) {
    if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
      errors.push(`graph: missing required field ${field}.`);
    }
  }
  if (candidate.schemaVersion !== "1.0.0") {
    errors.push("graph: schemaVersion should be 1.0.0.");
  }
  if (!Array.isArray(candidate.nodes)) {
    errors.push("graph: nodes should be an array.");
  }
  if (!Array.isArray(candidate.edges)) {
    errors.push("graph: edges should be an array.");
  }
}

function validateNodes(nodes) {
  const seen = new Set();
  for (const [index, node] of nodes.entries()) {
    const prefix = `nodes[${index}]`;
    for (const field of ["id", "type", "title", "status", "owner"]) {
      if (node[field] === undefined || node[field] === null || node[field] === "") {
        errors.push(`${prefix}: missing required field ${field}.`);
      }
    }
    if (node.id) {
      if (seen.has(node.id)) {
        errors.push(`${prefix}: duplicate node id ${node.id}.`);
      }
      seen.add(node.id);
    }
    if (node.type && !allowedNodeTypes.has(node.type)) {
      errors.push(`${prefix}: unsupported node type ${node.type}.`);
    }
    if (node.status && !allowedStatuses.has(node.status)) {
      errors.push(`${prefix}: unsupported status ${node.status}.`);
    }
    if (node.owner && !allowedOwners.has(node.owner)) {
      errors.push(`${prefix}: unsupported owner ${node.owner}.`);
    }
    validateValidationLevel(node.validationLevel, `${prefix}.validationLevel`);
    if (node.evidence) {
      validateValidationLevel(node.evidence.validationLevel, `${prefix}.evidence.validationLevel`);
      if (node.evidence.status && !["Pass", "Fail", "Blocked", "Not tested"].includes(node.evidence.status)) {
        errors.push(`${prefix}.evidence.status: unsupported status ${node.evidence.status}.`);
      }
    }
    if (node.nextAction) {
      validateNextActionShape(node.nextAction, `${prefix}.nextAction`);
    }
  }
}

function validateEdges(edges, nodeIds) {
  const seen = new Set();
  for (const [index, edge] of edges.entries()) {
    const prefix = `edges[${index}]`;
    for (const field of ["id", "type", "from", "to"]) {
      if (edge[field] === undefined || edge[field] === null || edge[field] === "") {
        errors.push(`${prefix}: missing required field ${field}.`);
      }
    }
    if (edge.id) {
      if (seen.has(edge.id)) {
        errors.push(`${prefix}: duplicate edge id ${edge.id}.`);
      }
      seen.add(edge.id);
    }
    if (edge.type && !allowedEdgeTypes.has(edge.type)) {
      errors.push(`${prefix}: unsupported edge type ${edge.type}.`);
    }
    if (edge.from && !nodeIds.has(edge.from)) {
      errors.push(`${prefix}: from references missing node ${edge.from}.`);
    }
    if (edge.to && !nodeIds.has(edge.to)) {
      errors.push(`${prefix}: to references missing node ${edge.to}.`);
    }
    if (edge.status && !allowedStatuses.has(edge.status)) {
      errors.push(`${prefix}: unsupported status ${edge.status}.`);
    }
  }
}

function validateTopLevelReferences(graph) {
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  for (const field of ["currentVisionNodeId", "currentMilestoneNodeId", "activeFeatureNodeId"]) {
    if (graph[field] && !nodeIds.has(graph[field])) {
      errors.push(`graph.${field}: references missing node ${graph[field]}.`);
    }
  }
}

function validateNextActions(graph) {
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  if (graph.nextRecommendedAction) {
    validateNextActionShape(graph.nextRecommendedAction, "graph.nextRecommendedAction");
    const ref = graph.nextRecommendedAction.referencesNodeId;
    if (ref && !nodeIds.has(ref)) {
      errors.push(`graph.nextRecommendedAction.referencesNodeId: references missing node ${ref}.`);
    }
  }
  for (const node of graph.nodes || []) {
    const ref = node.nextAction?.referencesNodeId;
    if (ref && !nodeIds.has(ref)) {
      errors.push(`${node.id}.nextAction.referencesNodeId: references missing node ${ref}.`);
    }
  }
}

function validateNextActionShape(action, prefix) {
  for (const field of ["actionId", "title", "owner", "status"]) {
    if (action[field] === undefined || action[field] === null || action[field] === "") {
      errors.push(`${prefix}: missing required field ${field}.`);
    }
  }
  if (action.owner && !allowedOwners.has(action.owner)) {
    errors.push(`${prefix}.owner: unsupported owner ${action.owner}.`);
  }
  if (action.status && !allowedStatuses.has(action.status)) {
    errors.push(`${prefix}.status: unsupported status ${action.status}.`);
  }
  validateValidationLevel(action.requiredValidationLevel, `${prefix}.requiredValidationLevel`);
}

function validateValidationLevel(value, label) {
  if (value && !allowedValidationLevels.has(value)) {
    errors.push(`${label}: unsupported validation level ${value}.`);
  }
}
