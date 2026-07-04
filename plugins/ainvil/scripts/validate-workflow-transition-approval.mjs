import { readFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const approvalPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_transition_approval.json");
const planPath = resolveAInvilPath("reports/workflow_transition_plan.json");
const errors = [];

const approval = await readJson(approvalPath);
const plan = await readJson(planPath);
const transitionIds = new Set((plan.transitionCandidates || []).map((transition) => transition.transitionId));
const allowedClasses = new Set(["AutoEligible", "UserApprovalRequired", "ReviewRequired", "EvidenceRequired", "Blocked", "Forbidden"]);
const allowedReadiness = new Set(["Ready", "NotReady", "NotApplicable"]);
const allowedSafety = new Set(["LowRisk", "MediumRisk", "HighRisk", "Destructive", "Unknown"]);

validateShape();
validateApprovalRecords();
validateExecutionPolicy();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Workflow transition approval validation passed: ${path.relative(pluginRoot, approvalPath)}.`);

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error.message}`);
    return {};
  }
}

function validateShape() {
  for (const field of ["schemaVersion", "approvalVersion", "approvalId", "generatedAt", "sourcePlanId", "sourceFiles", "approvalRecords", "summary", "safestNextApprovedAction", "executionPolicy"]) {
    if (approval[field] === undefined || approval[field] === null || approval[field] === "") {
      errors.push(`approval: missing required field ${field}.`);
    }
  }
  if (approval.schemaVersion !== "1.0.0") errors.push("approval.schemaVersion should be 1.0.0.");
  if (approval.sourcePlanId && plan.planId && approval.sourcePlanId !== plan.planId) {
    errors.push(`approval.sourcePlanId ${approval.sourcePlanId} does not match plan.planId ${plan.planId}.`);
  }
}

function validateApprovalRecords() {
  const ids = new Set();
  for (const [index, record] of (approval.approvalRecords || []).entries()) {
    const label = `approvalRecords[${index}]`;
    if (ids.has(record.transitionId)) errors.push(`${label}: duplicate transitionId ${record.transitionId}.`);
    ids.add(record.transitionId);
    if (!transitionIds.has(record.transitionId)) errors.push(`${label}: references missing transition ${record.transitionId}.`);
    if (!allowedClasses.has(record.approvalClass)) errors.push(`${label}: invalid approvalClass ${record.approvalClass}.`);
    if (!allowedReadiness.has(record.executionReadiness)) errors.push(`${label}: invalid executionReadiness ${record.executionReadiness}.`);
    if (!allowedSafety.has(record.safetyLevel)) errors.push(`${label}: invalid safetyLevel ${record.safetyLevel}.`);
    if (record.approvalClass === "Forbidden" && !record.reason) errors.push(`${label}: forbidden transitions require a reason.`);
    if (record.approvalClass === "EvidenceRequired" && (!record.requiredEvidence || record.requiredEvidence.length === 0)) {
      errors.push(`${label}: evidence-required transitions must list required evidence.`);
    }
    if (/executed|completed|applied/i.test(`${record.reason} ${record.userFacingMessage}`)) {
      errors.push(`${label}: approval record must not claim execution happened.`);
    }
  }
}

function validateExecutionPolicy() {
  if (approval.executionPolicy?.mode !== "ReadOnlyApprovalClassification") {
    errors.push("executionPolicy.mode should be ReadOnlyApprovalClassification.");
  }
  if (approval.executionPolicy?.executionAllowed !== false) {
    errors.push("executionPolicy.executionAllowed should be false.");
  }
}
