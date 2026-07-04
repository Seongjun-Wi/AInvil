#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRcBaselineManifest } from "../core/rc-baseline.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const startedAt = new Date().toISOString();
const includeLiveSmoke = process.argv.includes("--live-smoke");
const requireLiveSmoke = process.argv.includes("--require-live-smoke");
const includeProductMvp = process.argv.includes("--product-mvp");
const includePlayability = process.argv.includes("--playability");
const includeBuild = process.argv.includes("--build");
const unityProject = optionValue("--unity-project");
const workspaceType = unityProject ? "Fresh" : "Existing";

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

const results = [];
if (includeLiveSmoke || requireLiveSmoke) {
  for (const item of liveSteps) results.push(await runStep(item));
}
if (includeProductMvp) {
  for (const item of productMvpSteps) results.push(await runStep(item));
}
if (includePlayability) {
  for (const item of playabilitySteps) results.push(await runStep(item));
}
if (includeBuild) {
  for (const item of buildSteps) results.push(await runStep(item));
}
for (const item of generationSteps) results.push(await runStep(item));
for (const item of validationSteps) results.push(await runStep(item));

await createRcBaselineManifest();

const finishedAt = new Date().toISOString();
const failed = results.filter((item) => item.status === "Failed");
const blockedRequired = results.filter((item) => item.status === "Blocked" && !item.optional);
const optionalBlocked = results.filter((item) => item.status === "Blocked" && item.optional);
const report = {
  schemaVersion: "1.0.0",
  reportId: `REG-${finishedAt.replace(/[:.]/g, "-")}`,
  startedAt,
  finishedAt,
  mode: includeLiveSmoke || requireLiveSmoke || includeProductMvp || includePlayability || includeBuild ? "offline-plus-live" : "offline",
  status: failed.length || blockedRequired.length ? "Failed" : "Passed",
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
  steps: results,
  reports: [
    "reports/regression_suite_latest.json",
    "reports/regression_suite_latest.md",
    "reports/rc_baseline_manifest.json",
    "reports/environment_dependency_audit.json"
  ],
  nextAction: failed.length || blockedRequired.length
    ? "Inspect failed required regression steps and rerun the suite."
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

async function runStep(item) {
  const result = await runNode(item.args);
  const status = result.code === 0 ? "Passed" : item.optional ? "Blocked" : "Failed";
  return {
    id: item.id,
    title: item.title,
    command: `node plugins/ainvil/${item.args.join(" ")}`,
    optional: item.optional,
    status,
    exitCode: result.code,
    outputTail: tail(result.output, 4000),
    nextAction: status === "Passed"
      ? null
      : item.optional
        ? "Open Unity, start the Unity Bridge server, then rerun with --live-smoke."
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

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
