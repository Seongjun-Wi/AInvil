import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenchmarkReport, formatBenchmarkReportMarkdown } from "../core/benchmark-report.mjs";
import { pluginRoot, resolveAInvilPath, relativeAInvilPath } from "../core/ainvil-paths.mjs";

const outputPath = resolveAInvilPath(process.argv[2] || "benchmarks/reports/latest-benchmark-report.md");
const jsonOutputPath = outputPath.replace(/\.(md|markdown)$/i, ".json");

const report = await createBenchmarkReport();
const markdown = formatBenchmarkReportMarkdown(report);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, markdown, "utf8");
await writeFile(jsonOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Benchmark report generated: ${relativeAInvilPath(outputPath)}`);
console.log(`Benchmark report JSON generated: ${path.relative(pluginRoot, jsonOutputPath)}`);
