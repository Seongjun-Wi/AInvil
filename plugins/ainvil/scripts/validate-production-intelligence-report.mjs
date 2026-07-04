import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const graphPath = path.resolve(pluginRoot, process.argv[2] || "state/production_state_graph.json");
const reportPath = path.resolve(pluginRoot, process.argv[3] || "reports/production_intelligence_report.json");

const allowedHealth = new Set(["Green", "Yellow", "Red", "Unknown"]);
const allowedPriorities = new Set(["Low", "Medium", "High", "Critical"]);
const allowedOwners = new Set(["Director Layer", "Orchestrator", "GDD Agent", "Unity Agent", "Input Agent", "User"]);
const errors = [];

const graph = await readJson(graphPath);
const report = await readJson(reportPath);
const nodeIds = new Set((graph.nodes || []).map((node) => node.id));

validateShape();
validateNodeReferences("health", report.health || [], "evidenceNodeIds");
validateNodeReferences("coverage", report.coverage || [], "nodeIds");
validateNodeReferences("risks", report.risks || [], "evidenceNodeIds");
validateNodeReferences("recommendations", report.recommendations || [], "referencesNodeIds");
validateNodeIdList("openDesignQuestions", report.openDesignQuestions || []);
validateNodeIdList("openTechnicalDecisions", report.openTechnicalDecisions || []);
validateNodeIdList("blockedTasks", report.blockedTasks || []);
validateHealth();
validateRecommendations();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Production intelligence report validation passed: ${path.relative(pluginRoot, reportPath)}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

function validateShape() {
  for (const field of ["schemaVersion", "reportId", "graphId", "generatedAt", "health", "coverage", "risks", "recommendations"]) {
    if (report[field] === undefined || report[field] === null || report[field] === "") {
      errors.push(`report: missing required field ${field}.`);
    }
  }
  if (report.schemaVersion !== "1.0.0") errors.push("report: schemaVersion should be 1.0.0.");
  if (report.graphId && graph.graphId && report.graphId !== graph.graphId) {
    errors.push(`report.graphId ${report.graphId} does not match graph.graphId ${graph.graphId}.`);
  }
}

function validateNodeReferences(label, entries, field) {
  if (!Array.isArray(entries)) {
    errors.push(`report.${label}: should be an array.`);
    return;
  }
  for (const [index, entry] of entries.entries()) {
    const ids = entry[field] || [];
    if (!Array.isArray(ids)) {
      errors.push(`report.${label}[${index}].${field}: should be an array.`);
      continue;
    }
    if (ids.length === 0 && label !== "coverage") {
      errors.push(`report.${label}[${index}].${field}: should include graph evidence unless Unknown is explicitly justified.`);
    }
    for (const id of ids) {
      if (!nodeIds.has(id)) {
        errors.push(`report.${label}[${index}].${field}: references missing graph node ${id}.`);
      }
    }
  }
}

function validateNodeIdList(label, ids) {
  if (!Array.isArray(ids)) {
    errors.push(`report.${label}: should be an array.`);
    return;
  }
  for (const id of ids) {
    if (!nodeIds.has(id)) errors.push(`report.${label}: references missing graph node ${id}.`);
  }
}

function validateHealth() {
  for (const [index, item] of (report.health || []).entries()) {
    if (!allowedHealth.has(item.status)) {
      errors.push(`report.health[${index}].status: unsupported health status ${item.status}.`);
    }
    if (!item.reason) {
      errors.push(`report.health[${index}].reason: reason is required.`);
    }
  }
}

function validateRecommendations() {
  for (const [index, recommendation] of (report.recommendations || []).entries()) {
    if (!allowedOwners.has(recommendation.suggestedOwner)) {
      errors.push(`report.recommendations[${index}].suggestedOwner: unsupported owner ${recommendation.suggestedOwner}.`);
    }
    if (!allowedPriorities.has(recommendation.priority)) {
      errors.push(`report.recommendations[${index}].priority: unsupported priority ${recommendation.priority}.`);
    }
    if (!recommendation.reason) {
      errors.push(`report.recommendations[${index}].reason: reason is required.`);
    }
    if (!recommendation.referencesNodeIds || recommendation.referencesNodeIds.length === 0) {
      errors.push(`report.recommendations[${index}].referencesNodeIds: recommendation must reference at least one graph node.`);
    }
  }
}
