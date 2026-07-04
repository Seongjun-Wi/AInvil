import path from "node:path";
import { fileURLToPath } from "node:url";

const coreDir = path.dirname(fileURLToPath(import.meta.url));

export const pluginRoot = path.resolve(coreDir, "..");

export const ainvilPaths = {
  root: pluginRoot,
  state: path.join(pluginRoot, "state"),
  reports: path.join(pluginRoot, "reports"),
  reviews: path.join(pluginRoot, "reviews"),
  docs: path.join(pluginRoot, "docs"),
  templates: path.join(pluginRoot, "templates"),
  schemas: path.join(pluginRoot, "schemas"),
  benchmarkDatasets: path.join(pluginRoot, "benchmarks/datasets"),
  benchmarkReports: path.join(pluginRoot, "benchmarks/reports"),
  scripts: path.join(pluginRoot, "scripts"),
  cli: path.join(pluginRoot, "cli"),
  core: path.join(pluginRoot, "core")
};

export function resolveAInvilPath(relativePath) {
  return path.join(pluginRoot, relativePath);
}

export function relativeAInvilPath(filePath) {
  return path.relative(pluginRoot, filePath).replaceAll(path.sep, "/");
}
