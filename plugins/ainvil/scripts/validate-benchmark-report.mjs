import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const reportPath = resolveAInvilPath(process.argv[2] || "benchmarks/reports/latest-benchmark-report.json");
const allowedCaseStatuses = new Set(["DatasetReady", "NeedsDatasetFix"]);
const allowedCategoryStatuses = new Set(["DatasetReady", "MissingDataset"]);
const errors = [];

const report = await readJson(reportPath);
validateShape();
validateDataset();
validateCategoryResults();
validateCases();
validateScores();
validateRecommendations();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Benchmark report validation passed: ${relativeAInvilPath(reportPath)}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

function validateShape() {
  for (const field of ["schemaVersion", "reportId", "generatedAt", "runMode", "evaluator", "summary", "dataset", "scores", "categoryResults", "cases", "recommendations"]) {
    if (report[field] === undefined || report[field] === null || report[field] === "") {
      errors.push(`report: missing required field ${field}.`);
    }
  }
  if (report.schemaVersion !== "1.0.0") errors.push("report: schemaVersion should be 1.0.0.");
  if (report.runMode !== "DatasetBaseline") errors.push("report: runMode should be DatasetBaseline for this validator.");
}

function validateDataset() {
  if (!report.dataset || typeof report.dataset !== "object") {
    errors.push("report.dataset: should be an object.");
    return;
  }
  if (!Number.isInteger(report.dataset.caseCount) || report.dataset.caseCount <= 0) {
    errors.push("report.dataset.caseCount: should be a positive integer.");
  }
  for (const field of ["categoriesPresent", "missingCategories", "versions"]) {
    if (!Array.isArray(report.dataset[field])) {
      errors.push(`report.dataset.${field}: should be an array.`);
    }
  }
}

function validateCategoryResults() {
  if (!Array.isArray(report.categoryResults) || report.categoryResults.length === 0) {
    errors.push("report.categoryResults: should be a non-empty array.");
    return;
  }
  for (const [index, result] of report.categoryResults.entries()) {
    if (!result.category) errors.push(`report.categoryResults[${index}].category: required.`);
    if (!allowedCategoryStatuses.has(result.status)) {
      errors.push(`report.categoryResults[${index}].status: unsupported status ${result.status}.`);
    }
    if (!Number.isInteger(result.caseCount) || result.caseCount < 0) {
      errors.push(`report.categoryResults[${index}].caseCount: should be a non-negative integer.`);
    }
  }
}

function validateCases() {
  if (!Array.isArray(report.cases) || report.cases.length === 0) {
    errors.push("report.cases: should be a non-empty array.");
    return;
  }
  for (const [index, item] of report.cases.entries()) {
    for (const field of ["benchmarkId", "category", "title", "version", "status"]) {
      if (!item[field]) errors.push(`report.cases[${index}].${field}: required.`);
    }
    if (!allowedCaseStatuses.has(item.status)) {
      errors.push(`report.cases[${index}].status: unsupported status ${item.status}.`);
    }
    for (const field of ["expectedObservationCount", "expectedRecommendationCount", "scoringCriterionCount", "failureModeCount"]) {
      if (!Number.isInteger(item[field]) || item[field] < 0) {
        errors.push(`report.cases[${index}].${field}: should be a non-negative integer.`);
      }
    }
  }
}

function validateScores() {
  if (!Array.isArray(report.scores) || report.scores.length === 0) {
    errors.push("report.scores: should be a non-empty array.");
    return;
  }
  for (const [index, score] of report.scores.entries()) {
    if (!score.dimension) errors.push(`report.scores[${index}].dimension: required.`);
    if (score.score !== "NotRun" && !(Number.isInteger(score.score) && score.score >= 0 && score.score <= 5)) {
      errors.push(`report.scores[${index}].score: should be NotRun or an integer from 0 to 5.`);
    }
    if (!score.evidence) errors.push(`report.scores[${index}].evidence: required.`);
  }
}

function validateRecommendations() {
  if (!Array.isArray(report.recommendations) || report.recommendations.length === 0) {
    errors.push("report.recommendations: should be a non-empty array.");
  }
}
