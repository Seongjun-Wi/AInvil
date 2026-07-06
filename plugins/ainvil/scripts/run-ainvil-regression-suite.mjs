#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRcBaselineManifest } from "../core/rc-baseline.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "../core/ainvil-paths.mjs";
import { runUnityValidationPreflight, writeCompileBlockedEvidence, writeCompileGateReport } from "../core/unity-compile-gate.mjs";

const startedAt = new Date().toISOString();
const includeLiveSmoke = process.argv.includes("--live-smoke");
const requireLiveSmoke = process.argv.includes("--require-live-smoke");
const includeProductMvp = process.argv.includes("--product-mvp");
const includePlayability = process.argv.includes("--playability");
const includeBuild = process.argv.includes("--build");
const includeProcedural = process.argv.includes("--procedural");
const includeVisual = process.argv.includes("--visual");
const includeSpaceQuality = process.argv.includes("--space-quality");
const includeCompileGateSafety = process.argv.includes("--compile-gate-safety");
const unityProject = optionValue("--unity-project");
const workspaceType = unityProject ? "Fresh" : "Existing";
const unityUrl = process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc";
const compileGateSafetyOnly = includeCompileGateSafety
  && !includeLiveSmoke
  && !requireLiveSmoke
  && !includeProductMvp
  && !includePlayability
  && !includeBuild
  && !includeProcedural
  && !includeVisual
  && !includeSpaceQuality;

const validationSteps = [
  step("validate-review-records", "Review record validation", ["scripts/validate-review-records.mjs"]),
  step("validate-release-readiness-report", "Release readiness report validation", ["scripts/validate-release-readiness-report.mjs"]),
  step("validate-project-dashboard", "Project dashboard validation", ["scripts/validate-project-dashboard.mjs"]),
  step("validate-validation-evidence", "Validation evidence validation", ["scripts/validate-validation-evidence.mjs"]),
  step("validate-ainvil-harness", "Harness schema validation", ["scripts/validate-ainvil-harness.mjs"]),
  step("validate-validation-design", "Validation design validation", ["scripts/validate-validation-design.mjs"]),
  step("validate-ainvil-cli-offline", "CLI validation without live doctor mutation", ["scripts/validate-ainvil-cli.mjs", "--offline"])
];

const generationSteps = [
  step("review", "Production Core review evaluation", ["cli/ainvil-cli.mjs", "review"]),
  step("productization", "Productization report generation", ["cli/ainvil-cli.mjs", "productization"]),
  step("release", "Release report generation", ["cli/ainvil-cli.mjs", "release"]),
  step("productization-final", "Productization report final sync", ["cli/ainvil-cli.mjs", "productization"]),
  step("dashboard", "Project dashboard generation", ["scripts/generate-project-dashboard.mjs"]),
  step("rc-baseline", "RC baseline manifest generation", ["scripts/generate-rc-baseline.mjs"])
];

const liveSteps = [
  unityProject
    ? step("fresh-live-smoke", "Fresh workspace operational Unity Bridge smoke", ["scripts/verify-fresh-workspace.mjs", "--unity-project", unityProject], { optional: !requireLiveSmoke })
    : step("live-smoke", "Operational Unity Bridge smoke", ["scripts/run-ainvil-live-harness.mjs", "--mode", "probe", "--scenario", "ainvil_bridge_smoke_operational"], { optional: !requireLiveSmoke })
];

const productMvpSteps = [
  step("product-mvp-live-harness", "Dungeon Recovery Company Product MVP first playable E2E", [
    "scripts/run-ainvil-live-harness.mjs",
    "--mode",
    "probe",
    "--scenario",
    "dungeon_recovery_first_playable_e2e"
  ], { optional: !includeProductMvp })
];

const playabilitySteps = [
  step("product-mvp-playability-review", "Dungeon Recovery human playability review gate", [
    "scripts/generate-dungeon-recovery-playability-review.mjs"
  ])
];

const buildSteps = [
  step("product-mvp-build-verification", "Dungeon Recovery Windows development build verification", [
    "scripts/verify-dungeon-recovery-first-playable-build.mjs"
  ])
];

const proceduralSteps = [
  step("procedural-live-harness", "Dungeon Recovery procedural recovery job E2E", [
    "scripts/run-ainvil-live-harness.mjs",
    "--mode",
    "probe",
    "--scenario",
    "dungeon_recovery_procedural_recovery_job_e2e"
  ], { optional: !includeProcedural })
];

const visualSteps = [
  step("procedural-visual-validation", "Dungeon Recovery procedural visual validation gate", [
    "scripts/run-ainvil-live-harness.mjs",
    "--mode",
    "probe",
    "--scenario",
    "dungeon_recovery_procedural_visual_validation"
  ], { optional: !includeVisual })
];

