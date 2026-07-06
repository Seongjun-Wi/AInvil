import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveAInvilPath } from "./ainvil-paths.mjs";

const DEFAULT_UNITY_URL = "http://127.0.0.1:17777/rpc";

export async function runUnityValidationPreflight(options = {}) {
  const startedAt = options.startedAt || new Date().toISOString();
  const unityUrl = options.unityUrl || process.env.UNITY_BRIDGE_URL || DEFAULT_UNITY_URL;
  const healthUrl = options.healthUrl || process.env.UNITY_HEALTH_URL || unityUrl.replace(/\/rpc$/, "/health");
  const scenarioId = options.scenarioId || "compile-check";
  const classification = options.classification || "Operational";
  const category = options.category || "ProductMvp";
  const validationType = options.validationType || "CompileGate";
  const timeoutMs = options.timeoutMs || 45000;
  const rpcTimeoutMs = options.rpcTimeoutMs || 12000;
  const checks = [];

  const health = await healthCheck(healthUrl, rpcTimeoutMs);
  checks.push(health);
  if (!health.ok) {
    return finalizeCompileGate({
      startedAt,
      scenarioId,
      classification,
      category,
      validationType,
      unityUrl,
      healthUrl,
      checks,
      status: "Blocked",
      blockerType: "BridgeDisconnected",
      canEnterPlayMode: false,
      failureReason: "Unity Bridge health check failed. Compile gate could not run.",
      nextAction: "Open Unity, start Codex Unity Bridge, then rerun compile-check."
    });
  }

  const unityStatus = await callUnityCheck(unityUrl, "unity_get_status", {}, rpcTimeoutMs);
  checks.push(unityStatus);
  const unityProjectPath = normalizeUnityProjectPath(unityStatus.data?.projectPath);

  const refresh = await callUnityCheck(unityUrl, "unity_refresh_assets", {}, rpcTimeoutMs);
  checks.push(refresh);

  const compile = await waitForCompileReady(unityUrl, timeoutMs, rpcTimeoutMs);
  checks.push(...compile.checks);

  const consoleCheck = await callUnityCheck(unityUrl, "unity_get_console_logs", { level: "error", limit: 100 }, rpcTimeoutMs);
  checks.push(consoleCheck);
  const localCompileCheck = await localCSharpCompileCheck(unityProjectPath, options.localCompileTimeoutMs || 60000);
  checks.push(localCompileCheck);

  const compileErrors = normalizeCompileErrors(compile.statusCheck?.data, consoleCheck.data, localCompileCheck.data);
  const compileErrorCount = compileErrors.length;
  const hasCompileErrors = compileErrorCount > 0 || compileHasErrors(compile.statusCheck) || compileHasErrors(localCompileCheck);
  const compilePassed = compile.statusCheck?.ok && !compileInProgress(compile.statusCheck) && !hasCompileErrors;
  const status = compilePassed ? "Passed" : "CompileBlocked";

  return finalizeCompileGate({
    startedAt,
    scenarioId,
    classification,
    category,
    validationType,
    unityUrl,
    healthUrl,
    unityProjectPath,
    checks,
    status,
    blockerType: compilePassed ? null : "CompileBlocked",
    canEnterPlayMode: compilePassed,
    compileStatus: compilePassed ? "Passed" : "Failed",
    compileErrorCount,
    compileErrors,
    failureReason: compilePassed ? null : "Unity project has compile errors or compilation did not become ready. Play Mode validation was not attempted.",
    nextAction: compilePassed
      ? "Compile gate passed. Runtime validation may enter Play Mode."
      : "Fix compile errors, wait for Unity compilation to finish, then rerun validation.",
    runtimeAssemblyFreshness: {
      status: compilePassed ? "Fresh" : "StaleSuspected",
      reason: compilePassed
        ? "Compile gate passed immediately before Play Mode validation."
        : "Compile gate failed; a new runtime assembly may not have been generated.",
      compileCheckedBeforePlayMode: true,
      lastCompileStatus: compilePassed ? "Passed" : "Failed",
      recommendation: compilePassed
        ? "Proceed to Play Mode validation."
        : "Exit Play Mode if active, refresh assets, fix compile errors, wait for compile, rerun validation."
    }
  });
}

export async function writeCompileGateReport(result, options = {}) {
  const reportPath = resolveAInvilPath(options.reportPath || "reports/unity_compile_gate_report.json");
  const markdownPath = resolveAInvilPath(options.markdownPath || "reports/unity_compile_gate_report.md");
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, formatCompileGateMarkdown(result), "utf8");
  return { reportPath, markdownPath };
}

