import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const inputPath = process.argv[2] || "validation/design";
const allowedActions = new Set(["openScene", "enterPlayMode", "exitPlayMode", "click", "pressKey", "wait", "invoke"]);
const allowedObservations = new Set(["activeScene", "objectExists", "objectActive", "componentExists", "textValue", "debugStateJson", "editorLogErrors"]);
const allowedOperators = new Set(["equals", "notEquals", "greaterThan", "lessThan", "contains", "exists", "active", "distanceGreaterThan"]);
const allowedProbes = new Set(["SceneProbe", "UIProbe", "ComponentProbe", "LogProbe", "DebugStateProbe"]);
const errors = [];
const warnings = [];

const files = await validationDesignFiles(inputPath);
if (files.length === 0) errors.push(`${inputPath}: expected at least one validation design JSON file.`);

for (const file of files) {
  const data = JSON.parse(await readFile(file, "utf8"));
  validateDesignSet(file, data);
}

for (const warning of warnings) console.warn(`WARNING ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Validation design validation passed (${files.length} file(s)).`);

async function validationDesignFiles(relativeOrAbsolutePath) {
  const target = path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : resolveAInvilPath(relativeOrAbsolutePath);
  if (target.endsWith(".json")) return [target];
  try {
    return (await readdir(target))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => path.join(target, file));
  } catch (error) {
    errors.push(`${relativeAInvilPath(target)}: ${error.message}`);
    return [];
  }
}

function validateDesignSet(file, data) {
  const label = relativeAInvilPath(file);
  if (data.schemaVersion !== "1.0.0") errors.push(`${label}: schemaVersion should be 1.0.0.`);
  if (!data.designSetId) errors.push(`${label}: missing designSetId.`);
  if (!Array.isArray(data.validations) || data.validations.length === 0) {
    errors.push(`${label}: validations should be non-empty.`);
    return;
  }
  for (const [index, validation] of data.validations.entries()) {
    validateItem(`${label}: validations[${index}]`, validation);
  }
}

function validateItem(label, validation) {
  for (const field of ["validationId", "testType", "actions", "observations", "passCriteria", "evidenceToRecord", "requiredProbes"]) {
    if (validation[field] === undefined || validation[field] === null || validation[field] === "") errors.push(`${label}: missing ${field}.`);
  }
  if (!validation.requirementId && !validation.acceptanceId && !Array.isArray(validation.acceptanceIds)) {
    errors.push(`${label}: missing requirementId or acceptanceId link.`);
  }
  if (!validation.acceptanceId && (!Array.isArray(validation.acceptanceIds) || validation.acceptanceIds.length === 0)) {
    errors.push(`${label}: acceptanceId or acceptanceIds is required for traceability/dashboard linkage.`);
  }
  if (!validation.scene && !validation.targetContext) errors.push(`${label}: scene or targetContext is required.`);
  requireNonEmptyArray(label, validation, "actions");
  requireNonEmptyArray(label, validation, "observations");
  requireNonEmptyArray(label, validation, "passCriteria");
  requireNonEmptyArray(label, validation, "evidenceToRecord");
  requireNonEmptyArray(label, validation, "requiredProbes");

  for (const action of validation.actions || []) {
    if (!allowedActions.has(action.type)) warnings.push(`${label}: unsupported action type ${action.type}; harness will report it as not verified.`);
  }
  for (const observation of validation.observations || []) {
    if (!observation.name) errors.push(`${label}: observation missing name.`);
    if (!allowedObservations.has(observation.type)) warnings.push(`${label}: unsupported observation type ${observation.type}; harness will report it as not verified.`);
  }
  for (const criterion of validation.passCriteria || []) {
    if (!criterion.id) errors.push(`${label}: passCriteria missing id.`);
    if (!criterion.observation) errors.push(`${label}: passCriteria ${criterion.id || "unknown"} missing observation.`);
    if (!allowedOperators.has(criterion.operator)) warnings.push(`${label}: unsupported passCriteria operator ${criterion.operator}; harness will fail that assertion.`);
  }
  for (const probe of validation.requiredProbes || []) {
    if (!allowedProbes.has(probe)) warnings.push(`${label}: unknown required probe ${probe}.`);
  }
}

function requireNonEmptyArray(label, object, field) {
  if (!Array.isArray(object[field]) || object[field].length === 0) errors.push(`${label}: ${field} should be non-empty.`);
}
