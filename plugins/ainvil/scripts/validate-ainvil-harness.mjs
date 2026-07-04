import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const errors = [];

const requiredDocs = [
  "docs/AInvil_Harness_Engineering.md",
  "docs/AInvil_Harness_Technical_Design.md"
];

const requiredFiles = [
  "harness/README.md",
  "schemas/harness_scenario.schema.json",
  "scripts/run-ainvil-live-harness.mjs"
];

const requiredScenarioIds = new Set([
  "scenario.top_down_collectible",
  "scenario.inventory_grid_ui",
  "scenario.character_animation_binding"
]);

const allowedDocumentTypes = new Set([
  "GDD",
  "Feature Spec",
  "Technical Design",
  "ProjectState",
  "TaskGraph",
  "Project Structure",
  "Scene Blueprint",
  "Component Contract",
  "Prefab Contract",
  "Input Spec",
  "UnityChangeSet",
  "Playtest Report"
]);

const requiredTraceDocuments = new Set([
  "GDD",
  "Technical Design"
]);

const allowedCapabilities = new Set([
  "Project inspection",
  "Document traceability",
  "Milestone planning",
  "Asset-first construction",
  "Scene construction",
  "Component and script implementation",
  "Prefab production",
  "Package enablement",
  "Project settings",
  "UI implementation",
  "Input implementation",
  "Animation and character behavior",
  "Camera and presentation",
  "Physics and interaction",
  "Audio feedback",
  "Navigation and AI",
  "2D, tilemap, terrain, particles, and VFX",
  "Build and release validation",
  "Performance validation",
  "Document synchronization"
]);

const allowedArtifactKinds = new Set([
  "Scene",
  "GameObject",
  "Component",
  "Prefab",
  "Script",
  "ScriptableObject",
  "Material",
  "UI",
  "InputAction",
  "Package",
  "ProjectSetting",
  "ValidationReport"
]);

const allowedArtifactStatuses = new Set([
  "Implemented",
  "Prototype default",
  "Mocked",
  "Planned",
  "Needs design confirmation",
  "Needs technical confirmation"
]);

const allowedValidationTypes = new Set([
  "Static",
  "Compile",
  "Console",
  "Scene",
  "Asset",
  "Prefab",
  "Component",
  "Input",
  "PlayMode",
  "UI",
  "Animation",
  "Build",
  "DocumentSync"
]);

const allowedFailureClasses = new Set([
  "DesignTraceMissing",
  "TechnicalPlanMissing",
  "UnityArtifactMissing",
  "AssetFallbackIncorrect",
  "InputNotReceived",
  "GameLogicFailed",
  "BridgeDisconnected",
  "PreconditionFailed",
  "ConsoleError",
  "CompileError",
  "PackageMissing",
  "SettingsMismatch",
  "ValidationNotRun",
  "Unknown"
]);

await checkRequiredFiles();
await checkScenarioSchema();
await checkScenarios();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("AInvil harness validation passed.");

async function checkRequiredFiles() {
  for (const file of [...requiredDocs, ...requiredFiles]) {
    await mustExist(path.join(pluginRoot, file));
  }
}

async function checkScenarioSchema() {
  const schemaPath = path.join(pluginRoot, "schemas", "harness_scenario.schema.json");
  const schema = await readJson(schemaPath);
  requireValue(schema.title === "AInvil HarnessScenario", `${schemaPath}: title should be AInvil HarnessScenario.`);
  requireValue(schema.properties?.expectedDocuments, `${schemaPath}: expectedDocuments property is required.`);
  requireValue(schema.properties?.expectedUnityCapabilities, `${schemaPath}: expectedUnityCapabilities property is required.`);
  requireValue(schema.properties?.validationChecks, `${schemaPath}: validationChecks property is required.`);
}

async function checkScenarios() {
  const scenarioDir = path.join(pluginRoot, "harness", "scenarios");
  await mustExist(scenarioDir);

  let files = [];
  try {
    files = (await readdir(scenarioDir)).filter((file) => file.endsWith(".json")).sort();
  } catch (error) {
    errors.push(`${scenarioDir}: ${error.message}`);
    return;
  }

  if (files.length === 0) {
    errors.push(`${scenarioDir}: no scenario JSON files found.`);
    return;
  }

  const seenIds = new Set();
  for (const file of files) {
    const scenarioPath = path.join(scenarioDir, file);
    const scenario = await readJson(scenarioPath);
    validateScenario(scenario, scenarioPath);
    if (typeof scenario.id === "string") {
      seenIds.add(scenario.id);
    }
  }

  for (const id of requiredScenarioIds) {
    if (!seenIds.has(id)) {
      errors.push(`harness/scenarios: missing required scenario id ${id}.`);
    }
  }
}