export async function writeCompileBlockedEvidence(result, options = {}) {
  const evidencePath = resolveAInvilPath(options.evidencePath || `validation/evidence/EVID-${slug(result.scenarioId)}-compile-blocked-latest.json`);
  await mkdir(path.dirname(evidencePath), { recursive: true });
  const evidence = compileGateEvidence(result);
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return { evidencePath, evidence };
}

export function compileGateEvidence(result) {
  return {
    schemaVersion: "1.0.0",
    evidenceId: `EVID-${slug(result.scenarioId)}-compile-blocked-latest`,
    source: "LiveHarness",
    scenarioId: result.scenarioId,
    classification: result.classification,
    category: result.category,
    validationType: result.validationType,
    validationLevel: result.status === "Passed" ? "Compile Verified" : "Compile Failed",
    status: result.status === "Passed" ? "Passed" : "Blocked",
    result: result.status === "Passed" ? "Passed" : "Blocked",
    validationIds: [],
    validationId: null,
    failureClass: result.status === "Passed" ? "None" : "CompileError",
    acceptanceIds: [],
    requirementIds: [],
    unityTargets: [],
    checks: flattenCompileGateChecks(result.checks),
    checkedSteps: flattenCompileGateChecks(result.checks),
    bridgeHealthResult: checkSummary(result.checks, "compile_gate.bridge_health"),
    compileStatusResult: checkSummary(result.checks, "compile_gate.unity_compile_status"),
    compileStatus: result.compileStatusResult || null,
    compileErrorCount: result.compileErrorCount,
    compileErrors: result.compileErrors,
    consoleErrorSummary: result.consoleErrorSummary,
    consoleErrorCount: result.consoleErrorSummary?.errorCount ?? null,
    blockerType: result.blockerType,
    playModeAttempted: false,
    runtimeAssemblyFreshness: result.runtimeAssemblyFreshness,
    staleEvidenceReused: false,
    failureReason: result.failureReason,
    blocker: result.blockerType,
    bridgeDiagnostics: [],
    validationResults: [],
    observations: null,
    assertions: [],
    sourceValidationDesign: null,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    completedAt: result.finishedAt,
    timestamp: result.finishedAt,
    remainingGaps: result.status === "Passed" ? [] : ["Play Mode validation was blocked by compile gate."],
    nextActions: [result.nextAction],
    publicReleaseReady: false
  };
}

function finalizeCompileGate(input) {
  const finishedAt = new Date().toISOString();
  const compileStatusResult = input.checks.find((check) => check.id === "compile_gate.unity_compile_status") || null;
  const consoleCheck = input.checks.find((check) => check.id === "compile_gate.unity_get_console_logs") || null;
  const result = {
    schemaVersion: "1.0.0",
    gateId: "UNITY-COMPILE-GATE",
    scenarioId: input.scenarioId,
    classification: input.classification,
    category: input.category,
    validationType: input.validationType,
    startedAt: input.startedAt,
    finishedAt,
    status: input.status,
    canEnterPlayMode: input.canEnterPlayMode,
    compileStatus: input.compileStatus || (input.status === "Passed" ? "Passed" : "Failed"),
    compileErrorCount: input.compileErrorCount || 0,
    compileErrors: input.compileErrors || [],
    consoleErrorSummary: consoleErrorSummary(consoleCheck),
    unityProjectPath: input.unityProjectPath || null,
    unityUrl: input.unityUrl,
    healthUrl: input.healthUrl,
    checks: input.checks,
    compileStatusResult,
    blockerType: input.blockerType || null,
    playModeAttempted: false,
    runtimeAssemblyFreshness: input.runtimeAssemblyFreshness || null,
    failureReason: input.failureReason || null,
    nextAction: input.nextAction
  };
  return result;
}

async function waitForCompileReady(unityUrl, timeoutMs, rpcTimeoutMs) {
  const checks = [];
  const started = Date.now();
  let last = null;
  while (Date.now() - started <= timeoutMs) {
    last = await callUnityCheck(unityUrl, "unity_compile_status", {}, rpcTimeoutMs);
    last.id = "compile_gate.unity_compile_status";
    checks.push(last);
    if (last.ok && !compileInProgress(last)) {
      if (compileHasErrors(last)) {
        last.status = "Failed";
        last.failureClass = "CompileError";
        last.message = "Unity compile status reports compile errors. Play Mode validation is blocked.";
      } else {
        last.status = "Passed";
        last.failureClass = "Unknown";
        last.message = "Unity compile status is stable and has no compile errors.";
      }
      return { checks, statusCheck: last };
    }
    await sleep(1500);
  }
  return { checks, statusCheck: last };
}

