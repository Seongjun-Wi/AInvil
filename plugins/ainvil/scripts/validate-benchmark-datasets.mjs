import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const datasetsDir = path.resolve(pluginRoot, "benchmarks/datasets");

const allowedCategories = new Set([
  "Design Review",
  "GDD Completion",
  "Technical Translation",
  "Production Planning",
  "Unity Production",
  "Validation",
  "Project Management",
  "Director Quality"
]);

const requiredFields = [
  "schemaVersion",
  "benchmarkId",
  "category",
  "title",
  "version",
  "inputs",
  "expectedObservations",
  "expectedRecommendations",
  "scoringCriteria",
  "failureModes"
];

const requiredSeedCategories = new Set([
  "Design Review",
  "GDD Completion",
  "Technical Translation",
  "Validation",
  "Director Quality"
]);

const errors = [];
const files = await listJsonFiles(datasetsDir);
const seenIds = new Set();
const seenCategories = new Set();

if (files.length === 0) {
  errors.push("benchmarks/datasets: expected at least one benchmark dataset JSON file.");
}

for (const file of files) {
  const dataset = await readJson(path.join(datasetsDir, file));
  validateDataset(dataset, file);
}

for (const category of requiredSeedCategories) {
  if (!seenCategories.has(category)) {
    errors.push(`benchmarks/datasets: missing seed benchmark category ${category}.`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Benchmark dataset validation passed (${files.length} file(s)).`);

async function listJsonFiles(dir) {
  try {
    return (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  } catch (error) {
    errors.push(`${dir}: ${error.message}`);
    return [];
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

function validateDataset(dataset, source) {
  for (const field of requiredFields) {
    if (dataset[field] === undefined || dataset[field] === null || dataset[field] === "") {
      errors.push(`${source}: missing required field ${field}.`);
    }
  }

  if (dataset.schemaVersion !== "1.0.0") {
    errors.push(`${source}: schemaVersion should be 1.0.0.`);
  }

  if (dataset.benchmarkId) {
    if (!/^BENCH-[A-Za-z0-9]+-[A-Za-z0-9]+-[0-9]{3}$/.test(dataset.benchmarkId)) {
      errors.push(`${source}: benchmarkId should match BENCH-Category-Case-001.`);
    }
    if (seenIds.has(dataset.benchmarkId)) {
      errors.push(`${source}: duplicate benchmarkId ${dataset.benchmarkId}.`);
    }
    seenIds.add(dataset.benchmarkId);
  }

  if (dataset.category) {
    if (!allowedCategories.has(dataset.category)) {
      errors.push(`${source}: unsupported category ${dataset.category}.`);
    } else {
      seenCategories.add(dataset.category);
    }
  }

  requireSemver(dataset.version, source, "version");
  requireNonEmptyObject(dataset.inputs, source, "inputs");
  requireStringArray(dataset.expectedObservations, source, "expectedObservations");
  requireStringArray(dataset.expectedRecommendations, source, "expectedRecommendations");
  requireStringArray(dataset.scoringCriteria, source, "scoringCriteria");
  requireStringArray(dataset.failureModes, source, "failureModes");
}

function requireSemver(value, source, field) {
  if (value && !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(value)) {
    errors.push(`${source}: ${field} should be semantic version format.`);
  }
}

function requireNonEmptyObject(value, source, field) {
  if (!value || Array.isArray(value) || typeof value !== "object" || Object.keys(value).length === 0) {
    errors.push(`${source}: ${field} should be a non-empty object.`);
  }
}

function requireStringArray(value, source, field) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${source}: ${field} should be a non-empty array.`);
    return;
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      errors.push(`${source}: ${field}[${index}] should be a non-empty string.`);
    }
  }
}
