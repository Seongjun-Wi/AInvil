#!/usr/bin/env node
import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const DEFAULT_EVIDENCE = "validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json";
const DEFAULT_REPORT = "reports/fresh_workspace_verification_report.json";
const DEFAULT_MARKDOWN = "reports/fresh_workspace_verification_report.md";
const DEFAULT_HARNESS_REPORT = "harness/reports/fresh-workspace-live-harness-report.json";
const DEFAULT_SCENARIO = "ainvil_bridge_smoke_operational";
const DEFAULT_UNITY_URL = process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc";
const DEFAULT_HEALTH_URL = process.env.UNITY_HEALTH_URL || DEFAULT_UNITY_URL.replace(/\/rpc$/, "/health");

const options = parseArgs(process.argv.slice(2));
const startedAt = new Date().toISOString();
const targetProject = normalizeProjectPath(options.unityProject);
const checks = [];
let status = "Blocked";
let failureReason = null;
let liveHarness = null;
let evidence = null;
let doctorResult = null;

const bridgeHealth = await healthCheck();
checks.push(bridgeHealth);
const bridgeStatus = bridgeHealth.status === "Passed" ? await unityStatusCheck() : null;
if (bridgeStatus) checks.push(bridgeStatus);

const bridgeProject = normalizeProjectPath(detectUnityProjectRoot(bridgeStatus?.data?.projectPath));
const projectMatch = targetProject && bridgeProject && samePath(targetProject, bridgeProject);
checks.push({
  id: "fresh.workspace.project_match",
  type: "Precondition",
  target: targetProject,
  status: projectMatch ? "Passed" : "Blocked",
  message: projectMatch
    ? `Unity Bridge target matches requested fresh workspace: ${targetProject}`
    : `Unity Bridge target does not match requested fresh workspace. requested=${targetProject || "missing"}, bridge=${bridgeProject || "unknown"}`,
  nextAction: projectMatch ? null : "Open the requested Unity project, start Tools > Codex Unity Bridge > Start Server in that editor, then rerun fresh workspace verification."
});

const packageInstallCheck = await packageInstallStatus(targetProject);
checks.push(packageInstallCheck);

if (!targetProject) {
  failureReason = "No --unity-project path was provided.";
} else if (bridgeHealth.status !== "Passed") {
  failureReason = bridgeHealth.message;
} else if (!projectMatch) {
  failureReason = checks.find((item) => item.id === "fresh.workspace.project_match")?.message;
} else {
  doctorResult = await runNode(["cli/ainvil-cli.mjs", "doctor", "--unity-project", targetProject]);
  checks.push({
    id: "fresh.workspace.doctor",
    type: "Doctor",
    target: targetProject,
    status: doctorResult.code === 0 ? "Passed" : "Failed",
    message: tail(doctorResult.output, 600)
  });

  const harnessResult = await runNode([
    "scripts/run-ainvil-live-harness.mjs",
    "--mode", "probe",
    "--scenario", options.scenario,
    "--report", DEFAULT_HARNESS_REPORT,
    "--evidence-out", DEFAULT_EVIDENCE,
    "--allow-failures"
  ]);
  checks.push({
    id: "fresh.workspace.live_harness",
    type: "LiveHarness",
    target: options.scenario,
    status: harnessResult.code === 0 ? "Passed" : "Failed",
    message: tail(harnessResult.output, 1000)
  });

  liveHarness = await readJsonIfExists(resolveAInvilPath(DEFAULT_HARNESS_REPORT));
  evidence = await readJsonIfExists(resolveAInvilPath(DEFAULT_EVIDENCE));
  if (evidence) {
    evidence = enrichEvidence(evidence, {
      statusProject: bridgeProject,
      targetProject,
      packageInstallCheck,
      staleEvidenceReused: false
    });
    await writeJson(DEFAULT_EVIDENCE, evidence);
  }
  status = evidence?.status || "Blocked";
  failureReason = status === "Passed" ? null : evidence?.failureReason || "Fresh workspace live harness did not pass.";
}

if (!evidence) {
  evidence = createBlockedEvidence({
    startedAt,
    finishedAt: new Date().toISOString(),
    targetProject,
    bridgeProject,
    checks,
    packageInstallCheck,
    failureReason: failureReason || "Fresh workspace verification was blocked before live harness evidence could be generated."
  });
  await writeJson(DEFAULT_EVIDENCE, evidence);
  status = evidence.status;
}

