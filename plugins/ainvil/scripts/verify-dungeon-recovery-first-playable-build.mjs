#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runUnityValidationPreflight } from "../core/unity-compile-gate.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const unityUrl = process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc";
const healthUrl = process.env.UNITY_HEALTH_URL || unityUrl.replace(/\/rpc$/, "/health");
const outputPath = path.resolve(pluginRoot, "reports", "builds", "dungeon_recovery_first_playable", "DungeonRecoveryFirstPlayable.exe").replaceAll("\\", "/");
const startedAt = new Date().toISOString();
const steps = [];

let status = "Blocked";
let buildResult = null;
let failureReason = null;
let compileGate = null;

try {
  steps.push(await healthCheck());
  compileGate = await runUnityValidationPreflight({
    scenarioId: "dungeon_recovery_first_playable_e2e",
    category: "ProductMvp",
    validationType: "BuildVerification",
    unityUrl,
    healthUrl
  });
  steps.push(compileGateStep(compileGate));
  if (compileGate.status !== "Passed") {
    status = "Blocked";
    failureReason = compileGate.failureReason;
    throw new CompileBlockedError(failureReason);
  }
  steps.push(await callUnityCheck("unity_clear_console", {}));
  steps.push(await callUnityCheck("unity_compile_status", {}));
  steps.push(await ensureBuilderObject());
  steps.push(await callUnityCheck("unity_invoke_component_method", {
    targetPath: "/AInvilFirstPlayableBuildVerifier",
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryFirstPlayableBuilder",
    methodName: "BuildFirstPlayableScene",
    args: [],
    requirePlaying: false,
    debugOnly: false
  }));
  steps.push(await waitForCompile());
  const build = await callUnityCheck("unity_invoke_component_method", {
    targetPath: "/AInvilDungeonRecoveryFirstPlayable/BuildVerifier",
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryFirstPlayableBuilder",
    methodName: "BuildWindowsDevelopmentPlayer",
    args: [outputPath],
    requirePlaying: false,
    debugOnly: false
  }, 180000);
  steps.push(build);
  buildResult = parseBuildResult(build);
  status = build.ok && buildResult?.result === "Succeeded" && buildResult?.totalErrors === 0 ? "Passed" : "Failed";
  failureReason = status === "Passed" ? null : build.message || buildResult?.result || "Build did not succeed.";
} catch (error) {
  status = "Blocked";
  failureReason = error.message;
  steps.push({
    id: "build.exception",
    status: "Blocked",
    message: error.message
  });
}

const finishedAt = new Date().toISOString();
const report = {
  schemaVersion: "1.0.0",
  reportId: `DRC-BUILD-${finishedAt.replace(/[:.]/g, "-")}`,
  startedAt,
  finishedAt,
  product: "DungeonRecoveryCompany",
  scenarioId: "dungeon_recovery_first_playable_e2e",
  buildVerificationStatus: status,
  unityUrl,
  healthUrl,
  scenePath: "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_FirstRecoveryJob.unity",
  buildTarget: "StandaloneWindows64",
  buildOptions: ["Development"],
  buildOutputPath: status === "Passed" ? outputPath : null,
  failureReason,
  buildResult,
  compileGate,
  blockerType: compileGate?.status !== "Passed" ? "CompileBlocked" : null,
  steps,
  nextAction: status === "Passed"
    ? "Run the generated executable manually and record human playability feedback."
    : "Inspect Unity build errors, install the Windows build support module if missing, then rerun build verification."
};

await writeReport(report);
await writeBuildEvidence(report);
printReport(report);
if (status !== "Passed") process.exit(1);

async function ensureBuilderObject() {
  const existing = await callUnityCheck("unity_get_game_object", { path: "/AInvilFirstPlayableBuildVerifier" });
  if (!existing.ok) {
    await callUnity("unity_create_game_object", { name: "AInvilFirstPlayableBuildVerifier", primitiveType: "empty" });
  }
  return await callUnityCheck("unity_add_component", {
    targetPath: "/AInvilFirstPlayableBuildVerifier",
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryFirstPlayableBuilder"
  });
}

