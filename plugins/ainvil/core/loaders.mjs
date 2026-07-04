import { access, readdir, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { ainvilPaths, resolveAInvilPath } from "./ainvil-paths.mjs";

export async function existsAInvilArtifact(relativePath) {
  try {
    await access(resolveAInvilPath(relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadJsonArtifact(relativePath, options = {}) {
  const filePath = resolveAInvilPath(relativePath);
  try {
    return {
      exists: true,
      path: filePath,
      data: JSON.parse(await readFile(filePath, "utf8")),
      error: null
    };
  } catch (error) {
    if (options.strict) throw error;
    return {
      exists: false,
      path: filePath,
      data: null,
      error
    };
  }
}

export async function loadTextArtifact(relativePath, options = {}) {
  const filePath = resolveAInvilPath(relativePath);
  try {
    return {
      exists: true,
      path: filePath,
      text: await readFile(filePath, "utf8"),
      error: null
    };
  } catch (error) {
    if (options.strict) throw error;
    return {
      exists: false,
      path: filePath,
      text: "",
      error
    };
  }
}

export function loadProductionStateGraph(options = {}) {
  return loadJsonArtifact("state/production_state_graph.json", options);
}

export function loadProductionIntelligenceReport(options = {}) {
  return loadJsonArtifact("reports/production_intelligence_report.json", options);
}

export async function loadReviewRecords(options = {}) {
  return loadJsonDirectory("reviews", options);
}

export async function loadBenchmarkCases(options = {}) {
  return loadJsonDirectory("benchmarks/datasets", options);
}

export async function loadWorkflowExecutionRecords(options = {}) {
  return loadJsonDirectory("workflow/runs", options);
}

export async function loadValidationEvidence(options = {}) {
  return loadJsonDirectory("validation/evidence", options);
}

export async function loadKpiArtifacts() {
  return {
    framework: await loadTextArtifact("docs/Studio_KPI_Framework.md"),
    collectionStrategyExists: await existsAInvilArtifact("docs/KPI_Collection_Strategy.md"),
    reviewProcessExists: await existsAInvilArtifact("docs/KPI_Review_Process.md"),
    dashboardTemplateExists: await existsAInvilArtifact("templates/kpi_dashboard.md"),
    latestDashboardPath: await findLatestAInvilFile("reports", /kpi.*\.(md|json)$/i)
  };
}

export async function loadJsonDirectory(relativeDir, options = {}) {
  const dir = resolveAInvilPath(relativeDir);
  try {
    const files = (await readdir(dir)).filter((file) => file.endsWith(".json")).sort();
    const output = [];
    for (const file of files) {
      const filePath = path.join(dir, file);
      output.push({
        name: file,
        path: filePath,
        data: JSON.parse(await readFile(filePath, "utf8")),
        error: null
      });
    }
    return output;
  } catch (error) {
    if (options.strict) throw error;
    return [];
  }
}

export async function findLatestAInvilFile(relativeDir, pattern) {
  const dir = resolveAInvilPath(relativeDir);
  try {
    const files = (await readdir(dir)).filter((file) => pattern.test(file));
    let latest = null;
    for (const file of files) {
      const filePath = path.join(dir, file);
      const info = await stat(filePath);
      if (!latest || info.mtimeMs > latest.mtimeMs) {
        latest = { path: filePath, mtimeMs: info.mtimeMs };
      }
    }
    return latest?.path || null;
  } catch {
    return null;
  }
}

export { ainvilPaths };
