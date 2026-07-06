import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { loadJsonArtifact } from "./loaders.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";

const RC_JSON = "reports/rc_baseline_manifest.json";
const RC_MD = "reports/rc_baseline_manifest.md";
const ENV_JSON = "reports/environment_dependency_audit.json";
const ENV_MD = "reports/environment_dependency_audit.md";

export async function createRcBaselineManifest(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const review = await loadJsonArtifact("reviews/production_core_readiness_review.json");
  const release = await loadJsonArtifact("reports/release_readiness_report.json");
  const productization = await loadJsonArtifact("reports/productization_status_report.json");
  const evidence = await loadJsonArtifact(productization.data?.operationalValidation?.latestEvidence?.path || "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json");
  const harness = await loadJsonArtifact("harness/reports/latest-live-harness-report.json");
  const doctor = await loadJsonArtifact("reports/onboarding_doctor_report.json");
  const dashboard = await loadJsonArtifact("reports/project_dashboard.json");
  const reviewEvaluation = await loadJsonArtifact("reports/production_core_review_evaluation.json");
  const freshWorkspace = await loadJsonArtifact("reports/fresh_workspace_verification_report.json");
  const productMvp = productization.data?.productMvpWorkflow || null;
  const procedural = productization.data?.proceduralRecoveryJob || null;
  const visualValidation = productization.data?.visualValidation || null;
  const spaceQuality = productization.data?.spaceQuality || null;
  const productMvpReadyCandidate = productMvp?.readyCandidate === true;
  const operationalScenarios = await loadOperationalScenarios();
  const environmentAudit = await createEnvironmentDependencyAudit({ write: options.write !== false, generatedAt });

  const manifest = {
    schemaVersion: "1.0.0",
    rcName: options.rcName || "AInvil Core RC",
    rcVersion: options.rcVersion || `core-rc-${generatedAt.slice(0, 10)}`,
    generatedAt,
    releaseLevel: {
      current: productMvpReadyCandidate
        ? "Core Release Ready / Product MVP Ready Candidate"
        : "Core Release Ready / Release Candidate",
      notClaimed: productMvpReadyCandidate ? ["Public Release Ready"] : ["Product MVP Ready", "Public Release Ready"],
      reason: productMvpReadyCandidate
        ? "Core smoke/evidence pipeline and one DungeonRecoveryCompany Product MVP vertical-slice E2E are verified; public installation and manual playability gates are still separate."
        : "Core smoke/evidence pipeline is verified, but Product MVP gameplay and public installation gates are not claimed."
    },
    decisions: {
      productionCoreReview: review.exists ? review.data.decision : "Missing",
      releaseReadiness: release.exists ? release.data.decision : "Missing",
      productization: productization.exists ? productization.data.summary?.decision || "Unknown" : "Missing"
    },
    canonicalUnityBridgePackage: {
      path: "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge",
      packageJson: "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json",
      rootMirrorRole: "UnityPackage/ is a deprecated mirror/install artifact, not the source of truth."
    },
    operationalScenarios,
    productMvpWorkflow: productMvp || null,
    proceduralRecoveryJob: procedural || null,
    visualValidation: visualValidation || null,
    spaceQuality: spaceQuality || null,
    coreEvidence: [
      artifactRef("Production Core review", review, "Production Core review decision."),
      artifactRef("Production Core review evaluation", reviewEvaluation, "Criteria-based review reevaluation."),
      artifactRef("Release readiness", release, "Release gate decision."),
      artifactRef("Productization status", productization, "Productization status and blocker summary."),
      artifactRef("Onboarding doctor", doctor, "Unity Bridge health and compile status."),
      artifactRef("Project dashboard", dashboard, "Dashboard status view."),
      artifactRef("Live harness report", harness, "Latest live operational smoke report."),
      artifactRef("Operational validation evidence", evidence, "Latest non-sample Operational Passed evidence.")
    ].filter(Boolean),
    evidenceSummary: evidence.exists ? {
      evidenceId: evidence.data.evidenceId,
      scenarioId: evidence.data.scenarioId,
      classification: evidence.data.classification,
      status: evidence.data.status,
      validationLevel: evidence.data.validationLevel,
      consoleErrorCount: evidence.data.consoleErrorSummary?.errorCount ?? null,
      assertionCount: evidence.data.assertions?.length || 0,
      path: relativeAInvilPath(evidence.path)
    } : null,
    liveHarnessSummary: harness.exists ? {
      mode: harness.data.mode,
      summary: harness.data.summary,
      path: relativeAInvilPath(harness.path)
    } : null,
    freshWorkspaceVerification: freshWorkspace.exists ? {
      status: freshWorkspace.data.status,
      workspaceClassification: freshWorkspace.data.workspaceClassification,
      unityProjectPath: freshWorkspace.data.requestedUnityProjectPath,
      evidencePath: freshWorkspace.data.evidencePath,
      staleEvidenceReused: freshWorkspace.data.staleEvidenceReused,
      packageDependencyPath: freshWorkspace.data.packageDependencyPath || freshWorkspace.data.packageInstallCheck?.dependency || null,
      packageDependencyClassification: freshWorkspace.data.packageDependencyClassification || freshWorkspace.data.packageInstallCheck?.packageDependencyClassification || "Unknown",
      canonicalPackageVerified: freshWorkspace.data.canonicalPackageVerified === true || freshWorkspace.data.packageInstallCheck?.canonicalPackageVerified === true,
      reportPath: relativeAInvilPath(freshWorkspace.path),
      label: freshWorkspace.data.status === "Passed"
        ? "Core RC Reproducibility Verified"
        : `Core RC Existing Workspace Verified, Fresh Workspace ${freshWorkspace.data.status}`
    } : {
      status: "Not Run",
      workspaceClassification: "FreshWorkspace",
      unityProjectPath: null,
      evidencePath: null,
      staleEvidenceReused: null,
      packageDependencyPath: null,
      packageDependencyClassification: "Unknown",
      canonicalPackageVerified: false,
      reportPath: null,
      label: "Core RC Existing Workspace Verified, Fresh Workspace Not Run"
    },
    knownLimitations: [
      productMvpReadyCandidate
        ? "This baseline proves one generated DungeonRecoveryCompany Product MVP vertical slice through deterministic Play Mode hooks; it does not prove broad game production coverage."
        : "This baseline proves the AInvil Core smoke/evidence pipeline, not full product MVP gameplay generation.",
      freshWorkspace.exists && freshWorkspace.data.status === "Passed"
        ? "Fresh workspace smoke reproducibility has passed for the recorded Unity project, but this still does not prove full public installation support across arbitrary machines."
        : "Fresh workspace installation is documented and can be run, but this baseline was produced in the current development workspace.",
      "Unity Bridge server listens on the package default local port 17777; clients can override UNITY_BRIDGE_URL when needed.",
      "Workspace manifest and generated reports contain machine-local paths and must be regenerated per workspace.",
      productMvpReadyCandidate
        ? "The Product MVP E2E used deterministic validation hooks; manual player-input feel, balance, UX, save/load, build, and public install validation remain open."
        : "The operational smoke scenario is read-only and Compile Verified; it does not prove full Play Mode gameplay behavior for a user game."
    ],
    environmentAudit: {
      path: "reports/environment_dependency_audit.json",
      findingCounts: environmentAudit.summary
    },
    recommendedVerificationCommands: [
      "node plugins/ainvil/cli/ainvil-cli.mjs doctor",
      "node plugins/ainvil/scripts/run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational",
      "node plugins/ainvil/cli/ainvil-cli.mjs review",
      "node plugins/ainvil/cli/ainvil-cli.mjs productization",
      "node plugins/ainvil/cli/ainvil-cli.mjs release",
      "node plugins/ainvil/scripts/run-ainvil-regression-suite.mjs",
      "node plugins/ainvil/scripts/run-ainvil-regression-suite.mjs --live-smoke"
    ]
  };

  if (options.write !== false) {
    await writeJson(RC_JSON, manifest);
    await writeText(RC_MD, formatRcMarkdown(manifest));
  }

  return {
    data: manifest,
    path: resolveAInvilPath(RC_JSON),
    markdownPath: resolveAInvilPath(RC_MD),
    environmentAudit
  };
}

