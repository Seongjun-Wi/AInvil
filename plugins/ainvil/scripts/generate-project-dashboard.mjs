import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createProjectDashboard } from "../core/project-dashboard.mjs";
import { pluginRoot, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const outputPath = path.resolve(pluginRoot, process.argv[2] || "reports/project_dashboard.json");
const dashboard = await createProjectDashboard();
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");
console.log(`Project dashboard generated: ${relativeAInvilPath(outputPath)}`);
