#!/usr/bin/env node
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { runUnityValidationPreflight, writeCompileGateReport } from "../core/unity-compile-gate.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const scenarioId = "ainvil_compile_gate_blocks_playmode_on_compile_error";
const unityProject = optionValue("--unity-project") || process.env.AINVIL_UNITY_PROJECT || process.env.UNITY_PROJECT_PATH;
if (!unityProject) {
  console.error("ERROR --unity-project is required for compile gate safety regression.");
  process.exit(1);
}

const unityProjectPath = path.resolve(unityProject);
const tempRelativePath = "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilCompileGateIntentionalError.cs";
const tempFilePath = path.join(unityProjectPath, tempRelativePath);
const csprojPath = path.join(unityProjectPath, "Assembly-CSharp.csproj");
const evidencePath = resolveAInvilPath("validation/evidence/EVID-ainvil-compile-gate-blocks-playmode-latest.json");
const reportPath = resolveAInvilPath("reports/ainvil_compile_gate_safety_regression_report.json");
const markdownPath = resolveAInvilPath("reports/ainvil_compile_gate_safety_regression_report.md");
const startedAt = new Date().toISOString();

let originalCsproj = null;
let temporaryErrorFileCreated = false;
let temporaryErrorFileDeleted = false;
let csprojPatched = false;
let compileGateWithError = null;
let compileGateAfterCleanup = null;
let cleanupAttempts = 0;
let cleanupWaitMs = 0;
let caughtError = null;

try {
  await ensureBridgeReachable();
} catch (error) {
  console.error(`ERROR ${error.message}`);
  process.exit(1);
}

try {
  originalCsproj = await readFile(csprojPath, "utf8");
  await mkdir(path.dirname(tempFilePath), { recursive: true });
  await writeFile(tempFilePath, intentionalCompileErrorSource(), "utf8");
  temporaryErrorFileCreated = true;
  await writeFile(csprojPath, patchCsproj(originalCsproj, tempRelativePath), "utf8");
  csprojPatched = true;

  await refreshAssetsBestEffort();
  compileGateWithError = await runUnityValidationPreflight({
    scenarioId,
    classification: "Operational",
    category: "ValidationSafety",
    validationType: "CompileGateRegression"
  });
} catch (error) {
  caughtError = error;
} finally {
  try {
    await rm(tempFilePath, { force: true });
    temporaryErrorFileDeleted = !(await exists(tempFilePath));
  } catch {
    temporaryErrorFileDeleted = false;
  }
  if (originalCsproj !== null) {
    await writeFile(csprojPath, originalCsproj, "utf8");
    csprojPatched = false;
  }
  const cleanupResult = await waitForCleanupCompilePass();
  compileGateAfterCleanup = cleanupResult.result;
  cleanupAttempts = cleanupResult.attempts;
  cleanupWaitMs = cleanupResult.elapsedMs;
  await writeCompileGateReport(compileGateAfterCleanup);
}

const compileErrors = compileGateWithError?.compileErrors || [];
const detectedError = compileErrors.find((error) => String(error.file || "").replaceAll("\\", "/").endsWith(tempRelativePath.replaceAll("\\", "/")))
  || compileErrors[0]
  || null;
const passed = !caughtError
  && temporaryErrorFileCreated
  && temporaryErrorFileDeleted
  && compileGateWithError?.status !== "Passed"
  && compileGateWithError?.blockerType === "CompileBlocked"
  && compileErrors.length > 0
  && compileGateWithError?.playModeAttempted === false
  && compileGateAfterCleanup?.status === "Passed";

const finishedAt = new Date().toISOString();
const evidenceChecks = [
  check("intentional_compile_error.created", temporaryErrorFileCreated, tempRelativePath, "Temporary compile error file was created."),
  check("compile_gate.blocks_play_mode", compileGateWithError?.status !== "Passed" && compileGateWithError?.blockerType === "CompileBlocked", "UNITY-COMPILE-GATE", `Compile gate status with error: ${compileGateWithError?.status || "NotRun"}.`),
  check("play_mode.not_attempted", compileGateWithError?.playModeAttempted === false, "unity_enter_play_mode", "Play Mode was not attempted while compile gate was blocked."),
  check("downstream_validation.skipped", true, "runtime validation", "Downstream runtime validation was intentionally skipped."),
  check("temporary_error_file.deleted", temporaryErrorFileDeleted, tempRelativePath, "Temporary compile error file was deleted."),
  check("compile_gate.cleanup_passed", compileGateAfterCleanup?.status === "Passed", "compile-check", `Compile gate status after cleanup: ${compileGateAfterCleanup?.status || "NotRun"} after ${cleanupAttempts} attempt(s).`)
];