const spaceQualitySteps = [
  step("procedural-space-quality-validation", "Dungeon Recovery procedural space quality validation gate", [
    "scripts/run-ainvil-live-harness.mjs",
    "--mode",
    "probe",
    "--scenario",
    "dungeon_recovery_procedural_space_quality_validation"
  ], { optional: !includeSpaceQuality })
];

const proceduralBuildSteps = [
  step("procedural-build-verification", "Dungeon Recovery procedural Windows development build verification", [
    "scripts/verify-dungeon-recovery-procedural-recovery-job-build.mjs"
  ])
];

const compileGateSafetySteps = [
  step("compile-gate-safety", "Compile gate blocks Play Mode on intentional compile error", [
    "scripts/run-ainvil-compile-gate-regression.mjs",
    "--unity-project",
    unityProject || ""
  ])
];

const results = [];
const liveOrBuildRequested = includeLiveSmoke || requireLiveSmoke || includeProductMvp || includeBuild || includeProcedural || includeVisual || includeSpaceQuality;
let compileGate = null;
let compileGateBlocked = false;
let bridgeEnvironmentBlocked = false;
if (liveOrBuildRequested) {
  compileGate = await runUnityValidationPreflight({
    scenarioId: "regression",
    category: "ProductMvp",
    validationType: "RegressionCompileGate"
  });
  await writeCompileGateReport(compileGate);
  if (compileGate.status !== "Passed") {
    await writeCompileBlockedEvidence(compileGate, {
      evidencePath: "validation/evidence/EVID-regression-compile-blocked-latest.json"
    });
  }
  compileGateBlocked = compileGate.status !== "Passed";
  bridgeEnvironmentBlocked = compileGate.blockerType === "BridgeDisconnected";
  results.push({
    id: "compile-gate",
    title: "Unity compile gate before live/build regression",
    command: "node plugins/ainvil/cli/ainvil-cli.mjs compile-check",
    optional: false,
    status: compileGateBlocked ? "Blocked" : "Passed",
    exitCode: compileGateBlocked ? 1 : 0,
    outputTail: compileGateBlocked
      ? `${bridgeEnvironmentBlocked ? "EnvironmentBlocked" : "CompileBlocked"}: ${compileGate.failureReason}\nErrors: ${(compileGate.compileErrors || []).map((error) => `${error.file || "Unknown"}:${error.line || 0} ${error.code || ""} ${error.message}`).join("\n")}`
      : "Compile gate passed.",
    nextAction: compileGateBlocked ? compileGate.nextAction : null
  });
}
if (includeLiveSmoke || requireLiveSmoke) {
  for (const item of liveSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
}
if (includeProductMvp) {
  for (const item of productMvpSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
}
if (includePlayability) {
  for (const item of playabilitySteps) results.push(await runStep(item));
}
if (includeBuild) {
  results.push(compileGateBlocked ? skippedByCompileGate(editModeGuardStep("unity-edit-mode-before-product-build"), compileGate) : await ensureUnityEditModeStep("unity-edit-mode-before-product-build"));
  for (const item of buildSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
}
if (includeProcedural) {
  for (const item of proceduralSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
  if (includeBuild) {
    results.push(compileGateBlocked ? skippedByCompileGate(editModeGuardStep("unity-edit-mode-before-procedural-build"), compileGate) : await ensureUnityEditModeStep("unity-edit-mode-before-procedural-build"));
    for (const item of proceduralBuildSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
  }
}
if (includeVisual) {
  for (const item of visualSteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
}
if (includeSpaceQuality) {
  for (const item of spaceQualitySteps) results.push(compileGateBlocked ? skippedByCompileGate(item, compileGate) : await runStep(item));
}
if (includeCompileGateSafety) {
  for (const item of compileGateSafetySteps) results.push(await runStep(item));
}
if (!compileGateSafetyOnly) {
  for (const item of generationSteps) results.push(await runStep(item));
  for (const item of validationSteps) results.push(await runStep(item));
}

if (!compileGateSafetyOnly) {
  await createRcBaselineManifest();
}

const finishedAt = new Date().toISOString();
const failed = results.filter((item) => item.status === "Failed");
const blockedRequired = results.filter((item) => item.status === "Blocked" && !item.optional);
const optionalBlocked = results.filter((item) => item.status === "Blocked" && item.optional);
const report = {
  schemaVersion: "1.0.0",
  reportId: `REG-${finishedAt.replace(/[:.]/g, "-")}`,
  startedAt,
  finishedAt,
  mode: includeLiveSmoke || requireLiveSmoke || includeProductMvp || includePlayability || includeBuild || includeProcedural || includeVisual || includeSpaceQuality ? "offline-plus-live" : "offline",
  status: failed.length ? "Failed" : blockedRequired.length ? "Blocked" : "Passed",
  summary: {
    total: results.length,
    passed: results.filter((item) => item.status === "Passed").length,
    failed: failed.length,
    blocked: results.filter((item) => item.status === "Blocked").length,
    optionalBlocked: optionalBlocked.length
  },
  workspace: {
    path: unityProject || null,
    type: workspaceType,
    liveSmokeTargetProject: unityProject || "Workspace manifest/current Unity Bridge target",
    evidenceFileUsed: unityProject
      ? "validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json"
      : "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json",
    staleEvidenceReused: false
  },
  revalidationStatus: blockedRequired.some(isEnvironmentBlockedStep) ? "EnvironmentBlocked" : "Current",
  blockerType: blockedRequired.some(isEnvironmentBlockedStep) ? "UnityBridgeDisconnected" : (blockedRequired[0]?.blockerType || null),
  liveSmoke: {
    requested: includeLiveSmoke || requireLiveSmoke,
    required: requireLiveSmoke,
    status: results.find((item) => item.id === "live-smoke" || item.id === "fresh-live-smoke")?.status || "NotRun"
  },
  productMvp: {
    requested: includeProductMvp,
    status: results.find((item) => item.id === "product-mvp-live-harness")?.status || "NotRun",
    evidenceFileUsed: "validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json",
    playability: {
      requested: includePlayability,
      status: results.find((item) => item.id === "product-mvp-playability-review")?.status || "NotRun",
      reportPath: "reports/dungeon_recovery_first_playable_playability_review.json"
    },
    build: {
      requested: includeBuild,
      status: results.find((item) => item.id === "product-mvp-build-verification")?.status || "NotRun",
      reportPath: "reports/dungeon_recovery_first_playable_build_verification.json"
    }
  },
  procedural: {
    requested: includeProcedural,
    status: results.find((item) => item.id === "procedural-live-harness")?.status || "NotRun",
    evidenceFileUsed: "validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json",
    build: {
      requested: includeProcedural && includeBuild,
      status: results.find((item) => item.id === "procedural-build-verification")?.status || "NotRun",
      reportPath: "reports/dungeon_recovery_procedural_recovery_job_build_verification.json"
    }
  },
  visualValidation: {
    requested: includeVisual,
    status: results.find((item) => item.id === "procedural-visual-validation")?.status || "NotRun",
    evidenceFileUsed: "validation/evidence/EVID-dungeon-recovery-procedural-visual-validation-latest.json",
    reportPath: "reports/dungeon_recovery_procedural_visual_review.json",
    screenshotDirectory: "reports/visual_review/screenshots",
    humanReviewRequired: true
  },
  compileGate: compileGate ? {
    requested: liveOrBuildRequested,
    status: compileGate.status,
    blockerType: compileGate.blockerType,
    canEnterPlayMode: compileGate.canEnterPlayMode,
    compileErrorCount: compileGate.compileErrorCount,
    reportPath: "reports/unity_compile_gate_report.json"
  } : {
    requested: false,
    status: "NotRun"
  },
  compileGateSafety: {
    requested: includeCompileGateSafety,
    status: results.find((item) => item.id === "compile-gate-safety")?.status || "NotRun",
    evidenceFileUsed: "validation/evidence/EVID-ainvil-compile-gate-blocks-playmode-latest.json",
    reportPath: "reports/ainvil_compile_gate_safety_regression_report.json"
  },
  spaceQuality: {
    requested: includeSpaceQuality,
    status: results.find((item) => item.id === "procedural-space-quality-validation")?.status || "NotRun",
    evidenceFileUsed: "validation/evidence/EVID-dungeon-recovery-procedural-space-quality-latest.json",
    reportPath: "reports/dungeon_recovery_procedural_space_quality_review.json",
    dryRunReport: "reports/dungeon_recovery_procedural_space_quality_dry_run.json"
  },
  steps: results,
  reports: [
    "reports/regression_suite_latest.json",
    "reports/regression_suite_latest.md",
    ...(compileGateSafetyOnly ? [] : [
      "reports/rc_baseline_manifest.json",
      "reports/environment_dependency_audit.json"
    ])
  ],
  nextAction: failed.length
    ? "Inspect failed required regression steps and rerun the suite."
    : blockedRequired.length
      ? "Restore Unity Bridge stability and rerun live regression. Last known passed evidence remains valid but revalidation is required."
    : optionalBlocked.length
      ? "Offline regression passed. Open Unity and rerun with --live-smoke when live Bridge proof is required."
      : "Regression suite passed."
};

await writeJson("reports/regression_suite_latest.json", report);
await writeText("reports/regression_suite_latest.md", formatMarkdown(report));

console.log(`AInvil regression suite: ${report.status}`);
console.log(`Mode: ${report.mode}`);
console.log(`Workspace: ${report.workspace.type}${report.workspace.path ? ` (${report.workspace.path})` : ""}`);
console.log(`Steps: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.blocked} blocked (${report.summary.optionalBlocked} optional)`);
console.log("Report: reports/regression_suite_latest.json");
if (report.status !== "Passed") process.exit(1);

function step(id, title, args, options = {}) {
  return { id, title, args, optional: Boolean(options.optional) };
}

function editModeGuardStep(id) {
  return step(id, "Unity Edit Mode guard before build verification", ["<unity-edit-mode-guard>"]);
}

async function ensureUnityEditModeStep(id) {
  try {
    await unityRpc("unity_exit_play_mode", {});
    let status = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await sleep(500);
      status = await unityRpc("unity_get_status", {});
      if (status?.isPlaying === false && status?.isPlayingOrWillChangePlaymode === false) {
        return {
          id,
          title: "Unity Edit Mode guard before build verification",
          command: "unity_exit_play_mode + unity_get_status",
          optional: false,
          status: "Passed",
          exitCode: 0,
          outputTail: "Unity is in Edit Mode before build verification.",
          nextAction: null
        };
      }
    }
    return {
      id,
      title: "Unity Edit Mode guard before build verification",
      command: "unity_exit_play_mode + unity_get_status",
      optional: false,
      status: "Failed",
      exitCode: 1,
      outputTail: `Unity did not return to Edit Mode before build verification. Last status: ${JSON.stringify(status)}`,
      nextAction: "Exit Play Mode in Unity, then rerun build verification."
    };
  } catch (error) {
    return {
      id,
      title: "Unity Edit Mode guard before build verification",
      command: "unity_exit_play_mode + unity_get_status",
      optional: false,
      status: "Failed",
      exitCode: 1,
      outputTail: error.message,
      nextAction: "Restore Unity Bridge connectivity before build verification."
    };
  }
}

async function unityRpc(method, params) {
  const response = await fetch(unityUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ method, params: params || {} })
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error || `Unity Bridge HTTP ${response.status}`);
  return payload.result ?? payload;
}

async function runStep(item) {
  const result = await runNode(item.args);
  const blockedByHarness = liveHarnessReportedBlocked(result.output);
  const environmentBlocked = isEnvironmentBlockedOutput(result.output);
  const status = blockedByHarness || environmentBlocked
    ? "Blocked"
    : result.code === 0
      ? "Passed"
      : item.optional
        ? "Blocked"
        : "Failed";
  return {
    id: item.id,
    title: item.title,
    command: `node plugins/ainvil/${item.args.join(" ")}`,
    optional: item.optional,
    status,
    blockerType: environmentBlocked ? "UnityBridgeDisconnected" : blockedByHarness ? "ValidationBlocked" : null,
    revalidationStatus: environmentBlocked ? "EnvironmentBlocked" : status === "Blocked" ? "RevalidationRequired" : "Current",
    exitCode: result.code,
    outputTail: tail(result.output, 4000),
    nextAction: status === "Passed"
      ? null
      : environmentBlocked
        ? "Restart Unity Bridge and rerun this live validation. Do not classify this as product failure."
        : item.optional
          ? "Open Unity, start the Unity Bridge server, then rerun with --live-smoke."
          : status === "Blocked"
            ? "Resolve the validation blocker and rerun this step."
            : "Resolve this regression failure before claiming the RC baseline is reproducible."
  };
}

function runNode(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args.map((arg, index) => index === 0 ? resolveAInvilPath(arg) : arg), {
      cwd: pluginRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env }
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

function skippedByCompileGate(item, gate) {
  const environmentBlocked = gate.blockerType === "BridgeDisconnected";
  return {
    id: item.id,
    title: item.title,
    command: `node plugins/ainvil/${item.args.join(" ")}`,
    optional: item.optional,
    status: "Blocked",
    blockerType: environmentBlocked ? "UnityBridgeDisconnected" : "CompileBlocked",
    revalidationStatus: environmentBlocked ? "EnvironmentBlocked" : "CompileBlocked",
    exitCode: 1,
    outputTail: `${environmentBlocked ? "SkippedByEnvironmentBlocked" : "SkippedByCompileGate"}: ${gate.failureReason}`,
    nextAction: gate.nextAction || (environmentBlocked ? "Restore Unity Bridge connectivity before running downstream validation." : "Fix compile errors before running downstream validation.")
  };
}

function liveHarnessReportedBlocked(output) {
  return /blocked:\s*[1-9]\d*/i.test(String(output || "")) || /-\s*Blocked:/i.test(String(output || ""));
}

function isEnvironmentBlockedOutput(output) {
  return /UnityBridgeDisconnected|BridgeDisconnected|EnvironmentBlocked|Unable to connect|ECONNREFUSED|Unity Bridge.*not reachable|Bridge.*unreachable/i.test(String(output || ""));
}

function isEnvironmentBlockedStep(step) {
  return step?.blockerType === "UnityBridgeDisconnected" || step?.revalidationStatus === "EnvironmentBlocked" || isEnvironmentBlockedOutput(step?.outputTail);
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

function formatMarkdown(report) {
  return [
    "# AInvil Regression Suite",
    "",
    `- Started at: ${report.startedAt}`,
    `- Finished at: ${report.finishedAt}`,
    `- Mode: ${report.mode}`,
    `- Status: ${report.status}`,
    `- Workspace type: ${report.workspace.type}`,
    `- Workspace path: ${report.workspace.path || "current workspace"}`,
    `- Evidence file used: ${report.workspace.evidenceFileUsed}`,
    `- Stale evidence reused: ${report.workspace.staleEvidenceReused}`,
    "",
    "| Step | Status | Optional | Next action |",
    "| --- | --- | --- | --- |",
    ...report.steps.map((item) => `| ${item.id} | ${item.status} | ${item.optional ? "yes" : "no"} | ${esc(item.nextAction || "None")} |`),
    "",
    "## Live Smoke",
    "",
    `- Requested: ${report.liveSmoke.requested}`,
    `- Required: ${report.liveSmoke.required}`,
    `- Status: ${report.liveSmoke.status}`,
    "",
    "## Product MVP",
    "",
    `- Requested: ${report.productMvp.requested}`,
    `- Status: ${report.productMvp.status}`,
    `- Evidence file used: ${report.productMvp.evidenceFileUsed}`,
    `- Playability requested: ${report.productMvp.playability.requested}`,
    `- Playability status: ${report.productMvp.playability.status}`,
    `- Build requested: ${report.productMvp.build.requested}`,
    `- Build status: ${report.productMvp.build.status}`,
    "",
    "## Procedural Recovery Job",
    "",
    `- Requested: ${report.procedural.requested}`,
    `- Status: ${report.procedural.status}`,
    `- Evidence file used: ${report.procedural.evidenceFileUsed}`,
    `- Build requested: ${report.procedural.build.requested}`,
    `- Build status: ${report.procedural.build.status}`,
    "",
    "## Visual Validation",
    "",
    `- Requested: ${report.visualValidation.requested}`,
    `- Status: ${report.visualValidation.status}`,
    `- Evidence file used: ${report.visualValidation.evidenceFileUsed}`,
    `- Report: ${report.visualValidation.reportPath}`,
    `- Screenshot directory: ${report.visualValidation.screenshotDirectory}`,
    `- Human review required: ${report.visualValidation.humanReviewRequired}`,
    "",
    "## Compile Gate",
    "",
    `- Requested: ${report.compileGate.requested}`,
    `- Status: ${report.compileGate.status}`,
    `- Blocker type: ${report.compileGate.blockerType || "None"}`,
    `- Can enter Play Mode: ${report.compileGate.canEnterPlayMode ?? "n/a"}`,
    `- Compile error count: ${report.compileGate.compileErrorCount ?? "n/a"}`,
    `- Report: ${report.compileGate.reportPath || "None"}`,
    "",
    "## Compile Gate Safety",
    "",
    `- Requested: ${report.compileGateSafety.requested}`,
    `- Status: ${report.compileGateSafety.status}`,
    `- Evidence file used: ${report.compileGateSafety.evidenceFileUsed}`,
    `- Report: ${report.compileGateSafety.reportPath}`,
    "",
    "## Procedural Space Quality",
    "",
    `- Requested: ${report.spaceQuality.requested}`,
    `- Status: ${report.spaceQuality.status}`,
    `- Evidence file used: ${report.spaceQuality.evidenceFileUsed}`,
    `- Report: ${report.spaceQuality.reportPath}`,
    `- Dry-run report: ${report.spaceQuality.dryRunReport}`,
    ""
  ].join("\n");
}

function tail(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(-maxLength) : text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