async function waitForCompile() {
  let last = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    last = await callUnityCheck("unity_compile_status", {});
    const data = last.data || {};
    if (last.ok && !data.isCompiling && !data.isUpdating) {
      if ((data.errorCount || 0) > 0) {
        return { ...last, id: "build.compile_status", status: "Failed", failureClass: "CompileError", message: "Unity compile status reports errors before build." };
      }
      return { ...last, id: "build.compile_status", status: "Passed", message: "Unity compile status is stable before build." };
    }
    await sleep(1500);
  }
  return { ...(last || {}), id: "build.compile_status", status: "Blocked", message: "Unity compile status did not stabilize before build." };
}

async function healthCheck() {
  const response = await fetch(healthUrl);
  const data = await response.json();
  return {
    id: "build.bridge_health",
    status: response.ok ? "Passed" : "Blocked",
    ok: response.ok,
    message: response.ok ? "Unity Bridge health endpoint is reachable." : `Unity Bridge health HTTP ${response.status}.`,
    data
  };
}

async function callUnityCheck(method, params, timeoutMs = 30000) {
  try {
    const data = await callUnity(method, params, timeoutMs);
    return {
      id: `build.${method}`,
      status: "Passed",
      ok: true,
      message: `${method} succeeded.`,
      data
    };
  } catch (error) {
    return {
      id: `build.${method}`,
      status: "Failed",
      ok: false,
      message: error.message
    };
  }
}

async function callUnity(method, params, timeoutMs = 30000) {
  let lastError;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await callUnityOnce(method, params, timeoutMs);
    } catch (error) {
      lastError = error;
      await sleep(1000 + attempt * 500);
    }
  }
  throw lastError;
}

async function callUnityOnce(method, params, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(unityUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params: params || {} }),
      signal: controller.signal
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok || payload.error) throw new Error(payload.error || `Unity Bridge HTTP ${response.status}`);
    return payload.result ?? payload;
  } finally {
    clearTimeout(timeout);
  }
}

