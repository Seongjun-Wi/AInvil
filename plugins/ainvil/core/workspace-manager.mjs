import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { ainvilPaths, pluginRoot, relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";

const DEFAULT_UNITY_RPC_URL = "http://127.0.0.1:17777/rpc";
const DEFAULT_WORKSPACE_MANIFEST = "state/workspace_manifest.json";
const DEFAULT_DOCTOR_REPORT = "reports/onboarding_doctor_report.json";

export async function loadWorkspaceManifest(relativePath = DEFAULT_WORKSPACE_MANIFEST) {
  const filePath = resolveAInvilPath(relativePath);
  try {
    return {
      exists: true,
      path: filePath,
      data: JSON.parse(await readFile(filePath, "utf8"))
    };
  } catch (error) {
    return { exists: false, path: filePath, data: null, error };
  }
}

export async function createWorkspaceManifest(options = {}) {
  const now = new Date().toISOString();
  const existing = await loadWorkspaceManifest(options.manifestPath);
  const unityProjectPath = await resolveUnityProjectPath(options.unityProjectPath || existing.data?.unityProjectPath);
  const manifest = {
    schemaVersion: "1.0.0",
    workspaceId: existing.data?.workspaceId || `AINVIL-WORKSPACE-${slug(path.basename(pluginRoot) || "default")}`,
    product: "AInvil",
    language: options.language || existing.data?.language || "ko",
    pluginRoot,
    unityProjectPath,
    docsPath: existing.data?.docsPath || ainvilPaths.docs,
    graphPath: existing.data?.graphPath || resolveAInvilPath("state/production_state_graph.json"),
    evidencePath: existing.data?.evidencePath || resolveAInvilPath("validation/evidence"),
    reportsPath: existing.data?.reportsPath || ainvilPaths.reports,
    unityBridgePackagePath: existing.data?.unityBridgePackagePath || resolveAInvilPath("unity-package/Packages/com.codex.unity-bridge"),
    unityBridgePackageRole: "Canonical source",
    rootUnityPackageMirrorPath: existing.data?.rootUnityPackageMirrorPath || path.resolve(pluginRoot, "..", "..", "UnityPackage", "Packages", "com.codex.unity-bridge"),
    rootUnityPackageMirrorRole: "Deprecated mirror/install artifact",
    createdAt: existing.data?.createdAt || now,
    lastOpenedAt: now
  };

  const manifestPath = resolveAInvilPath(options.manifestPath || DEFAULT_WORKSPACE_MANIFEST);
  await writeWorkspaceManifest(manifest, manifestPath);
  return { path: manifestPath, data: manifest };
}

export async function runOnboardingDoctor(options = {}) {
  const manifestResult = await createWorkspaceManifest(options);
  const manifest = manifestResult.data;
  const unityRpcUrl = options.unityRpcUrl || process.env.UNITY_BRIDGE_URL || DEFAULT_UNITY_RPC_URL;
  const healthUrl = options.healthUrl || process.env.UNITY_HEALTH_URL || unityRpcUrl.replace(/\/rpc$/, "/health");
  const checks = [];

  checks.push(await pathExistsCheck("workspace.manifest", manifestResult.path, "Required", "Workspace manifest is available.", "Create state/workspace_manifest.json by running ainvil doctor."));
  checks.push(await pathExistsCheck("ainvil.docs.ko", resolveAInvilPath("docs/ko/README.md"), "Recommended", "Korean documentation index is available.", "Create Korean user-facing planning documents."));
  checks.push(await pathExistsCheck("ainvil.graph", manifest.graphPath, "Required", "Production State Graph is available.", "Restore state/production_state_graph.json."));
  checks.push(await pathExistsCheck("ainvil.evidence.dir", manifest.evidencePath, "Recommended", "Validation evidence directory is available.", "Create validation/evidence and run live harness evidence export."));
  checks.push(await pathExistsCheck("unity.bridge.package.canonical", manifest.unityBridgePackagePath, "Required", "Canonical Unity Bridge package is available.", "Restore plugins/ainvil/unity-package/Packages/com.codex.unity-bridge."));
  const mirrorCheck = await pathExistsCheck("unity.bridge.package.rootMirror", manifest.rootUnityPackageMirrorPath, "Recommended", "Root UnityPackage mirror exists and is treated as deprecated/install artifact.", "No action required unless you intentionally maintain the root mirror.");
  checks.push({ ...mirrorCheck, role: manifest.rootUnityPackageMirrorRole });

  const bridgeHealth = await bridgeHealthCheck(healthUrl, options.rpcTimeoutMs);
  if (bridgeHealth.status !== "Passed") {
    bridgeHealth.diagnostics = await bridgeDiagnostics(manifest, healthUrl, bridgeHealth.message);
  }
  checks.push(bridgeHealth);
  let unityStatus = null;
  if (bridgeHealth.status === "Passed") {
    unityStatus = await unityRpcCheck(unityRpcUrl, "unity_get_status", {}, "unity.status", options.rpcTimeoutMs);
    checks.push(unityStatus);
    checks.push(await unityRpcCheck(unityRpcUrl, "unity_compile_status", {}, "unity.compile", options.rpcTimeoutMs));
  } else {
    checks.push(blockedCheck(
      "unity.status",
      "Unity Bridge status was not checked because the health endpoint is not reachable.",
      "Open Unity, import the AInvil Unity package, start Tools > Codex Unity Bridge > Start Server, then rerun ainvil doctor."
    ));
    checks.push(blockedCheck(
      "unity.compile",
      "Compile status was not checked because Unity Bridge is not reachable.",
      "Restore Unity Bridge connectivity before claiming Compile Verified validation."
    ));
  }

  const detectedUnityProjectPath = detectUnityProjectRoot(unityStatus?.data?.projectPath);
  if (!manifest.unityProjectPath && detectedUnityProjectPath) {
    manifest.unityProjectPath = detectedUnityProjectPath;
    await writeWorkspaceManifest(manifest, manifestResult.path);
  }

  checks.push(await unityProjectCheck(manifest.unityProjectPath));
  checks.push(...(await unityFolderChecks(manifest.unityProjectPath)));
  checks.push(await unityBridgeDependencyCheck(manifest.unityProjectPath, manifest.unityBridgePackagePath));

  const summary = summarizeChecks(checks);
  const report = {
    schemaVersion: "1.0.0",
    reportId: `ODR-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    generatedAt: new Date().toISOString(),
    product: "AInvil",
    workspaceManifest: relativeAInvilPath(manifestResult.path),
    unityRpcUrl,
    healthUrl,
    releaseReadiness: releaseReadinessFor(summary),
    summary,
    checks,
    nextActions: nextActionsForChecks(checks)
  };

  const reportPath = resolveAInvilPath(options.reportPath || DEFAULT_DOCTOR_REPORT);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { manifest: manifestResult, report: { path: reportPath, data: report } };
}

async function writeWorkspaceManifest(manifest, manifestPath) {
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function resolveUnityProjectPath(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.AINVIL_UNITY_PROJECT,
    process.env.UNITY_PROJECT_PATH,
    await findUnityProjectUnder(path.resolve(pluginRoot, "../..")),
    await findUnityProjectUnder(pluginRoot)
  ].filter(Boolean);
  return candidates.length ? path.resolve(candidates[0]) : null;
}

async function findUnityProjectUnder(root) {
  const maxDepth = 3;
  return findDirectory(root, 0);

  async function findDirectory(current, depth) {
    if (depth > maxDepth) return null;
    if (await isUnityProject(current)) return current;
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const found = await findDirectory(path.join(current, entry.name), depth + 1);
      if (found) return found;
    }
    return null;
  }
}

async function isUnityProject(directory) {
  return Boolean(directory)
    && await exists(path.join(directory, "Assets"))
    && await exists(path.join(directory, "ProjectSettings"));
}

function detectUnityProjectRoot(projectPath) {
  if (!projectPath) return null;
  const normalized = path.resolve(String(projectPath).replaceAll("\\", "/"));
  return path.basename(normalized).toLowerCase() === "assets" ? path.dirname(normalized) : normalized;
}

async function unityProjectCheck(unityProjectPath) {
  if (!unityProjectPath) {
    return warningCheck(
      "unity.project.path",
      "Unity project path is not configured.",
      "Set AINVIL_UNITY_PROJECT or run doctor with --unity-project <path>."
    );
  }
  if (!(await exists(unityProjectPath))) {
    return failedCheck(
      "unity.project.path",
      `Configured Unity project path does not exist: ${unityProjectPath}`,
      "Choose an existing Unity project path."
    );
  }
  if (!(await isUnityProject(unityProjectPath))) {
    return warningCheck(
      "unity.project.path",
      `Path exists but does not look like a Unity project: ${unityProjectPath}`,
      "Select a folder that contains Assets and ProjectSettings."
    );
  }
  return passedCheck("unity.project.path", `Unity project path is configured: ${unityProjectPath}`);
}

async function unityFolderChecks(unityProjectPath) {
  if (!unityProjectPath) return [];
  return [
    await pathExistsCheck("unity.assets", path.join(unityProjectPath, "Assets"), "Required", "Unity Assets folder exists.", "Select a valid Unity project."),
    await pathExistsCheck("unity.projectSettings", path.join(unityProjectPath, "ProjectSettings"), "Required", "Unity ProjectSettings folder exists.", "Select a valid Unity project."),
    await pathExistsCheck("unity.packages", path.join(unityProjectPath, "Packages"), "Recommended", "Unity Packages folder exists.", "Create or restore Unity Packages folder.")
  ];
}

async function unityBridgeDependencyCheck(unityProjectPath, canonicalPackagePath) {
  if (!unityProjectPath) {
    return warningCheck(
      "unity.bridge.package.dependency",
      "Unity Bridge package dependency was not checked because Unity project path is not configured.",
      "Run doctor with --unity-project <UnityProjectPath>."
    );
  }
  const manifestPath = path.join(unityProjectPath, "Packages", "manifest.json");
  if (!(await exists(manifestPath))) {
    return warningCheck(
      "unity.bridge.package.dependency",
      "Unity Packages/manifest.json is missing, so package dependency canonical status cannot be checked.",
      "Install the canonical Unity Bridge package through Unity Package Manager."
    );
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const dependency = manifest.dependencies?.["com.codex.unity-bridge"] || null;
    const canonicalPath = path.resolve(canonicalPackagePath || resolveAInvilPath("unity-package/Packages/com.codex.unity-bridge")).replaceAll("\\", "/");
    const normalizedDependency = String(dependency || "").replace(/^file:/, "").replaceAll("\\", "/");
    const pointsToCanonical = normalizedDependency === canonicalPath || normalizedDependency.endsWith("/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge");
    const pointsToDeprecatedMirror = normalizedDependency.endsWith("/UnityPackage/Packages/com.codex.unity-bridge");
    if (pointsToCanonical) {
      return {
        ...passedCheck("unity.bridge.package.dependency", "Unity Bridge dependency points to the canonical package."),
        target: manifestPath,
        dependency,
        packageDependencyClassification: "Canonical",
        canonicalPackageVerified: true
      };
    }
    if (dependency) {
      return {
        ...warningCheck(
          "unity.bridge.package.dependency",
          pointsToDeprecatedMirror
            ? `Unity Bridge dependency points to the deprecated root mirror: ${dependency}`
            : `Unity Bridge dependency points outside the canonical package: ${dependency}`,
          "Update Packages/manifest.json to use plugins/ainvil/unity-package/Packages/com.codex.unity-bridge before public release packaging."
        ),
        target: manifestPath,
        dependency,
        packageDependencyClassification: pointsToDeprecatedMirror ? "DeprecatedMirror" : "Unknown",
        canonicalPackageVerified: false
      };
    }
    return warningCheck(
      "unity.bridge.package.dependency",
      "com.codex.unity-bridge is not listed in Packages/manifest.json.",
      "Install the canonical Unity Bridge package through Unity Package Manager."
    );
  } catch (error) {
    return warningCheck(
      "unity.bridge.package.dependency",
      `Could not parse Unity Packages/manifest.json: ${error.message}`,
      "Repair Packages/manifest.json and rerun doctor."
    );
  }
}

async function bridgeHealthCheck(healthUrl, timeoutMs = 2500) {
  try {
    const response = await fetchWithTimeout(healthUrl, { method: "GET" }, timeoutMs);
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return warningCheck("unity.bridge.health", `Unity Bridge health returned non-JSON content: ${text.slice(0, 120)}`, "Restart the Unity Bridge server.");
    }
    if (!response.ok) {
      return blockedCheck("unity.bridge.health", `Unity Bridge health returned HTTP ${response.status}.`, "Restart Unity Bridge and rerun doctor.");
    }
    return { ...passedCheck("unity.bridge.health", "Unity Bridge health endpoint is reachable."), data };
  } catch (error) {
    return blockedCheck("unity.bridge.health", `Unity Bridge health is not reachable: ${error.message}`, "Open Unity, import the bridge package, start the server, then rerun doctor.");
  }
}

async function unityRpcCheck(unityRpcUrl, method, params, id, timeoutMs = 4000) {
  try {
    const response = await fetchWithTimeout(unityRpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params })
    }, timeoutMs);
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok || payload.error) {
      return failedCheck(id, payload.error || `Unity RPC ${method} returned HTTP ${response.status}.`, "Open the Unity console, resolve bridge/compile errors, and rerun doctor.");
    }
    return { ...passedCheck(id, `${method} succeeded.`), data: payload.result ?? payload };
  } catch (error) {
    return failedCheck(id, `${method} failed: ${error.message}`, "Check Unity Bridge logs and rerun doctor.");
  }
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

async function bridgeDiagnostics(manifest, healthUrl, errorMessage) {
  const canonicalPackage = manifest.unityBridgePackagePath
    ? path.join(manifest.unityBridgePackagePath, "package.json")
    : resolveAInvilPath("unity-package/Packages/com.codex.unity-bridge/package.json");
  const installedPackage = manifest.unityProjectPath
    ? path.join(manifest.unityProjectPath, "Packages", "com.codex.unity-bridge", "package.json")
    : null;
  return [
    {
      cause: "Unity Editor is not running or the configured Unity project is not open.",
      evidence: errorMessage,
      nextAction: "Open the configured Unity project, then rerun doctor."
    },
    {
      cause: "Unity Bridge HTTP server is not started.",
      evidence: healthUrl,
      nextAction: "In Unity, run Tools > Codex Unity Bridge > Start Server."
    },
    {
      cause: "Bridge URL or port mismatch.",
      evidence: `Doctor health URL is ${healthUrl}.`,
      nextAction: "Confirm UNITY_BRIDGE_URL uses the same port as Unity Bridge, normally http://127.0.0.1:17777/rpc."
    },
    {
      cause: "Workspace manifest Unity project path may be missing or incorrect.",
      evidence: manifest.unityProjectPath || "No unityProjectPath configured.",
      nextAction: "Run `ainvil doctor --unity-project <UnityProjectPath>` with the real Unity project path."
    },
    {
      cause: "Canonical Unity Bridge package may not be installed in the Unity project.",
      evidence: `Canonical exists=${await exists(canonicalPackage)}; installed package exists=${installedPackage ? await exists(installedPackage) : false}.`,
      nextAction: "Install the package from plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json through Unity Package Manager."
    },
    {
      cause: "Unity compile errors may prevent the Editor bridge script from loading.",
      evidence: "Compile status cannot be checked while Unity Bridge is unreachable.",
      nextAction: "After starting Unity, resolve Unity Console compile errors and rerun doctor."
    }
  ];
}

async function pathExistsCheck(id, filePath, importance, passedMessage, nextAction) {
  if (await exists(filePath)) {
    const info = await stat(filePath).catch(() => null);
    return {
      id,
      category: "Workspace",
      importance,
      status: "Passed",
      message: passedMessage,
      target: filePath,
      detail: info?.isDirectory() ? "Directory" : "File",
      nextAction: null
    };
  }
  const factory = importance === "Required" ? failedCheck : warningCheck;
  return factory(id, `${filePath} is missing.`, nextAction, "Workspace", importance);
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function passedCheck(id, message, category = "Unity", importance = "Required") {
  return { id, category, importance, status: "Passed", message, nextAction: null };
}

function warningCheck(id, message, nextAction, category = "Unity", importance = "Recommended") {
  return { id, category, importance, status: "Warning", message, nextAction };
}

function failedCheck(id, message, nextAction, category = "Unity", importance = "Required") {
  return { id, category, importance, status: "Failed", message, nextAction };
}

function blockedCheck(id, message, nextAction) {
  return { id, category: "Unity", importance: "Required", status: "Blocked", message, nextAction };
}

function summarizeChecks(checks) {
  const counts = { total: checks.length, passed: 0, warning: 0, failed: 0, blocked: 0 };
  for (const check of checks) {
    if (check.status === "Passed") counts.passed++;
    if (check.status === "Warning") counts.warning++;
    if (check.status === "Failed") counts.failed++;
    if (check.status === "Blocked") counts.blocked++;
  }
  return counts;
}

function releaseReadinessFor(summary) {
  if (summary.failed > 0) return "Blocked";
  if (summary.blocked > 0) return "Environment Blocked";
  if (summary.warning > 0) return "Needs Attention";
  return "Ready For Next Gate";
}

function nextActionsForChecks(checks) {
  return checks
    .filter((check) => check.status !== "Passed" && check.nextAction)
    .map((check) => ({
      checkId: check.id,
      status: check.status,
      summary: check.nextAction
    }));
}

function slug(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
