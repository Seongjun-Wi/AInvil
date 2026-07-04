import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pluginRoot, resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const runsDir = resolveAInvilPath("workflow/runs");
const planPath = resolveAInvilPath("reports/workflow_transition_plan.json");
const errors = [];

const plan = await readJson(planPath);
const transitionIds = new Set((plan.transitionCandidates || []).map((transition) => transition.transitionId));
const records = await readRecords();

validateRecords();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Workflow execution record validation passed (${records.length} record(s)).`);

async function readRecords() {
  try {
    const files = (await readdir(runsDir)).filter((file) => file.endsWith(".json")).sort();
    const values = [];
    for (const file of files) values.push({ file, path: path.join(runsDir, file), data: await readJson(path.join(runsDir, file)) });
    return values;
  } catch (error) {
    errors.push(`${relativeAInvilPath(runsDir)}: ${error.message}`);
    return [];
  }
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${relativeAInvilPath(filePath)}: ${error.message}`);
    return {};
  }
}

function validateRecords() {
  const executionIds = new Set();
  for (const item of records) {
    const record = item.data;
    const label = relativeAInvilPath(item.path);
    for (const field of ["schemaVersion", "executionVersion", "executionId", "transitionId", "transitionType", "approvalClass", "startedAt", "status", "inputs", "outputs", "evidenceRefs", "errors"]) {
      if (record[field] === undefined || record[field] === null || record[field] === "") errors.push(`${label}: missing ${field}.`);
    }
    if (record.schemaVersion !== "1.0.0") errors.push(`${label}: schemaVersion should be 1.0.0.`);
    if (executionIds.has(record.executionId) && item.file !== "latest.json") errors.push(`${label}: duplicate executionId ${record.executionId}.`);
    executionIds.add(record.executionId);
    if (!transitionIds.has(record.transitionId) && record.transitionId !== "ExternalManual") {
      errors.push(`${label}: transitionId ${record.transitionId} is not in latest transition plan.`);
    }
    if (["EvidenceRequired", "UserApprovalRequired", "ReviewRequired", "Blocked", "Forbidden"].includes(record.approvalClass) && record.status === "Succeeded") {
      errors.push(`${label}: ${record.approvalClass} transition must not succeed without explicit evidence handling.`);
    }
    for (const filePath of record.outputs?.createdFiles || []) validateOutputFile(label, filePath);
    for (const filePath of record.outputs?.updatedFiles || []) validateOutputFile(label, filePath);
  }
}

function validateOutputFile(label, relativePath) {
  if (!existsSync(resolveAInvilPath(relativePath))) {
    errors.push(`${label}: output file does not exist: ${relativePath}.`);
  }
}
