import { access, readdir, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coreModuleFiles, missingRequiredArtifacts } from "../core/artifact-checks.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");

const requiredTemplates = [
  "gdd.md",
  "design_review.md",
  "director_review.md",
  "milestone_review.md",
  "project_health_report.md",
  "production_health_report.md",
  "review_report.md",
  "governance_rules.md",
  "benchmark_report.md",
  "scoring_rubric.md",
  "workflow_runtime_report.md",
  "workflow_transition_plan.md",
  "workflow_transition_approval.md",
  "architecture_retrospective.md",
  "kpi_dashboard.md",
  "design_pattern_library.md",
  "gdd_completeness_report.md",
  "technical_design.md",
  "feature_spec.md",
  "traceability_matrix.md",
  "project_dashboard.md",
  "design_decision_log.md",
  "project_structure.md",
  "scene_blueprint.md",
  "component_contract.md",
  "prefab_contract.md",
  "input_spec.md",
  "playtest_report.md",
  "input_validation_result.md"
];

const requiredUnityFiles = [
  "unity-package/Packages/com.codex.unity-bridge/package.json",
  "unity-package/Packages/com.codex.unity-bridge/Editor/CodexUnityBridgeServer.cs",
  "unity-package/Packages/com.codex.unity-bridge/Runtime/AInvilRuntimeInputTestBridge.cs",
  "unity-package/Packages/com.codex.unity-bridge/Runtime/AInvilInputTestBridge.cs"
];

