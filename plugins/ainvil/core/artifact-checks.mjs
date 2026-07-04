import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolveAInvilPath } from "./ainvil-paths.mjs";

export const readOnlyCoreArtifactFiles = [
  "state/production_state_graph.json",
  "reports/production_intelligence_report.json",
  "reviews/e2e_validation_review.json",
  "schemas/production_state_graph.schema.json",
  "schemas/production_intelligence_report.schema.json",
  "schemas/review_record.schema.json",
  "schemas/benchmark_case.schema.json",
  "benchmarks/reports/latest-benchmark-report.json",
  "docs/AInvil_Platform_Architecture.md",
  "docs/AInvil_CLI_Prototype.md"
];

export const coreModuleFiles = [
  "core/provider-adapter.mjs",
  "core/tool-calling-adapter.mjs",
  "core/context-pack.mjs",
  "core/ainvil-paths.mjs",
  "core/loaders.mjs",
  "core/summaries.mjs",
  "core/artifact-checks.mjs",
  "core/benchmark-report.mjs",
  "core/workflow-report.mjs",
  "core/workflow-transitions.mjs",
  "core/workflow-approvals.mjs",
  "core/workflow-executor.mjs",
  "core/workflow-runtime.mjs",
  "core/traceability-view.mjs",
  "core/project-dashboard.mjs",
  "core/sync-report.mjs",
  "core/workspace-manager.mjs",
  "core/release-readiness.mjs",
  "core/productization-status.mjs"
];

export async function checkRequiredArtifacts(files = readOnlyCoreArtifactFiles) {
  const results = [];
  for (const file of files) {
    const filePath = resolveAInvilPath(file);
    try {
      await access(filePath, constants.F_OK);
      results.push({ relativePath: file, path: filePath, exists: true, error: null });
    } catch (error) {
      results.push({ relativePath: file, path: filePath, exists: false, error });
    }
  }
  return results;
}

export async function missingRequiredArtifacts(files = readOnlyCoreArtifactFiles) {
  return (await checkRequiredArtifacts(files)).filter((result) => !result.exists);
}