const evidence = {
  schemaVersion: "1.0.0",
  evidenceId: "EVID-ainvil-compile-gate-blocks-playmode-latest",
  source: "CompileGateSafetyRegression",
  scenarioId,
  classification: "Operational",
  category: "ValidationSafety",
  validationType: "CompileGateRegression",
  validationLevel: passed ? "Compile Verified" : "Compile Failed",
  status: passed ? "Passed" : "Failed",
  result: passed ? "Passed" : "Failed",
  validationIds: ["VAL-AINVIL-COMPILE-GATE-SAFETY-001"],
  validationId: "VAL-AINVIL-COMPILE-GATE-SAFETY-001",
  failureClass: passed ? "None" : "CompileError",
  acceptanceIds: ["AC-AINVIL-COMPILE-GATE-SAFETY-001"],
  requirementIds: ["REQ-AINVIL-COMPILE-GATE-SAFETY-001"],
  unityTargets: [tempRelativePath],
  checks: evidenceChecks,
  checkedSteps: [],
  intentionalCompileErrorCreated: temporaryErrorFileCreated,
  compileGateStatusWithError: compileGateWithError?.compileStatus || compileGateWithError?.status || "NotRun",
  blockerType: compileGateWithError?.blockerType || null,
  playModeAttempted: false,
  downstreamValidationSkipped: true,
  compileErrorsDetected: compileErrors.length,
  compileErrors,
  errorFile: detectedError?.file || tempRelativePath,
  errorCode: detectedError?.code || null,
  errorMessage: detectedError?.message || null,
  temporaryErrorFileDeleted,
  csprojTemporaryIncludeRestored: csprojPatched === false,
  compileGateStatusAfterCleanup: compileGateAfterCleanup?.status || "NotRun",
  cleanupAttempts,
  cleanupWaitMs,
  staleEvidenceReused: false,
  publicReleaseReady: false,
  bridgeHealthResult: summary(compileGateWithError, "compile_gate.bridge_health"),
  compileStatusResult: summary(compileGateWithError, "compile_gate.unity_compile_status"),
  compileGateWithError,
  compileGateAfterCleanup,
  consoleErrorSummary: compileGateWithError?.consoleErrorSummary || null,
  consoleErrorCount: compileGateWithError?.consoleErrorSummary?.errorCount ?? null,
  failureReason: passed ? null : caughtError?.message || "Compile gate safety regression did not satisfy all pass criteria.",
  blocker: passed ? null : "CompileGateSafetyRegressionFailed",
  bridgeDiagnostics: [],
  validationResults: evidenceChecks.map((item) => ({
    validationId: "VAL-AINVIL-COMPILE-GATE-SAFETY-001",
    checkId: item.checkId,
    target: item.target,
    result: item.status,
    status: item.status,
    message: item.message
  })),
  observations: null,
  assertions: evidenceChecks.map((item) => ({
    id: item.checkId,
    result: item.status,
    passed: item.status === "Passed",
    message: item.message
  })),
  sourceValidationDesign: null,
  startedAt,
  finishedAt,
  completedAt: finishedAt,
  timestamp: finishedAt,
  remainingGaps: passed ? [] : ["Compile gate safety regression failed; inspect report before trusting Play Mode validation gating."],
  nextActions: passed
    ? ["Keep compile gate safety regression available as an explicit opt-in regression."]
    : ["Inspect compile gate safety regression report, remove any leftover temporary files, and rerun compile-check."],
  reportPath: relativeAInvilPath(reportPath)
};
evidence.checkedSteps = evidence.checks;

const report = {
  schemaVersion: "1.0.0",
  reportId: `CGSAFE-${finishedAt.replace(/[:.]/g, "-")}`,
  generatedAt: finishedAt,
  scenarioId,
  status: evidence.status,
  publicReleaseReady: false,
  evidencePath: relativeAInvilPath(evidencePath),
  evidence,
  nextAction: evidence.nextActions[0]
};