const requiredHarnessFiles = [
  "docs/AInvil_Product_Architecture.md",
  "docs/AInvil_Manifesto.md",
  "docs/AInvil_Architectural_Principles.md",
  "docs/AInvil_RFC_Process.md",
  "docs/AInvil_Product_Governance.md",
  "docs/AInvil_Maturity_Model.md",
  "docs/AInvil_Dogfooding_Initiative.md",
  "docs/AInvil_Platform_Architecture.md",
  "docs/AInvil_Platform_Migration_Plan.md",
  "docs/AInvil_Package_Boundaries.md",
  "docs/AInvil_Workflow_Runtime_Platform_Plan.md",
  "docs/AInvil_Production_Core_Product_Plan.md",
  "docs/AInvil_Production_Core_Technical_Spec.md",
  "docs/AInvil_Playability_Validation_Technical_Plan.md",
  "docs/production-core/PC1_Evidence_Baseline_Technical_Spec.md",
  "docs/production-core/PC2_Runtime_Execution_Records_Technical_Spec.md",
  "docs/production-core/PC3_Live_Unity_Proof_Technical_Spec.md",
  "docs/production-core/PC4_Sync_And_Resume_Technical_Spec.md",
  "docs/production-core/PC5_Production_Core_Gate_Technical_Spec.md",
  "docs/AInvil_CLI_Prototype.md",
  "docs/AInvil_Workflow_Runtime_Report.md",
  "docs/AInvil_Workflow_Transition_Planner.md",
  "docs/AInvil_Workflow_Transition_Approval_Model.md",
  "docs/Studio_KPI_Framework.md",
  "docs/KPI_Collection_Strategy.md",
  "docs/KPI_Review_Process.md",
  "docs/AInvil_Director_Layer.md",
  "docs/AInvil_Production_State_Graph.md",
  "docs/AInvil_Production_State_Graph_Migration.md",
  "docs/AInvil_Production_Intelligence.md",
  "docs/AInvil_Review_Governance.md",
  "docs/AInvil_Benchmark.md",
  "docs/AInvil_Benchmark_Workflow.md",
  "docs/AInvil_Benchmark_Dataset_Structure.md",
  "docs/Studio_Playbook.md",
  "docs/Studio_Playbook_Validation_Checklist.md",
  "docs/Studio_Playbook_Integration_Guide.md",
  "docs/AInvil_Harness_Engineering.md",
  "docs/AInvil_Harness_Technical_Design.md",
  "docs/Unity_Bridge_Validation_Probe_RPC_Technical_Spec.md",
  "harness/README.md",
  "harness/scenarios/top_down_collectible.json",
  "harness/scenarios/inventory_grid_ui.json",
  "harness/scenarios/character_animation_binding.json",
  "schemas/harness_scenario.schema.json",
  "schemas/production_state_graph.schema.json",
  "schemas/production_intelligence_report.schema.json",
  "schemas/review_record.schema.json",
  "schemas/benchmark_case.schema.json",
  "schemas/workflow_runtime_report.schema.json",
  "schemas/workflow_transition_plan.schema.json",
  "schemas/workflow_transition_approval.schema.json",
  "schemas/workflow_execution_record.schema.json",
  "schemas/validation_evidence.schema.json",
  "schemas/validation_design.schema.json",
  "schemas/traceability_view.schema.json",
  "schemas/project_dashboard.schema.json",
  "schemas/sync_report.schema.json",
  "schemas/workspace_manifest.schema.json",
  "schemas/onboarding_doctor_report.schema.json",
  "state/production_state_graph.json",
  "reviews/e2e_validation_review.json",
  "reports/workflow_runtime_report.json",
  "reports/workflow_transition_plan.json",
  "reports/workflow_transition_approval.json",
  "benchmarks/datasets/design_review_poor_gdd.json",
  "benchmarks/datasets/gdd_completion_incomplete.json",
  "benchmarks/datasets/technical_translation_average_gdd.json",
  "benchmarks/datasets/validation_missing_evidence.json",
  "benchmarks/datasets/director_feature_creep.json",
  "scripts/validate-ainvil-harness.mjs",
  "scripts/validate-production-state-graph.mjs",
  "scripts/generate-production-intelligence-report.mjs",
  "scripts/validate-production-intelligence-report.mjs",
  "scripts/validate-review-records.mjs",
  "scripts/validate-benchmark-datasets.mjs",
  "scripts/generate-workflow-runtime-report.mjs",
  "scripts/validate-workflow-runtime-report.mjs",
  "scripts/generate-workflow-transition-plan.mjs",
  "scripts/validate-workflow-transition-plan.mjs",
  "scripts/generate-workflow-transition-approval.mjs",
  "scripts/validate-workflow-transition-approval.mjs",
  "scripts/execute-workflow-transition.mjs",
  "scripts/validate-workflow-execution-records.mjs",
  "scripts/validate-validation-design.mjs",
  "scripts/validate-validation-evidence.mjs",
  "scripts/generate-traceability-view.mjs",
  "scripts/validate-traceability-view.mjs",
  "scripts/generate-project-dashboard.mjs",
  "scripts/validate-project-dashboard.mjs",
  "scripts/generate-sync-report.mjs",
  "scripts/validate-sync-report.mjs",
  "scripts/validate-onboarding-doctor.mjs",
  "scripts/generate-release-readiness-report.mjs",
  "scripts/validate-release-readiness-report.mjs",
  "scripts/initialize-production-graph.mjs",
  "scripts/generate-productization-status-report.mjs",
  "scripts/generate-kpi-dashboard.mjs",
  "scripts/generate-production-core-gate-artifacts.mjs",
  "scripts/validate-production-core-gate.mjs",
  "scripts/validate-ainvil-cli.mjs",
  "cli/ainvil-cli.mjs",
  "scripts/run-ainvil-live-harness.mjs"
];

const errors = [];

await checkPluginManifest();
await checkMcpConfig();
await checkSkills();
await checkTemplates();
await checkSchemas();
await checkUnityPackage();
await checkHarness();
await checkProductionStateGraph();
await checkProductionIntelligenceReport();
await checkReviewRecords();
await checkBenchmarkDatasets();
await checkBenchmarkReport();
await checkCoreModules();
await checkWorkflowRuntimeReport();
await checkWorkflowTransitionPlan();
await checkWorkflowTransitionApproval();
await checkWorkflowExecutionRecords();
await checkValidationDesign();
await checkValidationEvidence();
await checkSyncAndResume();
await checkProductionCoreGate();
await checkProductizationStatus();
await checkReleaseReadiness();
await checkCli();
await checkMcpServerHandshake();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log("AInvil plugin validation passed.");