const completedAt = new Date().toISOString();
const report = {
  schemaVersion: "1.0.0",
  reportId: `FRESH-${completedAt.replace(/[:.]/g, "-")}`,
  generatedAt: completedAt,
  workspaceClassification: "FreshWorkspace",
  requestedUnityProjectPath: targetProject,
  bridgeUnityProjectPath: bridgeProject,
  scenarioId: options.scenario,
  status,
  result: status,
  failureReason,
  nextAction: nextActionFor(status, checks, packageInstallCheck),
  staleEvidenceReused: false,
  evidencePath: DEFAULT_EVIDENCE,
  liveHarnessReportPath: liveHarness ? DEFAULT_HARNESS_REPORT : null,
  doctorCommandExecuted: Boolean(doctorResult),
  packageInstallCheck,
  packageDependencyPath: packageInstallCheck.packageDependencyPath || null,
  packageDependencyClassification: packageInstallCheck.packageDependencyClassification || "Unknown",
  canonicalPackageVerified: packageInstallCheck.canonicalPackageVerified === true,
  checks,
  evidenceSummary: {
    scenarioId: evidence.scenarioId,
    classification: evidence.classification,
    workspaceClassification: evidence.workspaceClassification,
    status: evidence.status,
    validationLevel: evidence.validationLevel,
    bridgeHealth: evidence.bridgeHealthResult?.status || null,
    compileStatus: evidence.compileStatusResult?.status || null,
    consoleErrorCount: evidence.consoleErrorSummary?.errorCount ?? null,
    hierarchyStatus: evidence.checkedSteps?.find((item) => item.checkId === "bridge.unity_get_hierarchy")?.status || null,
    probeStatus: evidence.checkedSteps?.find((item) => item.checkId === "bridge.unity_probe_validation_observation")?.status || null
  },
  knownLimitations: [
    packageInstallCheck.status === "Warning" ? packageInstallCheck.message : null,
    "This fresh verification uses the user-designated DungeonRecoveryCompany Unity Bridge target and does not modify game scenes, prefabs, or scripts.",
    "The smoke scenario is Compile Verified and read-only; it is not a full Product MVP gameplay workflow validation."
  ].filter(Boolean)
};

await writeJson(DEFAULT_REPORT, report);
await writeText(DEFAULT_MARKDOWN, formatMarkdown(report));

console.log(`Fresh Workspace verification: ${status}`);
console.log(`Unity project: ${targetProject}`);
console.log(`Evidence: ${DEFAULT_EVIDENCE}`);
console.log(`Report: ${DEFAULT_REPORT}`);
if (status !== "Passed") {
  console.log(`Failure: ${failureReason}`);
  process.exit(1);
}

