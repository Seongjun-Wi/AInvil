import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const planPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_transition_plan.json");
const graphPath = resolveAInvilPath("state/production_state_graph.json");
const reviewsDir = resolveAInvilPath("reviews");
const benchmarksDir = resolveAInvilPath("benchmarks/datasets");

const allowedTypes = new Set([
  "ResolveValidationGap",
  "RequestReview",
  "AddressBlockedNode",
  "ResolveOpenQuestion",
  "ImproveTraceability",
  "RunBenchmark",
  "UpdateKpiDashboard"
]);
const allowedStatuses = new Set(["Available", "Blocked", "Not Applicable", "Needs Review"]);
const allowedPriorities = new Set(["P0", "P1", "P2", "Future"]);
const allowedEvidenceKinds = new Set(["GraphNode", "ReviewRecord", "BenchmarkCase", "KpiItem", "WorkflowReport"]);
const errors = [];

const plan = await readJson(planPath);
const graph = await readJson(graphPath);
const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
const reviewIds = new Set((await readJsonDirectory(reviewsDir)).map((review) => review.reviewId).filter(Boolean));
const benchmarkIds = new Set((await readJsonDirectory(benchmarksDir)).map((benchmark) => benchmark.benchmarkId).filter(Boolean));

validateShape();
validateTransitions();
validateSafestTransition();
validateExecutionPolicy();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Workflow transition plan validation passed: ${path.relative(pluginRoot, planPath)}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

async function readJsonDirectory(dir) {
  try {
    const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
    const values = [];
    for (const file of files) values.push(await readJson(path.join(dir, file)));
    return values;
  } catch (error) {
    errors.push(`${dir}: ${error.message}`);
    return [];
  }
}

function validateShape() {
  for (const field of ["schemaVersion", "planVersion", "planId", "generatedAt", "sourceReportId", "sourceFiles", "transitionCandidates", "safestNextTransition", "executionPolicy"]) {
    if (plan[field] === undefined || plan[field] === null || plan[field] === "") {
      errors.push(`plan: missing required field ${field}.`);
    }
  }
  if (plan.schemaVersion !== "1.0.0") errors.push("plan.schemaVersion should be 1.0.0.");
  if (!Array.isArray(plan.transitionCandidates)) errors.push("plan.transitionCandidates should be an array.");
}

function validateTransitions() {
  const ids = new Set();
  for (const [index, transition] of (plan.transitionCandidates || []).entries()) {
    const label = `transitionCandidates[${index}]`;
    if (!transition.transitionId) errors.push(`${label}: missing transitionId.`);
    if (ids.has(transition.transitionId)) errors.push(`${label}: duplicate transitionId ${transition.transitionId}.`);
    ids.add(transition.transitionId);
    if (!allowedTypes.has(transition.transitionType)) errors.push(`${label}: unsupported transitionType ${transition.transitionType}.`);
    if (!allowedStatuses.has(transition.status)) errors.push(`${label}: unsupported status ${transition.status}.`);
    if (!allowedPriorities.has(transition.priority)) errors.push(`${label}: unsupported priority ${transition.priority}.`);
    if (/executed|completed|applied/i.test(`${transition.status} ${transition.reason} ${transition.safetyNotes}`)) {
      errors.push(`${label}: transition must not claim execution happened.`);
    }
    validateArtifactRef(label, transition.targetArtifactType, transition.targetArtifactId, transition.status);
    validateEvidenceRefs(`${label}.evidenceRefs`, transition.evidenceRefs || []);
  }
}

function validateSafestTransition() {
  if (!plan.safestNextTransition) return;
  if (plan.safestNextTransition.transitionType === "NoSafeTransition") {
    return;
  }
  const ids = new Set((plan.transitionCandidates || []).map((transition) => transition.transitionId));
  if (!ids.has(plan.safestNextTransition.transitionId)) {
    errors.push(`safestNextTransition: ${plan.safestNextTransition.transitionId} is not in transitionCandidates.`);
  }
}

function validateExecutionPolicy() {
  if (plan.executionPolicy?.mode !== "ReadOnlyPlanning") {
    errors.push("executionPolicy.mode should be ReadOnlyPlanning.");
  }
  if (plan.executionPolicy?.executionAllowed !== false) {
    errors.push("executionPolicy.executionAllowed should be false.");
  }
}

function validateArtifactRef(label, kind, id, status) {
  if (!id || ["Not Applicable"].includes(status)) return;
  if (kind === "GraphNode" && !nodeIds.has(id)) errors.push(`${label}: targetArtifactId references missing graph node ${id}.`);
  if (kind === "ReviewRecord" && !reviewIds.has(id)) errors.push(`${label}: targetArtifactId references missing review ${id}.`);
  if (kind === "BenchmarkCase" && !benchmarkIds.has(id)) errors.push(`${label}: targetArtifactId references missing benchmark case ${id}.`);
}

function validateEvidenceRefs(label, refs) {
  if (!Array.isArray(refs)) {
    errors.push(`${label}: should be an array.`);
    return;
  }
  for (const [index, ref] of refs.entries()) {
    if (!allowedEvidenceKinds.has(ref.kind)) errors.push(`${label}[${index}]: unsupported evidence kind ${ref.kind}.`);
    if (ref.kind === "GraphNode" && !nodeIds.has(ref.id)) errors.push(`${label}[${index}]: references missing graph node ${ref.id}.`);
    if (ref.kind === "ReviewRecord" && !reviewIds.has(ref.id)) errors.push(`${label}[${index}]: references missing review ${ref.id}.`);
    if (ref.kind === "BenchmarkCase" && !benchmarkIds.has(ref.id)) errors.push(`${label}[${index}]: references missing benchmark case ${ref.id}.`);
  }
}