async function checkPluginManifest() {
  const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);
  requireField(manifest, "name", manifestPath);
  requireField(manifest, "version", manifestPath);
  requireField(manifest, "description", manifestPath);
  requireField(manifest, "skills", manifestPath);
  requireField(manifest, "mcpServers", manifestPath);
  requireField(manifest, "interface.displayName", manifestPath);
  requireField(manifest, "interface.shortDescription", manifestPath);
  requireField(manifest, "interface.longDescription", manifestPath);

  if (manifest.interface?.displayName !== "AInvil") {
    errors.push(`${manifestPath}: interface.displayName should be AInvil.`);
  }
  await mustExist(path.join(pluginRoot, manifest.skills));
  await mustExist(path.join(pluginRoot, manifest.mcpServers));
}

async function checkMcpConfig() {
  const mcpPath = path.join(pluginRoot, ".mcp.json");
  const config = await readJson(mcpPath);
  const server = config.mcpServers?.["unity-bridge"];
  if (!server) {
    errors.push(`${mcpPath}: missing mcpServers.unity-bridge.`);
    return;
  }
  if (server.command !== "node") {
    errors.push(`${mcpPath}: unity-bridge.command should be node.`);
  }
  if (server.cwd !== ".") {
    errors.push(`${mcpPath}: unity-bridge.cwd should be "." so relative args resolve from the plugin root.`);
  }
  if (!server.startup_timeout_sec) {
    errors.push(`${mcpPath}: unity-bridge.startup_timeout_sec is required.`);
  }
  if (!server.tool_timeout_sec) {
    errors.push(`${mcpPath}: unity-bridge.tool_timeout_sec is required.`);
  }
  const serverPath = server.args?.[0];
  if (!serverPath) {
    errors.push(`${mcpPath}: unity-bridge.args[0] is required.`);
  } else {
    await mustExist(path.join(pluginRoot, serverPath));
  }
}

async function checkSkills() {
  const skillsDir = path.join(pluginRoot, "skills");
  const skills = await readdir(skillsDir);
  for (const skill of ["orchestrator", "gdd-agent", "unity-agent", "input-agent"]) {
    if (!skills.includes(skill)) {
      errors.push(`skills: missing ${skill}.`);
      continue;
    }
    await mustExist(path.join(skillsDir, skill, "SKILL.md"));
  }
}

async function checkTemplates() {
  for (const file of requiredTemplates) {
    await mustExist(path.join(pluginRoot, "templates", file));
  }
}

async function checkSchemas() {
  const schemaDir = path.join(pluginRoot, "schemas");
  const files = (await readdir(schemaDir)).filter((file) => file.endsWith(".json"));
  if (files.length === 0) {
    errors.push("schemas: no JSON schema files found.");
  }
  for (const file of files) {
    await readJson(path.join(schemaDir, file));
  }
}

async function checkUnityPackage() {
  for (const file of requiredUnityFiles) {
    await mustExist(path.join(pluginRoot, file));
  }
  const packageJson = await readJson(path.join(pluginRoot, "unity-package/Packages/com.codex.unity-bridge/package.json"));
  if (packageJson.version !== "0.6.0") {
    errors.push("Unity package version should be 0.6.0.");
  }
}

async function checkCoreModules() {
  for (const file of coreModuleFiles) {
    await mustExist(path.join(pluginRoot, file));
  }
  for (const artifact of await missingRequiredArtifacts()) {
    errors.push(`${artifact.path}: missing required read-only platform artifact.`);
  }
}

