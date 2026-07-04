import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const filePath = resolveAInvilPath(process.argv[2] || "reports/project_dashboard.json");
const dashboard = JSON.parse(await readFile(filePath, "utf8"));
const errors = [];
for (const field of ["schemaVersion", "dashboardId", "generatedAt", "projectName", "validationCoverage", "implementedFeatures", "validatedFeatures", "blockedTasks", "openQuestions"]) {
  if (dashboard[field] === undefined || dashboard[field] === null || dashboard[field] === "") errors.push(`project dashboard: missing ${field}.`);
}
if (dashboard.schemaVersion !== "1.0.0") errors.push("project dashboard: schemaVersion should be 1.0.0.");
if (!dashboard.nextRecommendedAction) errors.push("project dashboard: nextRecommendedAction should be present for resume.");
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`Project dashboard validation passed: ${relativeAInvilPath(filePath)}.`);
