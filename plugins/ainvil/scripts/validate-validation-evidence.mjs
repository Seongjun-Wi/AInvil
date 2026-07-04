import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const evidenceDir = resolveAInvilPath("validation/evidence");
const allowedStatuses = new Set(["Passed", "Failed", "Blocked", "Warning", "NotRun"]);
const allowedLevels = new Set(["Not Checked", "Unity Inspection", "Compile Verified", "Play Mode Verified", "Runtime Tested"]);
const errors = [];
let files = [];
try {
  files = (await readdir(evidenceDir)).filter((file) => file.endsWith(".json")).sort();
} catch (error) {
  errors.push(`${relativeAInvilPath(evidenceDir)}: ${error.message}`);
}
if (files.length === 0) errors.push("validation/evidence: expected at least one evidence JSON file.");
for (const file of files) validateEvidence(file, JSON.parse(await readFile(path.join(evidenceDir, file), "utf8")));
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`Validation evidence validation passed (${files.length} file(s)).`);

function validateEvidence(file, evidence) {
  for (const field of ["schemaVersion", "evidenceId", "source", "scenarioId", "validationLevel", "status", "failureClass", "acceptanceIds", "requirementIds", "unityTargets", "checks", "startedAt", "finishedAt", "remainingGaps", "nextActions"]) {
    if (evidence[field] === undefined || evidence[field] === null || evidence[field] === "") errors.push(`${file}: missing ${field}.`);
  }
  if (evidence.schemaVersion !== "1.0.0") errors.push(`${file}: schemaVersion should be 1.0.0.`);
  if (!allowedStatuses.has(evidence.status)) errors.push(`${file}: unsupported status ${evidence.status}.`);
  if (!allowedLevels.has(evidence.validationLevel)) errors.push(`${file}: unsupported validationLevel ${evidence.validationLevel}.`);
  if (!Array.isArray(evidence.checks) || evidence.checks.length === 0) errors.push(`${file}: checks should be non-empty.`);
  if (evidence.status === "Passed" && evidence.checks.some((check) => check.status !== "Passed")) errors.push(`${file}: Passed evidence includes non-passed checks.`);
  if (evidence.status === "Passed" && acceptanceIdsFor(evidence).length === 0) errors.push(`${file}: Passed evidence requires acceptanceIds or acceptanceId.`);
  if (evidence.status === "Passed" && Array.isArray(evidence.validationResults) && evidence.validationResults.length === 0) errors.push(`${file}: Passed evidence requires evaluated Validation Design results.`);
  if (evidence.status === "Passed" && Array.isArray(evidence.assertions) && evidence.assertions.length === 0) errors.push(`${file}: Passed evidence requires assertion results.`);
  if (Array.isArray(evidence.assertions) && evidence.status === "Passed" && evidence.assertions.some((assertion) => assertion.result !== "Passed")) errors.push(`${file}: Passed evidence includes failed assertions.`);
  if (evidence.status === "Blocked" && (!evidence.failureClass || evidence.failureClass === "None" || !evidence.nextActions?.length)) errors.push(`${file}: Blocked evidence requires failureClass and nextActions.`);
  if (evidence.validationLevel === "Runtime Tested" && !evidence.checks.some((check) => ["PlayMode", "Input"].includes(check.type))) errors.push(`${file}: Runtime Tested requires PlayMode/Input checks.`);
}

function acceptanceIdsFor(evidence) {
  const values = Array.isArray(evidence?.acceptanceIds) ? [...evidence.acceptanceIds] : [];
  if (evidence?.acceptanceId) values.push(evidence.acceptanceId);
  return [...new Set(values.filter(Boolean))];
}