export async function createEnvironmentDependencyAudit(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const files = await listFiles(pluginRoot);
  const findings = [];
  for (const file of files) {
    const relativePath = relativeAInvilPath(file);
    if (/\.(png|jpg|jpeg|gif|dll|exe|meta)$/i.test(relativePath)) continue;
    let text = "";
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }
    const localPathMatches = relativePath === "core/rc-baseline.mjs"
      ? []
      : [...text.matchAll(/(^|[\s"'`(])(?:[A-Z]:[\\/])|wiseongjun|Unity\/GashaGame/g)];
    if (localPathMatches.length) {
      findings.push({
        id: `ENV-LOCAL-${findings.length + 1}`,
        category: isGeneratedLocalState(relativePath) ? "GeneratedLocalState" : "SourceHardcoding",
        severity: isGeneratedLocalState(relativePath) ? "Info" : "Needs Review",
        path: relativePath,
        summary: `${localPathMatches.length} local path marker(s) detected.`,
        nextAction: isGeneratedLocalState(relativePath)
          ? "Regenerate this artifact in the target workspace."
          : "Replace hardcoded local path with a manifest/env/config value."
      });
    }
    if (/127\.0\.0\.1:17777|17777/.test(text)) {
      findings.push({
        id: `ENV-BRIDGE-${findings.length + 1}`,
        category: "BridgePort",
        severity: isBridgeConfigurableSource(relativePath) ? "Info" : "KnownLimitation",
        path: relativePath,
        summary: "Unity Bridge default localhost port 17777 is referenced.",
        nextAction: isBridgeConfigurableSource(relativePath)
          ? "Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required."
          : "For Unity-side server port changes, update the Unity Bridge package or document the fixed package default."
      });
    }
  }

  const summary = findings.reduce((counts, item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
    return counts;
  }, {});
  const report = {
    schemaVersion: "1.0.0",
    reportId: `ENV-AUDIT-${generatedAt.replace(/[:.]/g, "-")}`,
    generatedAt,
    product: "AInvil",
    summary,
    configurationSurface: {
      unityBridgeUrl: "UNITY_BRIDGE_URL, default http://127.0.0.1:17777/rpc",
      unityHealthUrl: "UNITY_HEALTH_URL or derived from UNITY_BRIDGE_URL",
      unityProjectPath: "ainvil doctor --unity-project <path>, AINVIL_UNITY_PROJECT, UNITY_PROJECT_PATH, or Bridge status detection",
      workspaceManifest: "plugins/ainvil/state/workspace_manifest.json is generated per workspace",
      canonicalPackage: "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge"
    },
    findings
  };

  if (options.write !== false) {
    await writeJson(ENV_JSON, report);
    await writeText(ENV_MD, formatEnvironmentMarkdown(report));
  }
  return report;
}

async function loadOperationalScenarios() {
  const scenarioDir = resolveAInvilPath("harness/scenarios");
  const output = [];
  let files = [];
  try {
    files = (await readdir(scenarioDir)).filter((file) => file.endsWith(".json")).sort();
  } catch {
    return output;
  }
  for (const file of files) {
    const filePath = path.join(scenarioDir, file);
    const scenario = JSON.parse(await readFile(filePath, "utf8"));
    if (scenario.classification === "Operational") {
      output.push({
        id: scenario.id,
        title: scenario.title,
        classification: scenario.classification,
        evidenceOutputPath: scenario.evidenceOutputPath || null,
        path: relativeAInvilPath(filePath)
      });
    }
  }
  return output;
}

async function listFiles(root) {
  const output = [];
  await walk(root);
  return output;

  async function walk(current) {
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        output.push(fullPath);
      }
    }
  }
}

function artifactRef(kind, artifact, summary) {
  if (!artifact.exists) return null;
  return { kind, summary, path: relativeAInvilPath(artifact.path) };
}

function isGeneratedLocalState(relativePath) {
  return /^(reports|state|validation\/evidence|harness\/reports)\//.test(relativePath);
}

function isBridgeConfigurableSource(relativePath) {
  return /^(core|scripts|mcp-server|docs|README\.md|validation|harness)\//.test(relativePath);
}

function formatRcMarkdown(manifest) {
  return [
    "# AInvil Core RC Baseline Manifest",
    "",
    `- RC: ${manifest.rcName}`,
    `- Version: ${manifest.rcVersion}`,
    `- Generated at: ${manifest.generatedAt}`,
    `- Release level: ${manifest.releaseLevel.current}`,
    `- Production Core review: ${manifest.decisions.productionCoreReview}`,
    `- Release readiness: ${manifest.decisions.releaseReadiness}`,
    `- Productization: ${manifest.decisions.productization}`,
    `- Fresh workspace verification: ${manifest.freshWorkspaceVerification.label}`,
    `- Canonical Unity Bridge package verified: ${manifest.freshWorkspaceVerification.canonicalPackageVerified ? "Yes" : "No"}`,
    `- Product MVP E2E: ${manifest.productMvpWorkflow?.status || "Unknown"}`,
    `- Human Playability Review: ${manifest.productMvpWorkflow?.humanPlayabilityReview?.status || "Unknown"}`,
    `- Build Verification: ${manifest.productMvpWorkflow?.buildVerification?.status || "Unknown"}`,
    `- Product MVP Ready Candidate: ${manifest.productMvpWorkflow?.readyCandidate ? "Yes" : "No"}`,
    `- Procedural Recovery Job: ${manifest.proceduralRecoveryJob?.status || "Unknown"}`,
    `- Procedural Generation Verified: ${manifest.proceduralRecoveryJob?.proceduralGenerationVerified ? "Yes" : "No"}`,
    `- Visual Validation: ${manifest.visualValidation?.status || "Unknown"}`,
    `- Procedural Space Quality: ${manifest.spaceQuality?.status || "Unknown"}`,
    `- Screenshot Evidence Available: ${manifest.visualValidation?.screenshotEvidenceAvailable ? "Yes" : "No"}`,
    `- Camera Framing Check: ${manifest.visualValidation?.cameraFramingCheck || "Unknown"}`,
    `- Missing Shader Suspected: ${manifest.visualValidation?.missingShaderSuspected ? "Yes" : "No"}`,
    `- Public Release Ready: No`,
    "",
    "## Evidence",
    "",
    ...manifest.coreEvidence.map((item) => `- ${item.kind}: ${item.path}`),
    "",
    "## Operational Scenarios",
    "",
    ...manifest.operationalScenarios.map((item) => `- ${item.id}: ${item.path}`),
    "",
    "## Known Limitations",
    "",
    ...manifest.knownLimitations.map((item) => `- ${item}`),
    "",
    "## Recommended Verification",
    "",
    "```powershell",
    ...manifest.recommendedVerificationCommands,
    "```",
    ""
  ].join("\n");
}

function formatEnvironmentMarkdown(report) {
  return [
    "# AInvil Environment Dependency Audit",
    "",
    `- Generated at: ${report.generatedAt}`,
    "",
    "## Configuration Surface",
    "",
    ...Object.entries(report.configurationSurface).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Finding Counts",
    "",
    ...Object.entries(report.summary).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Findings",
    "",
    "| Category | Severity | Path | Summary | Next action |",
    "| --- | --- | --- | --- | --- |",
    ...(report.findings.length
      ? report.findings.map((item) => `| ${item.category} | ${item.severity} | ${item.path} | ${esc(item.summary)} | ${esc(item.nextAction)} |`)
      : ["| None | None | None | None | None |"]),
    ""
  ].join("\n");
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

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}