function parseArgs(args) {
  const parsed = {
    unityProject: null,
    scenario: DEFAULT_SCENARIO
  };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--unity-project") {
      parsed.unityProject = args[++index];
    } else if (arg === "--scenario") {
      parsed.scenario = args[++index];
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node plugins/ainvil/scripts/verify-fresh-workspace.mjs --unity-project <UnityProjectPath>");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

async function healthCheck() {
  try {
    const response = await fetch(DEFAULT_HEALTH_URL);
    const data = await response.json();
    return {
      id: "fresh.workspace.bridge_health",
      type: "BridgeHealth",
      target: DEFAULT_HEALTH_URL,
      status: response.ok && data?.ok ? "Passed" : "Blocked",
      message: response.ok ? "Unity Bridge health endpoint is reachable." : `Unity Bridge health HTTP ${response.status}`,
      data
    };
  } catch (error) {
    return {
      id: "fresh.workspace.bridge_health",
      type: "BridgeHealth",
      target: DEFAULT_HEALTH_URL,
      status: "Blocked",
      message: `Unity Bridge health is not reachable: ${error.message}`,
      nextAction: "Open Unity, install the bridge package, start Tools > Codex Unity Bridge > Start Server, then rerun verification."
    };
  }
}

async function unityStatusCheck() {
  try {
    const payload = await callUnity("unity_get_status", {});
    return {
      id: "fresh.workspace.unity_status",
      type: "UnityStatus",
      target: "unity_get_status",
      status: "Passed",
      message: "Unity status is readable.",
      data: payload
    };
  } catch (error) {
    return {
      id: "fresh.workspace.unity_status",
      type: "UnityStatus",
      target: "unity_get_status",
      status: "Blocked",
      message: error.message,
      nextAction: "Restart Unity Bridge and rerun verification."
    };
  }
}

async function callUnity(method, params) {
  const response = await fetch(DEFAULT_UNITY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || `Unity RPC ${method} returned HTTP ${response.status}`);
  return payload.result ?? payload;
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args.map((arg, index) => index === 0 ? resolveAInvilPath(arg) : arg), {
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
    child.on("error", (error) => resolve({ code: 1, output: error.message }));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

function enrichEvidence(data, { statusProject, targetProject, packageInstallCheck, staleEvidenceReused }) {
  return {
    ...data,
    workspaceClassification: "FreshWorkspace",
    scratchUnityProjectPath: targetProject,
    unityProjectPath: statusProject,
    liveSmokeTargetProject: targetProject,
    staleEvidenceReused,
    packageInstallCheck,
    packageDependencyPath: packageInstallCheck.packageDependencyPath || null,
    packageDependencyClassification: packageInstallCheck.packageDependencyClassification || "Unknown",
    canonicalPackageVerified: packageInstallCheck.canonicalPackageVerified === true
  };
}

function createBlockedEvidence({ startedAt, finishedAt, targetProject, bridgeProject, checks, packageInstallCheck, failureReason }) {
  const bridgeCheck = checks.find((item) => item.id === "fresh.workspace.bridge_health");
  return {
    schemaVersion: "1.0.0",
    evidenceId: `EVID-ainvil-bridge-smoke-operational-fresh-workspace-${startedAt.replace(/[:.]/g, "-")}`,
    source: "LiveHarness",
    scenarioId: DEFAULT_SCENARIO,
    classification: "Operational",
    workspaceClassification: "FreshWorkspace",
    scratchUnityProjectPath: targetProject,
    unityProjectPath: bridgeProject,
    liveSmokeTargetProject: targetProject,
    staleEvidenceReused: false,
    packageInstallCheck,
    packageDependencyPath: packageInstallCheck.packageDependencyPath || null,
    packageDependencyClassification: packageInstallCheck.packageDependencyClassification || "Unknown",
    canonicalPackageVerified: packageInstallCheck.canonicalPackageVerified === true,
    validationLevel: "Not Checked",
    status: "Blocked",
    result: "Blocked",
    validationIds: [],
    validationId: null,
    failureClass: "PreconditionFailed",
    acceptanceIds: ["AC-E2E-002"],
    requirementIds: ["REQ-E2E-003"],
    unityTargets: [],
    checks,
    checkedSteps: checks.map((item) => ({
      checkId: item.id,
      type: item.type,
      target: item.target,
      status: item.status,
      failureClass: item.status === "Passed" ? "Unknown" : "PreconditionFailed",
      message: item.message
    })),
    bridgeHealthResult: bridgeCheck ? {
      checkId: bridgeCheck.id,
      status: bridgeCheck.status,
      failureClass: bridgeCheck.status === "Passed" ? "Unknown" : "BridgeDisconnected",
      message: bridgeCheck.message
    } : null,
    compileStatusResult: null,
    consoleErrorSummary: { status: "NotRun", errorCount: null, message: "Console logs were not checked." },
    failureReason,
    blocker: "PreconditionFailed",
    bridgeDiagnostics: [],
    validationResults: [],
    observations: null,
    assertions: [],
    sourceValidationDesign: null,
    startedAt,
    finishedAt,
    completedAt: finishedAt,
    timestamp: finishedAt,
    remainingGaps: [failureReason],
    nextActions: [nextActionFor("Blocked", checks, packageInstallCheck)]
  };
}

async function packageInstallStatus(projectPath) {
  const manifestPath = projectPath ? path.join(projectPath, "Packages", "manifest.json") : null;
  const canonicalPath = path.resolve(pluginRoot, "unity-package", "Packages", "com.codex.unity-bridge").replaceAll("\\", "/");
  if (!manifestPath || !(await exists(manifestPath))) {
    return {
      id: "fresh.workspace.package_install",
      type: "PackageInstall",
      target: manifestPath,
      status: "Blocked",
      message: "Unity Packages/manifest.json is missing.",
      nextAction: "Install the canonical Unity Bridge package into the scratch Unity project."
    };
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const dependency = manifest.dependencies?.["com.codex.unity-bridge"] || null;
    const normalizedDependency = String(dependency || "").replace(/^file:/, "").replaceAll("\\", "/");
    const pointsToCanonical = normalizedDependency === canonicalPath || normalizedDependency.endsWith("/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge");
    const pointsToDeprecatedMirror = normalizedDependency.endsWith("/UnityPackage/Packages/com.codex.unity-bridge");
    const packageDependencyClassification = pointsToCanonical
      ? "Canonical"
      : pointsToDeprecatedMirror
        ? "DeprecatedMirror"
        : dependency
          ? "Unknown"
          : "Missing";
    return {
      id: "fresh.workspace.package_install",
      type: "PackageInstall",
      target: manifestPath,
      status: dependency ? (pointsToCanonical ? "Passed" : "Warning") : "Blocked",
      dependency,
      packageDependencyPath: dependency,
      packageDependencyClassification,
      canonicalPackageVerified: pointsToCanonical,
      canonicalPath,
      message: dependency
        ? pointsToCanonical
          ? "Unity Bridge package dependency points to the canonical package."
          : `Unity Bridge package is installed, but dependency points outside the canonical package: ${dependency}`
        : "com.codex.unity-bridge is not listed in Packages/manifest.json.",
      nextAction: dependency && !pointsToCanonical
        ? "Update the package dependency to plugins/ainvil/unity-package/Packages/com.codex.unity-bridge before public release packaging."
        : dependency
          ? null
          : "Install the canonical Unity Bridge package through Unity Package Manager."
    };
  } catch (error) {
    return {
      id: "fresh.workspace.package_install",
      type: "PackageInstall",
      target: manifestPath,
      status: "Blocked",
      message: `Could not parse Unity package manifest: ${error.message}`,
      nextAction: "Repair Packages/manifest.json and rerun verification."
    };
  }
}

function nextActionFor(status, checks, packageInstallCheck) {
  if (status === "Passed" && packageInstallCheck.status === "Warning") {
    return packageInstallCheck.nextAction;
  }
  if (status === "Passed") return "Fresh workspace Core RC reproducibility is verified for the selected Unity project.";
  const failed = checks.find((item) => item.status !== "Passed" && item.nextAction);
  return failed?.nextAction || "Resolve the blocked fresh workspace check and rerun verification.";
}

function detectUnityProjectRoot(projectPath) {
  if (!projectPath) return null;
  const normalized = path.resolve(String(projectPath).replaceAll("\\", "/"));
  return path.basename(normalized).toLowerCase() === "assets" ? path.dirname(normalized) : normalized;
}

function normalizeProjectPath(projectPath) {
  return projectPath ? path.resolve(String(projectPath).replaceAll("\\", "/")) : null;
}

function samePath(a, b) {
  return normalizeProjectPath(a)?.toLowerCase() === normalizeProjectPath(b)?.toLowerCase();
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(relativePath, data) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, text) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function formatMarkdown(report) {
  return [
    "# Fresh Workspace Verification Report",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Workspace classification: ${report.workspaceClassification}`,
    `- Requested Unity project: ${report.requestedUnityProjectPath}`,
    `- Bridge Unity project: ${report.bridgeUnityProjectPath}`,
    `- Scenario: ${report.scenarioId}`,
    `- Status: ${report.status}`,
    `- Evidence: ${report.evidencePath}`,
    `- Live harness report: ${report.liveHarnessReportPath || "Not generated"}`,
    `- Stale evidence reused: ${report.staleEvidenceReused}`,
    `- Package dependency: ${report.packageDependencyPath || "None"}`,
    `- Package dependency classification: ${report.packageDependencyClassification}`,
    `- Canonical package verified: ${report.canonicalPackageVerified}`,
    "",
    "## Evidence Summary",
    "",
    `- Classification: ${report.evidenceSummary.classification}`,
    `- Workspace classification: ${report.evidenceSummary.workspaceClassification}`,
    `- Validation level: ${report.evidenceSummary.validationLevel}`,
    `- Bridge health: ${report.evidenceSummary.bridgeHealth}`,
    `- Compile status: ${report.evidenceSummary.compileStatus}`,
    `- Console error count: ${report.evidenceSummary.consoleErrorCount}`,
    `- Hierarchy status: ${report.evidenceSummary.hierarchyStatus}`,
    `- Probe status: ${report.evidenceSummary.probeStatus}`,
    "",
    "## Checks",
    "",
    "| Check | Status | Message | Next action |",
    "| --- | --- | --- | --- |",
    ...report.checks.map((item) => `| ${item.id} | ${item.status} | ${esc(item.message)} | ${esc(item.nextAction || "None")} |`),
    "",
    "## Known Limitations",
    "",
    ...report.knownLimitations.map((item) => `- ${item}`),
    ""
  ].join("\n");
}

function tail(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(-maxLength) : text;
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}
