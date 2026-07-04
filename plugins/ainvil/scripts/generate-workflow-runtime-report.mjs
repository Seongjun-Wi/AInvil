import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkflowRuntimeReport } from "../core/workflow-report.mjs";
import { pluginRoot } from "../core/ainvil-paths.mjs";

const reportPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_runtime_report.json");
const report = await createWorkflowRuntimeReport();

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Workflow runtime report generated: ${path.relative(pluginRoot, reportPath)}`);