async function healthCheck(healthUrl, timeoutMs) {
  try {
    const response = await fetchWithTimeout(healthUrl, { method: "GET" }, timeoutMs);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return {
      id: "compile_gate.bridge_health",
      type: "Static",
      target: healthUrl,
      status: response.ok ? "Passed" : "Blocked",
      ok: response.ok,
      failureClass: response.ok ? "Unknown" : "BridgeDisconnected",
      message: response.ok ? "Unity Bridge health endpoint is reachable." : `Unity Bridge health HTTP ${response.status}.`,
      data
    };
  } catch (error) {
    return {
      id: "compile_gate.bridge_health",
      type: "Static",
      target: healthUrl,
      status: "Blocked",
      ok: false,
      failureClass: "BridgeDisconnected",
      message: error.message
    };
  }
}

async function callUnityCheck(unityUrl, method, params, timeoutMs) {
  try {
    const data = await callUnity(unityUrl, method, params, timeoutMs);
    return {
      id: `compile_gate.${method}`,
      type: method.includes("compile") ? "Compile" : method.includes("console") ? "Console" : method.includes("asset") ? "Asset" : "Static",
      target: method,
      status: "Passed",
      ok: true,
      failureClass: "Unknown",
      message: `${method} succeeded.`,
      data
    };
  } catch (error) {
    return {
      id: `compile_gate.${method}`,
      type: method.includes("compile") ? "Compile" : method.includes("console") ? "Console" : method.includes("asset") ? "Asset" : "Static",
      target: method,
      status: method === "unity_refresh_assets" ? "Warning" : "Failed",
      ok: false,
      failureClass: method.includes("compile") ? "CompileError" : "Unknown",
      message: error.message
    };
  }
}

async function callUnity(unityUrl, method, params, timeoutMs) {
  const response = await fetchWithTimeout(unityUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params: params || {} })
  }, timeoutMs);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok || payload.error) throw new Error(payload.error || `Unity Bridge HTTP ${response.status}`);
  return payload.result ?? payload;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function localCSharpCompileCheck(unityProjectPath, timeoutMs) {
  const csprojPath = unityProjectPath ? path.join(unityProjectPath, "Assembly-CSharp.csproj") : null;
  if (!csprojPath) {
    return {
      id: "compile_gate.local_csharp_build",
      type: "Compile",
      target: "Assembly-CSharp.csproj",
      status: "Warning",
      ok: false,
      failureClass: "Unknown",
      message: "Unity project path is unavailable; local C# compile check was skipped.",
      data: { errors: [] }
    };
  }
  return new Promise((resolve) => {
    const child = spawn("dotnet", ["build", csprojPath, "--no-restore", "--nologo", "-v:minimal", "/p:UseSharedCompilation=false"], {
      cwd: unityProjectPath,
      windowsHide: true
    });
    let output = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        id: "compile_gate.local_csharp_build",
        type: "Compile",
        target: csprojPath,
        status: "Warning",
        ok: false,
        failureClass: "Unknown",
        message: `Local C# compile check could not start: ${error.message}`,
        data: { errors: [], output: "" }
      });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const errors = parseCompilerMessages(output);
      const failed = timedOut || code !== 0 || errors.length > 0;
      resolve({
        id: "compile_gate.local_csharp_build",
        type: "Compile",
        target: csprojPath,
        status: failed ? "Failed" : "Passed",
        ok: !failed,
        failureClass: failed ? "CompileError" : "Unknown",
        message: timedOut
          ? `Local C# compile check timed out after ${timeoutMs}ms.`
          : failed
            ? `Local C# compile check failed with ${errors.length} compiler error(s).`
            : "Local C# compile check passed.",
        data: {
          exitCode: code,
          timedOut,
          errors,
          outputTail: output.slice(-4000)
        }
      });
    });
  });
}

