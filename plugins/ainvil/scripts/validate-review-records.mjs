import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const reviewsDir = path.resolve(pluginRoot, "reviews");
const graphPath = path.resolve(pluginRoot, "state/production_state_graph.json");

const reviewTypes = new Set(["Vision Review", "Design Review", "Technical Review", "Production Review", "Validation Review"]);
const reviewerRoles = new Set(["Director Layer", "Orchestrator", "GDD Agent", "Unity Agent", "Input Agent", "User"]);
const lifecycleStates = new Set([
  "Draft",
  "Review Requested",
  "Review In Progress",
  "Changes Requested",
  "Revalidation Required",
  "Approved",
  "Implemented",
  "Validated",
  "Closed",
  "Rejected",
  "Deferred",
  "Superseded"
]);
const decisions = new Set(["Approved", "Changes Requested", "Revalidation Required", "Rejected", "Deferred", "Needs user decision", "Informational"]);
const confidenceValues = new Set(["High", "Medium", "Low"]);
const severities = new Set(["Low", "Medium", "High", "Critical", "Unknown"]);

const errors = [];
const graph = await readJson(graphPath);
const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
const files = (await readdir(reviewsDir)).filter((file) => file.endsWith(".json")).sort();

if (files.length === 0) {
  errors.push("reviews: expected at least one review record JSON file.");
}

const seenReviewIds = new Set();
for (const file of files) {
  const reviewPath = path.join(reviewsDir, file);
  const review = await readJson(reviewPath);
  validateReview(review, file);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Review record validation passed (${files.length} file(s)).`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

function validateReview(review, source) {
  for (const field of ["schemaVersion", "reviewId", "artifactId", "reviewType", "reviewerRole", "date", "lifecycleState", "decision", "confidence", "evidence"]) {
    if (review[field] === undefined || review[field] === null || review[field] === "") {
      errors.push(`${source}: missing required field ${field}.`);
    }
  }
  if (review.schemaVersion !== "1.0.0") errors.push(`${source}: schemaVersion should be 1.0.0.`);
  if (review.reviewId) {
    if (seenReviewIds.has(review.reviewId)) errors.push(`${source}: duplicate reviewId ${review.reviewId}.`);
    seenReviewIds.add(review.reviewId);
  }
  if (review.reviewType && !reviewTypes.has(review.reviewType)) errors.push(`${source}: unsupported reviewType ${review.reviewType}.`);
  if (review.reviewerRole && !reviewerRoles.has(review.reviewerRole)) errors.push(`${source}: unsupported reviewerRole ${review.reviewerRole}.`);
  if (review.lifecycleState && !lifecycleStates.has(review.lifecycleState)) errors.push(`${source}: unsupported lifecycleState ${review.lifecycleState}.`);
  if (review.decision && !decisions.has(review.decision)) errors.push(`${source}: unsupported decision ${review.decision}.`);
  if (review.confidence && !confidenceValues.has(review.confidence)) errors.push(`${source}: unsupported confidence ${review.confidence}.`);

  if (review.artifactNodeId && !nodeIds.has(review.artifactNodeId)) {
    errors.push(`${source}: artifactNodeId references missing graph node ${review.artifactNodeId}.`);
  }

  for (const [index, risk] of (review.risks || []).entries()) {
    if (!risk.riskId || !risk.summary || !risk.severity) {
      errors.push(`${source}: risks[${index}] missing riskId, summary, or severity.`);
    }
    if (risk.severity && !severities.has(risk.severity)) errors.push(`${source}: risks[${index}] unsupported severity ${risk.severity}.`);
    validateNodeRefs(source, `risks[${index}].evidenceNodeIds`, risk.evidenceNodeIds || []);
  }

  for (const [index, recommendation] of (review.recommendations || []).entries()) {
    if (!recommendation.recommendationId || !recommendation.summary) {
      errors.push(`${source}: recommendations[${index}] missing recommendationId or summary.`);
    }
    if (recommendation.owner && !reviewerRoles.has(recommendation.owner)) {
      errors.push(`${source}: recommendations[${index}] unsupported owner ${recommendation.owner}.`);
    }
    validateNodeRefs(source, `recommendations[${index}].referencesNodeIds`, recommendation.referencesNodeIds || []);
  }

  if (!Array.isArray(review.evidence) || review.evidence.length === 0) {
    errors.push(`${source}: evidence should include at least one item.`);
  }
  for (const [index, item] of (review.evidence || []).entries()) {
    if (!item.kind || !item.summary) {
      errors.push(`${source}: evidence[${index}] missing kind or summary.`);
    }
    if (item.nodeId && !nodeIds.has(item.nodeId)) {
      errors.push(`${source}: evidence[${index}].nodeId references missing graph node ${item.nodeId}.`);
    }
  }
}

function validateNodeRefs(source, label, ids) {
  if (!Array.isArray(ids)) {
    errors.push(`${source}: ${label} should be an array.`);
    return;
  }
  for (const id of ids) {
    if (!nodeIds.has(id)) errors.push(`${source}: ${label} references missing graph node ${id}.`);
  }
}
