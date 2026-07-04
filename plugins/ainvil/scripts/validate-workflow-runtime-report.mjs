import { readFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const graphPath = resolveAInvilPath("state/production_state_graph.json");
const reportPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_runtime_report.json");
const reviewsDir = resolveAInvilPath("reviews");
const benchmarksDir = resolveAInvilPath("benchmarks/datasets");
const errors = [];

const graph = await readJson(graphPath);
const report = await readJson(reportPath);
const reviewIds = new Set((await readJsonDirectory(reviewsDir)).map((review) => review.reviewId).filter(Boolean));
const benchmarkIds = new Set((await readJsonDirectory(benchmarksDir)).map((benchmark) => benchmark.benchmarkId).filter(Boolean));
const nodeIds = new Set((graph.nodes || []).map((node) => node.id));

validateShape();
validateNodeRefs("currentState.currentVision", [report.currentState?.currentVision?.nodeId].filter(Boolean));
validateNodeRefs("currentState.currentMilestone", [report.currentState?.currentMilestone?.nodeId].filter(Boolean));
validateNodeRefs("currentState.activeFeature", [report.currentState?.activeFeature?.nodeId].filter(Boolean));
validateNodeRefs("currentState.currentNextRecommendedAction.referencesNodeIds", report.currentState?.currentNextRecommendedAction?.referencesNodeIds || []);
for (const [index, blocker] of (report.workflowBlockers || []).entries()) {
  validateNodeRefs(`workflowBlockers[${index}].evidenceNodeIds`, blocker.evidenceNodeIds || []);
}
for (const [index, item] of (report.reviewStatus?.missingRequiredReviews || []).entries()) {
  validateNodeRefs(`reviewStatus.missingRequiredReviews[${index}].referencesNodeIds`, item.referencesNodeIds || []);
}
validateReviewRefs("reviewStatus.pendingReviewIds", report.reviewStatus?.pendingReviewIds || []);
validateReviewRefs("reviewStatus.approvedReviewIds", report.reviewStatus?.approvedReviewIds || []);
validateReviewRefs("reviewStatus.changesRequestedReviewIds", report.reviewStatus?.changesRequestedReviewIds || []);
for (const [index, item] of (report.reviewStatus?.majorRisks || []).entries()) {
  validateReviewRefs(`reviewStatus.majorRisks[${index}].reviewId`, [item.reviewId]);
}
validateNodeRefs("validationStatus.featuresWithoutEvidence", report.validationStatus?.featuresWithoutEvidence || []);
for (const [index, item] of (report.validationStatus?.acceptanceCriteriaWithoutEvidence || []).entries()) {
  validateNodeRefs(`validationStatus.acceptanceCriteriaWithoutEvidence[${index}].nodeId`, [item.nodeId]);
}
for (const [index, item] of (report.validationStatus?.validationLevelGaps || []).entries()) {
  validateNodeRefs(`validationStatus.validationLevelGaps[${index}].nodeId`, [item.nodeId]);
}
validateNodeRefs("nextAction.referencesNodeIds", report.nextAction?.referencesNodeIds || []);
validateReviewRefs("nextAction.referencesReviewIds", report.nextAction?.referencesReviewIds || []);
validateBenchmarkRefs("nextAction.referencesBenchmarkIds", report.nextAction?.referencesBenchmarkIds || []);

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Workflow runtime report validation passed: ${path.relative(pluginRoot, reportPath)}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

async function readJsonDirectory(dir) {
  const { readdir } = await import("node:fs/promises");
  try {
    const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
    const values = [];
    for (const file of files) {
      values.push(await readJson(path.join(dir, file)));
    }
    return values;
  } catch (error) {
    errors.push(`${dir}: ${error.message}`);
    return [];
  }
}

function validateShape() {
  const required = [
    "schemaVersion",
    "reportVersion",
    "reportId",
    "generatedAt",
    "sourceFiles",
    "currentState",
    "workflowBlockers",
    "reviewStatus",
    "validationStatus",
    "benchmarkKpiStatus",
    "nextAction"
  ];
  for (const field of required) {
    if (report[field] === undefined || report[field] === null || report[field] === "") {
      errors.push(`report: missing required field ${field}.`);
    }
  }
  if (report.schemaVersion !== "1.0.0") errors.push("report.schemaVersion should be 1.0.0.");
  if (!Array.isArray(report.sourceFiles) || report.sourceFiles.length === 0) {
    errors.push("report.sourceFiles should include at least one source.");
  }
}

function validateNodeRefs(label, ids) {
  if (!Array.isArray(ids)) {
    errors.push(`${label}: should be an array.`);
    return;
  }
  for (const id of ids) {
    if (!nodeIds.has(id)) errors.push(`${label}: references missing graph node ${id}.`);
  }
}

function validateReviewRefs(label, ids) {
  if (!Array.isArray(ids)) {
    errors.push(`${label}: should be an array.`);
    return;
  }
  for (const id of ids) {
    if (!reviewIds.has(id)) errors.push(`${label}: references missing review ${id}.`);
  }
}

function validateBenchmarkRefs(label, ids) {
  if (!Array.isArray(ids)) {
    errors.push(`${label}: should be an array.`);
    return;
  }
  for (const id of ids) {
    if (!benchmarkIds.has(id)) errors.push(`${label}: references missing benchmark case ${id}.`);
  }
}
