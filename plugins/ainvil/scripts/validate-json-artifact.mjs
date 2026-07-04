import { readFile } from "node:fs/promises";
import { resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const relativePath = process.argv[2];
const label = process.argv[3] || relativePath;
const required = (process.argv[4] || "").split(",").filter(Boolean);
if (!relativePath) throw new Error("Usage: validate-json-artifact.mjs <relative-path> <label> [required,fields]");
const filePath = resolveAInvilPath(relativePath);
const data = JSON.parse(await readFile(filePath, "utf8"));
const errors = [];
if (data.schemaVersion !== "1.0.0") errors.push(`${label}: schemaVersion should be 1.0.0.`);
for (const field of required) {
  if (data[field] === undefined || data[field] === null || data[field] === "") errors.push(`${label}: missing ${field}.`);
}
if (Array.isArray(data.rows) && data.rows.length === 0) errors.push(`${label}: rows should not be empty.`);
if (Array.isArray(data.checks) && data.checks.length === 0) errors.push(`${label}: checks should not be empty.`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}
console.log(`${label} validation passed: ${relativeAInvilPath(filePath)}.`);
