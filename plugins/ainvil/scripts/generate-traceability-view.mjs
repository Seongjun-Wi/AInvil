import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createTraceabilityView } from "../core/traceability-view.mjs";
import { pluginRoot, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const outputPath = path.resolve(pluginRoot, process.argv[2] || "reports/traceability_view.json");
const view = await createTraceabilityView();
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(view, null, 2)}\n`, "utf8");
console.log(`Traceability view generated: ${relativeAInvilPath(outputPath)}`);
