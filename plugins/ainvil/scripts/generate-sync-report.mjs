import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSyncReport } from "../core/sync-report.mjs";
import { pluginRoot, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const outputPath = path.resolve(pluginRoot, process.argv[2] || "reports/sync_report.json");
const report = await createSyncReport();
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Sync report generated: ${relativeAInvilPath(outputPath)}`);