function normalizeCompileErrors(compileData, consoleData, localCompileData) {
  const fromCompile = Array.isArray(compileData?.errors) ? compileData.errors : [];
  const fromRecent = Array.isArray(compileData?.recentErrors) ? compileData.recentErrors : [];
  const fromConsole = Array.isArray(consoleData?.logs) ? consoleData.logs : [];
  const fromLocal = Array.isArray(localCompileData?.errors) ? localCompileData.errors : [];
  const errors = [...fromCompile, ...fromRecent, ...fromConsole, ...fromLocal].map(normalizeCompileError);
  const seen = new Set();
  return errors.filter((error) => {
    const key = `${error.file}:${error.line}:${error.column}:${error.code}:${error.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCompileError(error) {
  const message = String(error?.message || error?.Message || "");
  const parsed = parseCompilerMessage(message);
  return {
    file: error?.file ?? parsed.file ?? null,
    line: Number(error?.line ?? parsed.line ?? 0),
    column: Number(error?.column ?? parsed.column ?? 0),
    code: error?.code ?? parsed.code ?? null,
    message: parsed.message || message,
    rawMessage: message,
    stackTrace: error?.stackTrace || error?.StackTrace || null
  };
}

function parseCompilerMessage(message) {
  const match = String(message).match(/^(?<file>.+?)\((?<line>\d+),(?<column>\d+)\):\s*error\s+(?<code>CS\d+):\s*(?<message>.+)$/);
  if (!match?.groups) return {};
  return {
    file: match.groups.file.replaceAll("\\", "/"),
    line: Number(match.groups.line),
    column: Number(match.groups.column),
    code: match.groups.code,
    message: match.groups.message
  };
}

function parseCompilerMessages(output) {
  return String(output)
    .split(/\r?\n/)
    .map((line) => parseCompilerMessage(line.trim()))
    .filter((error) => error.code)
    .map((error) => ({
      file: error.file,
      line: error.line,
      column: error.column,
      code: error.code,
      message: error.message,
      rawMessage: `${error.file}(${error.line},${error.column}): error ${error.code}: ${error.message}`
    }));
}

function compileInProgress(check) {
  const data = check?.data || {};
  return Boolean(data.isCompiling || data.compiling || data.isUpdating || data.status === "Compiling");
}

function compileHasErrors(check) {
  const data = check?.data || {};
  if (data.hasCompileErrors === true || data.hasErrors === true || data.errorsPresent === true) return true;
  if (typeof data.compileErrorCount === "number") return data.compileErrorCount > 0;
  if (typeof data.errorCount === "number") return data.errorCount > 0;
  if (Array.isArray(data.errors)) return data.errors.length > 0;
  if (Array.isArray(data.compilerErrors)) return data.compilerErrors.length > 0;
  if (Array.isArray(data.recentErrors)) return data.recentErrors.length > 0;
  return false;
}

function consoleErrorSummary(check) {
  const logs = check?.data?.logs;
  return {
    status: check?.status || "NotRun",
    errorCount: Array.isArray(logs) ? logs.length : null,
    message: check?.message || "Console logs were not checked."
  };
}

function flattenCompileGateChecks(checks) {
  return checks.map((check) => ({
    checkId: check.id,
    type: check.type,
    target: check.target,
    status: check.status,
    failureClass: check.failureClass || "Unknown",
    message: check.message
  }));
}

function checkSummary(checks, id) {
  const check = checks.find((item) => item.id === id);
  return check ? {
    checkId: check.id,
    status: check.status,
    failureClass: check.failureClass,
    message: check.message
  } : null;
}

function normalizeUnityProjectPath(projectPath) {
  if (!projectPath) return null;
  return String(projectPath).replaceAll("\\", "/").replace(/\/Assets$/, "");
}

function formatCompileGateMarkdown(result) {
  return [
    "# Unity Compile Gate",
    "",
    `- Scenario: ${result.scenarioId}`,
    `- Status: ${result.status}`,
    `- Can enter Play Mode: ${result.canEnterPlayMode}`,
    `- Compile status: ${result.compileStatus}`,
    `- Compile error count: ${result.compileErrorCount}`,
    `- Play Mode attempted: ${result.playModeAttempted}`,
    `- Public Release Ready: No`,
    "",
    "## Compile Errors",
    "",
    result.compileErrors.length ? "| File | Line | Code | Message |\n| --- | ---: | --- | --- |\n" + result.compileErrors.map((error) => `| ${esc(error.file || "Unknown")} | ${error.line || 0} | ${error.code || "Unknown"} | ${esc(error.message)} |`).join("\n") : "- None",
    "",
    "## Next Action",
    "",
    result.nextAction || "None",
    ""
  ].join("\n");
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function slug(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 100);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
