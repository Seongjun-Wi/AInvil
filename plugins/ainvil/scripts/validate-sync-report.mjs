import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const filePath = resolveAInvilPath(process.argv[2] || "reports/sync_report.json");
const report = JSON.parse(await readFile(filePath, "utf8"));
const errors = [];
for (const field of ["schemaVersion", "syncReportId", "generatedAt", "sourceFiles", "graphSummary", "traceabilitySummary", "dashboardSummary", "driftFindings", "blockedSyncItems", "recommendedNextActions"]) {
  if (report[field] === undefined || report[field] === null || report[field] === "") errors.push(`sync report: missing ${field}.`);
}
if (report.schemaVersion !== "1.0.0") errors.push("sync report: schemaVersion should be 1.0.0.");
if (!Array.isArray(report.driftFindings)) errors.push("sync report: driftFindings should be an array.");
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`Sync report validation passed: ${relativeAInvilPath(filePath)}.`);