async function checkMcpServerHandshake() {
  const scriptPath = path.join(pluginRoot, "scripts", "validate-mcp-server.mjs");
  await mustExist(scriptPath);
  const result = await runNode(scriptPath);
  if (result.code !== 0) {
    errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
  }
}

async function checkHarness() {
  for (const file of requiredHarnessFiles) {
    await mustExist(path.join(pluginRoot, file));
  }

  const scenarioDir = path.join(pluginRoot, "harness", "scenarios");
  let scenarios = [];
  try {
    scenarios = (await readdir(scenarioDir)).filter((file) => file.endsWith(".json"));
  } catch (error) {
    errors.push(`${scenarioDir}: ${error.message}`);
    return;
  }

  if (scenarios.length < 3) {
    errors.push(`${scenarioDir}: expected at least 3 harness scenarios.`);
  }

  for (const scenario of scenarios) {
    const scenarioJson = await readJson(path.join(scenarioDir, scenario));
    requireField(scenarioJson, "schemaVersion", scenario);
    requireField(scenarioJson, "id", scenario);
    requireField(scenarioJson, "userGoal", scenario);
    requireField(scenarioJson, "expectedDocuments", scenario);
    requireField(scenarioJson, "expectedUnityCapabilities", scenario);
    requireField(scenarioJson, "expectedUnityArtifacts", scenario);
    requireField(scenarioJson, "validationChecks", scenario);
    requireField(scenarioJson, "passCriteria", scenario);
  }
}

async function checkProductionStateGraph() {
  const scriptPath = path.join(pluginRoot, "scripts", "validate-production-state-graph.mjs");
  await mustExist(scriptPath);
  const result = await runNode(scriptPath);
  if (result.code !== 0) {
    errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
  }
}

async function checkProductionIntelligenceReport() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-production-intelligence-report.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-production-intelligence-report.mjs");
  await mustExist(generatePath);
  await mustExist(validatePath);

  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkReviewRecords() {
  const scriptPath = path.join(pluginRoot, "scripts", "validate-review-records.mjs");
  await mustExist(scriptPath);
  const result = await runNode(scriptPath);
  if (result.code !== 0) {
    errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
  }
}

async function checkBenchmarkDatasets() {
  const scriptPath = path.join(pluginRoot, "scripts", "validate-benchmark-datasets.mjs");
  await mustExist(scriptPath);
  const result = await runNode(scriptPath);
  if (result.code !== 0) {
    errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
  }
}

