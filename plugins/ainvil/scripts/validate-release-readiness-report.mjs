import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const filePath = resolveAInvilPath(process.argv[2] || "reports/release_readiness_report.json");
const errors = [];
const report = await readJson(filePath);

for (const field of ["schemaVersion", "reportId", "generatedAt", "product", "decision", "confidence", "gates", "blockers", "warnings", "evidenceRefs", "nextActions"]) {
  if (report[field] === undefined || report[field] === null || report[field] === "") errors.push(`release readiness report: missing ${field}.`);
}
if (report.schemaVersion !== "1.0.0") errors.push("release readiness report: schemaVersion should be 1.0.0.");
if (report.product !== "AInvil") errors.push("release readiness report: product should be AInvil.");
if (!Array.isArray(report.gates) || report.gates.length === 0) errors.push("release readiness report: gates should not be empty.");
if (!Array.isArray(report.blockers)) errors.push("release readiness report: blockers should be an array.");
if (!Array.isArray(report.nextActions)) errors.push("release readiness report: nextActions should be an array.");

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Release readiness validation passed: ${relativeAInvilPath(filePath)}.`);

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    errors.push(error.message);
    return {};
  }
}