function validateScenario(scenario, source) {
  requireString(scenario.schemaVersion, `${source}: schemaVersion is required.`);
  if (scenario.schemaVersion !== "1.0.0") {
    errors.push(`${source}: schemaVersion should be 1.0.0.`);
  }
  requireString(scenario.id, `${source}: id is required.`);
  requireString(scenario.title, `${source}: title is required.`);
  requireString(scenario.userGoal, `${source}: userGoal is required.`);
  requireString(scenario.milestone, `${source}: milestone is required.`);

  if (typeof scenario.interactive !== "boolean") {
    errors.push(`${source}: interactive should be boolean.`);
  }
  if (!["Low", "Medium", "High"].includes(scenario.riskLevel)) {
    errors.push(`${source}: riskLevel should be Low, Medium, or High.`);
  }

  validateDocuments(scenario, source);
  validateCapabilities(scenario, source);
  validateArtifacts(scenario, source);
  validateChecks(scenario, source);
  validatePassCriteria(scenario, source);
}

function validateDocuments(scenario, source) {
  const documents = scenario.expectedDocuments;
  if (!Array.isArray(documents) || documents.length === 0) {
    errors.push(`${source}: expectedDocuments should contain at least one document expectation.`);
    return;
  }

  const types = new Set();
  for (const [index, document] of documents.entries()) {
    const prefix = `${source}: expectedDocuments[${index}]`;
    if (!allowedDocumentTypes.has(document?.type)) {
      errors.push(`${prefix}: unsupported document type ${document?.type}.`);
    }
    requireString(document?.requirementRef, `${prefix}: requirementRef is required.`);
    requireString(document?.expected, `${prefix}: expected is required.`);
    if (document?.type) {
      types.add(document.type);
    }
  }

  for (const requiredType of requiredTraceDocuments) {
    if (!types.has(requiredType)) {
      errors.push(`${source}: expectedDocuments should include ${requiredType}.`);
    }
  }

  if (!types.has("TaskGraph") && !types.has("UnityChangeSet")) {
    errors.push(`${source}: expectedDocuments should include TaskGraph or UnityChangeSet.`);
  }
}

function validateCapabilities(scenario, source) {
  const capabilities = scenario.expectedUnityCapabilities;
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    errors.push(`${source}: expectedUnityCapabilities should contain at least one capability.`);
    return;
  }

  for (const capability of capabilities) {
    if (!allowedCapabilities.has(capability)) {
      errors.push(`${source}: unsupported capability ${capability}.`);
    }
  }

  for (const requiredCapability of ["Project inspection", "Document traceability", "Milestone planning", "Document synchronization"]) {
    if (!capabilities.includes(requiredCapability)) {
      errors.push(`${source}: expectedUnityCapabilities should include ${requiredCapability}.`);
    }
  }
}

function validateArtifacts(scenario, source) {
  const artifacts = scenario.expectedUnityArtifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    errors.push(`${source}: expectedUnityArtifacts should contain at least one artifact.`);
    return;
  }

  for (const [index, artifact] of artifacts.entries()) {
    const prefix = `${source}: expectedUnityArtifacts[${index}]`;
    if (!allowedArtifactKinds.has(artifact?.kind)) {
      errors.push(`${prefix}: unsupported artifact kind ${artifact?.kind}.`);
    }
    requireString(artifact?.path, `${prefix}: path is required.`);
    requireString(artifact?.requirementRef, `${prefix}: requirementRef is required.`);
    if (!allowedArtifactStatuses.has(artifact?.status)) {
      errors.push(`${prefix}: unsupported status ${artifact?.status}.`);
    }
  }
}

function validateChecks(scenario, source) {
  const checks = scenario.validationChecks;
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push(`${source}: validationChecks should contain at least one validation check.`);
    return;
  }

  const checkTypes = new Set();
  for (const [index, check] of checks.entries()) {
    const prefix = `${source}: validationChecks[${index}]`;
    requireString(check?.id, `${prefix}: id is required.`);
    if (!allowedValidationTypes.has(check?.type)) {
      errors.push(`${prefix}: unsupported validation type ${check?.type}.`);
    }
    requireString(check?.target, `${prefix}: target is required.`);
    requireString(check?.expected, `${prefix}: expected is required.`);
    if (!allowedFailureClasses.has(check?.failureClass)) {
      errors.push(`${prefix}: unsupported failureClass ${check?.failureClass}.`);
    }
    if (check?.type) {
      checkTypes.add(check.type);
    }
  }

  if (!checkTypes.has("DocumentSync")) {
    errors.push(`${source}: validationChecks should include DocumentSync.`);
  }
  if (scenario.interactive && !checkTypes.has("Input") && !checkTypes.has("PlayMode")) {
    errors.push(`${source}: interactive scenarios should include Input or PlayMode validation.`);
  }
}

function validatePassCriteria(scenario, source) {
  if (!Array.isArray(scenario.passCriteria) || scenario.passCriteria.length === 0) {
    errors.push(`${source}: passCriteria should contain at least one criterion.`);
    return;
  }

  for (const [index, criterion] of scenario.passCriteria.entries()) {
    requireString(criterion, `${source}: passCriteria[${index}] should be a non-empty string.`);
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

async function mustExist(filePath) {
  try {
    await access(filePath, constants.F_OK);
  } catch {
    errors.push(`${filePath}: missing.`);
  }
}

function requireString(value, message) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(message);
  }
}

function requireValue(value, message) {
  if (!value) {
    errors.push(message);
  }
}