async function checkBenchmarkReport() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-benchmark-report.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-benchmark-report.mjs");
  await mustExist(generatePath);
  await mustExist(validatePath);

  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkWorkflowRuntimeReport() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-workflow-runtime-report.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-workflow-runtime-report.mjs");
  await mustExist(generatePath);
  await mustExist(validatePath);

  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkWorkflowTransitionPlan() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-workflow-transition-plan.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-workflow-transition-plan.mjs");
  await mustExist(generatePath);
  await mustExist(validatePath);

  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkWorkflowTransitionApproval() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-workflow-transition-approval.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-workflow-transition-approval.mjs");
  await mustExist(generatePath);
  await mustExist(validatePath);

  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkWorkflowExecutionRecords() {
  const executePath = path.join(pluginRoot, "scripts", "execute-workflow-transition.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-workflow-execution-records.mjs");
  await mustExist(executePath);
  await mustExist(validatePath);

  const executeResult = await runNode(executePath, ["--transition", "TRANS-RunBenchmark-Refresh", "--dry-run"]);
  if (executeResult.code !== 0) {
    errors.push(`${executePath}: ${executeResult.output.trim() || `exited with ${executeResult.code}`}`);
    return;
  }

  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkValidationEvidence() {
  const harnessPath = path.join(pluginRoot, "scripts", "run-ainvil-live-harness.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-validation-evidence.mjs");
  await mustExist(validatePath);
  const harnessResult = await runNode(harnessPath, [
    "--mode",
    "apply",
    "--scenario",
    "scenario.top_down_collectible",
    "--validation-design",
    "validation/design/top_down_collectible.validation-design.json",
    "--prepare-sample",
    "--retries",
    "1",
    "--rpc-timeout-ms",
    "4000",
    "--evidence-out",
    "validation/evidence/EVID-top-down-collectible-latest.json",
    "--allow-failures"
  ]);
  if (harnessResult.code !== 0) {
    errors.push(`${harnessPath}: ${harnessResult.output.trim() || `exited with ${harnessResult.code}`}`);
    return;
  }
  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkValidationDesign() {
  const validatePath = path.join(pluginRoot, "scripts", "validate-validation-design.mjs");
  await mustExist(validatePath);
  await mustExist(path.join(pluginRoot, "validation", "design", "top_down_collectible.validation-design.json"));
  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkSyncAndResume() {
  const steps = [
    ["Traceability View", "scripts/generate-traceability-view.mjs", "scripts/validate-traceability-view.mjs"],
    ["Project Dashboard", "scripts/generate-project-dashboard.mjs", "scripts/validate-project-dashboard.mjs"],
    ["Sync Report", "scripts/generate-sync-report.mjs", "scripts/validate-sync-report.mjs"]
  ];
  for (const [label, generateScript, validateScript] of steps) {
    const generatePath = path.join(pluginRoot, generateScript);
    const validatePath = path.join(pluginRoot, validateScript);
    await mustExist(generatePath);
    await mustExist(validatePath);
    const generateResult = await runNode(generatePath);
    if (generateResult.code !== 0) {
      errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
      continue;
    }
    const validateResult = await runNode(validatePath);
    if (validateResult.code !== 0) {
      errors.push(`${validatePath}: ${validateResult.output.trim() || `${label} validation exited with ${validateResult.code}`}`);
    }
  }
}

async function checkProductionCoreGate() {
  const kpiPath = path.join(pluginRoot, "scripts", "generate-kpi-dashboard.mjs");
  const generatePath = path.join(pluginRoot, "scripts", "generate-production-core-gate-artifacts.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-production-core-gate.mjs");
  for (const file of [kpiPath, generatePath, validatePath]) await mustExist(file);
  for (const scriptPath of [kpiPath, generatePath]) {
    const result = await runNode(scriptPath);
    if (result.code !== 0) {
      errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
      return;
    }
  }
  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkReleaseReadiness() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-release-readiness-report.mjs");
  const validatePath = path.join(pluginRoot, "scripts", "validate-release-readiness-report.mjs");
  for (const file of [generatePath, validatePath]) await mustExist(file);
  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
    return;
  }
  const validateResult = await runNode(validatePath);
  if (validateResult.code !== 0) {
    errors.push(`${validatePath}: ${validateResult.output.trim() || `exited with ${validateResult.code}`}`);
  }
}

async function checkProductizationStatus() {
  const generatePath = path.join(pluginRoot, "scripts", "generate-productization-status-report.mjs");
  await mustExist(generatePath);
  const generateResult = await runNode(generatePath);
  if (generateResult.code !== 0) {
    errors.push(`${generatePath}: ${generateResult.output.trim() || `exited with ${generateResult.code}`}`);
  }
}

async function checkCli() {
  const scriptPath = path.join(pluginRoot, "scripts", "validate-ainvil-cli.mjs");
  await mustExist(scriptPath);
  const result = await runNode(scriptPath);
  if (result.code !== 0) {
    errors.push(`${scriptPath}: ${result.output.trim() || `exited with ${result.code}`}`);
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

function requireField(object, dottedPath, source) {
  const value = dottedPath.split(".").reduce((current, part) => current?.[part], object);
  if (value === undefined || value === null || value === "") {
    errors.push(`${source}: missing ${dottedPath}.`);
  }
}

function runNode(scriptPath, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: pluginRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      resolve({ code: 1, output: error.message });
    });
    child.on("exit", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
}