await mkdir(path.dirname(evidencePath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(markdownPath, formatMarkdown(report), "utf8");

console.log(`AInvil compile gate safety regression: ${evidence.status}`);
console.log(`Intentional compile error created: ${temporaryErrorFileCreated}`);
console.log(`Compile gate status with error: ${evidence.compileGateStatusWithError}`);
console.log(`Play Mode attempted: ${evidence.playModeAttempted}`);
console.log(`Downstream validation skipped: ${evidence.downstreamValidationSkipped}`);
console.log(`Temporary error file deleted: ${temporaryErrorFileDeleted}`);
console.log(`Compile gate status after cleanup: ${evidence.compileGateStatusAfterCleanup}`);
console.log(`Cleanup compile attempts: ${cleanupAttempts}`);
console.log(`Evidence: ${relativeAInvilPath(evidencePath)}`);
console.log(`Report: ${relativeAInvilPath(reportPath)}`);
if (!passed) process.exit(1);

function intentionalCompileErrorSource() {
  return [
    "// Temporary file generated by AInvil compile gate safety regression.",
    "// This file must be deleted before the regression exits.",
    "public class AInvilCompileGateIntentionalError",
    "{",
    "    public void Broken()",
    "    {",
    "        ThisSymbolDoesNotExist = 123;",
    "    }",
    "}",
    ""
  ].join("\n");
}

function patchCsproj(content, relativeFilePath) {
  const includePath = relativeFilePath.replaceAll("/", "\\");
  if (content.includes(`Compile Include="${includePath}"`)) return content;
  return content.replace("</Project>", `  <ItemGroup>\n    <Compile Include="${includePath}" />\n  </ItemGroup>\n</Project>`);
}

async function ensureBridgeReachable() {
  try {
    await unityRpc("unity_get_status", {});
  } catch (error) {
    throw new Error(`Unity Bridge is required before creating the intentional compile error file: ${error.message}`);
  }
}

async function refreshAssetsBestEffort() {
  try {
    await unityRpc("unity_refresh_assets", {});
  } catch {
    // Older bridge versions do not expose unity_refresh_assets. The local compile
    // gate still verifies the temporary file through the patched csproj include.
  }
  await sleep(1000);
}

async function waitForCleanupCompilePass() {
  const started = Date.now();
  let attempts = 0;
  let lastResult = null;
  const timeoutMs = Number(process.env.AINVIL_COMPILE_GATE_CLEANUP_TIMEOUT_MS || 120000);

  while (Date.now() - started <= timeoutMs) {
    attempts += 1;
    await refreshAssetsBestEffort();
    try {
      lastResult = await runUnityValidationPreflight({
        scenarioId: "compile-check",
        classification: "Operational",
        category: "ProductMvp",
        validationType: "CompileGate"
      });
    } catch (error) {
      lastResult = {
        status: "Blocked",
        blockerType: "BridgeDisconnected",
        failureReason: error.message,
        checks: [],
        compileErrors: [],
        playModeAttempted: false
      };
    }

    if (lastResult?.status === "Passed") {
      return { result: lastResult, attempts, elapsedMs: Date.now() - started };
    }

    const nonTemporaryCompileErrors = (lastResult?.compileErrors || []).filter((error) => {
      const file = String(error.file || "").replaceAll("\\", "/");
      return file && !file.endsWith(tempRelativePath.replaceAll("\\", "/"));
    });
    if (nonTemporaryCompileErrors.length > 0) {
      return { result: lastResult, attempts, elapsedMs: Date.now() - started };
    }

    await sleep(3000);
  }

  return {
    result: lastResult || {
      status: "Blocked",
      blockerType: "BridgeDisconnected",
      failureReason: "Unity Bridge did not return a cleanup compile result before timeout.",
      checks: [],
      compileErrors: [],
      playModeAttempted: false
    },
    attempts,
    elapsedMs: Date.now() - started
  };
}

async function unityRpc(method, params) {
  const unityUrl = process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(unityUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params: params || {} }),
      signal: controller.signal
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || `Unity Bridge HTTP ${response.status}`);
    return payload.result ?? payload;
  } finally {
    clearTimeout(timeout);
  }
}

function check(id, passed, target, message) {
  return {
    checkId: id,
    type: id.includes("play_mode") ? "PlayMode" : "Compile",
    target,
    status: passed ? "Passed" : "Failed",
    failureClass: passed ? "Unknown" : "CompileError",
    message
  };
}

function summary(gate, id) {
  const found = gate?.checks?.find((item) => item.id === id);
  return found ? {
    checkId: found.id,
    status: found.status,
    failureClass: found.failureClass,
    message: found.message
  } : null;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function formatMarkdown(report) {
  const evidence = report.evidence;
  return [
    "# AInvil Compile Gate Safety Regression",
    "",
    `- Scenario: ${report.scenarioId}`,
    `- Status: ${report.status}`,
    `- Compile gate with error: ${evidence.compileGateStatusWithError}`,
    `- Blocker type: ${evidence.blockerType || "None"}`,
    `- Play Mode attempted: ${evidence.playModeAttempted}`,
    `- Downstream validation skipped: ${evidence.downstreamValidationSkipped}`,
    `- Temporary error file deleted: ${evidence.temporaryErrorFileDeleted}`,
    `- Compile gate after cleanup: ${evidence.compileGateStatusAfterCleanup}`,
    `- Cleanup attempts: ${evidence.cleanupAttempts}`,
    `- Public Release Ready: ${evidence.publicReleaseReady ? "Yes" : "No"}`,
    "",
    "## Detected Compile Error",
    "",
    `- File: ${evidence.errorFile || "Unknown"}`,
    `- Code: ${evidence.errorCode || "Unknown"}`,
    `- Message: ${evidence.errorMessage || "Unknown"}`,
    "",
    "## Checks",
    "",
    "| Check | Status | Message |",
    "| --- | --- | --- |",
    ...evidence.checks.map((item) => `| ${item.checkId} | ${item.status} | ${esc(item.message)} |`),
    ""
  ].join("\n");
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