function parseBuildResult(check) {
  const raw = check?.data?.result;
  if (typeof raw !== "string") return raw || null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function writeReport(report) {
  await mkdir(path.resolve(pluginRoot, "reports"), { recursive: true });
  await mkdir(path.resolve(pluginRoot, "reports", "builds", "dungeon_recovery_first_playable"), { recursive: true });
  await writeFile(path.resolve(pluginRoot, "reports", "dungeon_recovery_first_playable_build_verification.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.resolve(pluginRoot, "reports", "dungeon_recovery_first_playable_build_verification.md"), formatMarkdown(report), "utf8");
}

async function writeBuildEvidence(report) {
  const evidence = {
    schemaVersion: "1.0.0",
    evidenceId: "EVID-dungeon-recovery-first-playable-build-latest",
    source: "UnityBridge",
    scenarioId: "dungeon_recovery_first_playable_e2e",
    classification: "Operational",
    category: "ProductMvp",
    validationType: "BuildVerification",
    validationLevel: report.blockerType === "CompileBlocked" ? "Compile Failed" : report.buildVerificationStatus === "Passed" ? "Compile Verified" : "Not Checked",
    status: report.buildVerificationStatus === "Passed" ? "Passed" : report.buildVerificationStatus,
    result: report.buildVerificationStatus === "Passed" ? "Passed" : report.buildVerificationStatus,
    validationIds: ["VAL-DRC-MVP-BUILD-001"],
    validationId: "VAL-DRC-MVP-BUILD-001",
    failureClass: report.blockerType === "CompileBlocked" ? "CompileError" : report.buildVerificationStatus === "Passed" ? "None" : "Unknown",
    acceptanceIds: ["AC-DRC-MVP-001", "AC-DRC-MVP-002", "AC-DRC-MVP-003"],
    requirementIds: ["REQ-DRC-MVP-001"],
    unityTargets: [report.scenePath, report.buildOutputPath].filter(Boolean),
    checks: report.steps.map((step) => ({
      checkId: step.id,
      type: step.id.includes("compile") ? "Compile" : step.id.includes("invoke") ? "Build" : "UnityBridge",
      target: step.id,
      status: step.status,
      failureClass: step.status === "Passed" ? "Unknown" : "Unknown",
      message: step.message
    })),
    checkedSteps: report.steps.map((step) => ({
      checkId: step.id,
      type: step.id.includes("compile") ? "Compile" : step.id.includes("invoke") ? "Build" : "UnityBridge",
      target: step.id,
      status: step.status,
      failureClass: step.status === "Passed" ? "Unknown" : "Unknown",
      message: step.message
    })),
    bridgeHealthResult: report.steps.find((step) => step.id === "build.bridge_health") || null,
    compileStatusResult: report.steps.find((step) => step.id === "build.compile_status" || step.id === "build.unity_compile_status") || null,
    compileGate: report.compileGate,
    compileErrorCount: report.compileGate?.compileErrorCount ?? null,
    compileErrors: report.compileGate?.compileErrors || [],
    consoleErrorSummary: null,
    blockerType: report.blockerType,
    playModeAttempted: false,
    runtimeAssemblyFreshness: report.compileGate?.runtimeAssemblyFreshness || null,
    failureReason: report.failureReason,
    blocker: report.buildVerificationStatus === "Passed" ? null : report.failureReason,
    bridgeDiagnostics: [],
    validationResults: report.buildVerificationStatus === "Passed" ? [{
      validationId: "VAL-DRC-MVP-BUILD-001",
      requirementId: "REQ-DRC-MVP-001",
      acceptanceIds: ["AC-DRC-MVP-001", "AC-DRC-MVP-002", "AC-DRC-MVP-003"],
      scenario: "dungeon_recovery_first_playable_e2e",
      result: "Passed",
      assertions: [
        { id: "ASSERT-BUILD-SUCCEEDED", result: "Passed", message: "Windows development build succeeded." }
      ],
      timestamp: report.finishedAt
    }] : [],
    observations: null,
    assertions: report.buildVerificationStatus === "Passed"
      ? [{ id: "ASSERT-BUILD-SUCCEEDED", result: "Passed", message: "Windows development build succeeded." }]
      : [],
    sourceValidationDesign: null,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    completedAt: report.finishedAt,
    timestamp: report.finishedAt,
    remainingGaps: report.buildVerificationStatus === "Passed"
      ? ["Executable launch and human playability confirmation remain separate gates."]
      : ["Windows build did not pass."],
    nextActions: [report.nextAction],
    playabilityReviewStatus: "Manual Review Required",
    buildVerificationStatus: report.buildVerificationStatus,
    uxChangesApplied: [],
    manualAcceptanceCriteria: [],
    buildOutputPath: report.buildOutputPath,
    remainingPlayabilityIssues: ["Manual executable launch/play confirmation remains required."]
  };
  await writeFile(path.resolve(pluginRoot, "validation", "evidence", "EVID-dungeon-recovery-first-playable-build-latest.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

function compileGateStep(gate) {
  return {
    id: "build.compile_gate",
    status: gate.status === "Passed" ? "Passed" : "Blocked",
    ok: gate.status === "Passed",
    failureClass: gate.status === "Passed" ? "Unknown" : "CompileError",
    message: gate.status === "Passed" ? "Compile gate passed before build verification." : `CompileBlocked: ${gate.failureReason}`,
    data: gate
  };
}

class CompileBlockedError extends Error {
  constructor(message) {
    super(message);
    this.name = "CompileBlockedError";
  }
}

function formatMarkdown(report) {
  return [
    "# Dungeon Recovery First Playable Build Verification",
    "",
    `- Started at: ${report.startedAt}`,
    `- Finished at: ${report.finishedAt}`,
    `- Status: ${report.buildVerificationStatus}`,
    `- Scene: ${report.scenePath}`,
    `- Build target: ${report.buildTarget}`,
    `- Build output: ${report.buildOutputPath || "None"}`,
    `- Failure reason: ${report.failureReason || "None"}`,
    "",
    "## Steps",
    "",
    "| Step | Status | Message |",
    "| --- | --- | --- |",
    ...report.steps.map((step) => `| ${step.id} | ${step.status} | ${esc(step.message)} |`),
    ""
  ].join("\n");
}

function printReport(report) {
  console.log(`Dungeon Recovery build verification: ${report.buildVerificationStatus}`);
  console.log(`Output: ${report.buildOutputPath || "None"}`);
  if (report.failureReason) console.log(`Failure: ${report.failureReason}`);
  console.log("Report: reports/dungeon_recovery_first_playable_build_verification.json");
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
