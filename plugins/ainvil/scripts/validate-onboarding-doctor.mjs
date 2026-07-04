import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const reportPath = resolveAInvilPath(process.argv[2] || "reports/onboarding_doctor_report.json");
const manifestPath = resolveAInvilPath(process.argv[3] || "state/workspace_manifest.json");
const errors = [];

const report = await readJson(reportPath, "onboarding doctor report");
const manifest = await readJson(manifestPath, "workspace manifest");

for (const field of ["schemaVersion", "reportId", "generatedAt", "product", "workspaceManifest", "unityRpcUrl", "healthUrl", "releaseReadiness", "summary", "checks", "nextActions"]) {
  if (report[field] === undefined || report[field] === null || report[field] === "") errors.push(`onboarding doctor report: missing ${field}.`);
}
if (report.schemaVersion !== "1.0.0") errors.push("onboarding doctor report: schemaVersion should be 1.0.0.");
if (report.product !== "AInvil") errors.push("onboarding doctor report: product should be AInvil.");
if (!Array.isArray(report.checks) || report.checks.length === 0) errors.push("onboarding doctor report: checks should not be empty.");
if (!report.summary || report.summary.total !== report.checks?.length) errors.push("onboarding doctor report: summary.total should match checks length.");
for (const status of ["passed", "warning", "failed", "blocked"]) {
  if (!Number.isInteger(report.summary?.[status])) errors.push(`onboarding doctor report: summary.${status} should be an integer.`);
}

for (const field of ["schemaVersion", "workspaceId", "product", "language", "pluginRoot", "docsPath", "graphPath", "evidencePath", "reportsPath", "createdAt", "lastOpenedAt"]) {
  if (manifest[field] === undefined || manifest[field] === null || manifest[field] === "") errors.push(`workspace manifest: missing ${field}.`);
}
if (manifest.schemaVersion !== "1.0.0") errors.push("workspace manifest: schemaVersion should be 1.0.0.");
if (manifest.product !== "AInvil") errors.push("workspace manifest: product should be AInvil.");

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Onboarding doctor validation passed: ${relativeAInvilPath(reportPath)}.`);

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
    return {};
  }
}
