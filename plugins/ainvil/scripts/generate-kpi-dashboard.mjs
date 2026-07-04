import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const outputPath = resolveAInvilPath(process.argv[2] || "reports/kpi_dashboard.json");
const traceability = await readJson("reports/traceability_view.json");
const dashboard = await readJson("reports/project_dashboard.json");
const sync = await readJson("reports/sync_report.json");
const latestExecution = await readJson("workflow/runs/latest.json");
const harness = await readJson("harness/reports/latest-live-harness-report.json");
const benchmark = await readJson("benchmarks/reports/latest-benchmark-report.json");
const rows = traceability.rows || [];
const completeRows = rows.filter((row) => row.status === "Complete").length;
const kpi = {
  schemaVersion: "1.0.0",
  dashboardId: `KPI-AInvil-${new Date().toISOString().slice(0, 10)}`,
  generatedAt: new Date().toISOString(),
  values: {
    validationCoverage: { value: dashboard.validationCoverage || {}, evidencePath: "reports/project_dashboard.json" },
    traceabilityCompleteness: { value: `${completeRows}/${rows.length}`, evidencePath: "reports/traceability_view.json" },
    liveHarnessPassCount: { value: harness.summary || {}, evidencePath: "harness/reports/latest-live-harness-report.json" },
    workflowExecutionSuccessCount: { value: latestExecution.status === "Succeeded" ? 1 : 0, evidencePath: "workflow/runs/latest.json" },
    resumeReadiness: { value: dashboard.nextRecommendedAction ? "ResumeReadyWithGaps" : "Unknown", evidencePath: "reports/project_dashboard.json" },
    documentationDriftCount: { value: sync.driftFindings?.length || 0, evidencePath: "reports/sync_report.json" },
    benchmarkEvaluatedCategories: { value: benchmark.categoryResults?.filter((item) => item.status !== "MissingDataset").length || 0, evidencePath: "benchmarks/reports/latest-benchmark-report.json" }
  }
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(kpi, null, 2)}\n`, "utf8");
console.log(`KPI dashboard generated: ${relativeAInvilPath(outputPath)}`);

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolveAInvilPath(relativePath), "utf8"));
}
