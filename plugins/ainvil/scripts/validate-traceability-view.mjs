import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const filePath = resolveAInvilPath(process.argv[2] || "reports/traceability_view.json");
const view = JSON.parse(await readFile(filePath, "utf8"));
const errors = [];
for (const field of ["schemaVersion", "viewId", "generatedAt", "sourceGraphId", "rows", "proposedLinks", "summary"]) {
  if (view[field] === undefined || view[field] === null || view[field] === "") errors.push(`traceability view: missing ${field}.`);
}
if (view.schemaVersion !== "1.0.0") errors.push("traceability view: schemaVersion should be 1.0.0.");
if (!Array.isArray(view.rows) || view.rows.length === 0) errors.push("traceability view: rows should be non-empty.");
if (!Array.isArray(view.proposedLinks)) errors.push("traceability view: proposedLinks should be an array.");
for (const [index, row] of (view.rows || []).entries()) {
  if (!row.rowId || !row.status || !Array.isArray(row.missingLinks)) errors.push(`traceability view: rows[${index}] missing rowId, status, or missingLinks.`);
}
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`Traceability view validation passed: ${relativeAInvilPath(filePath)}.`);
