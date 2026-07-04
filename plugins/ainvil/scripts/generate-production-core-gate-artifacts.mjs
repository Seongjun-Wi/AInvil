import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pluginRoot, resolveAInvilPath } from "../core/ainvil-paths.mjs";

const generatedAt = new Date().toISOString();
await writeJson("reviews/production_core_readiness_review.json", {
  schemaVersion: "1.0.0",
  reviewId: "REVIEW-ProductionCore-Readiness-001",
  artifactId: "AInvil-Production-Core",
  artifactNodeId: "MILESTONE-E2E-Recovery",
  reviewType: "Production Review",
  reviewerRole: "Orchestrator",
  date: generatedAt.slice(0, 10),
  lifecycleState: "Changes Requested",
  findings: [
    "PC1 baseline, PC2 execution records, PC4 sync/resume views, and productization status reporting are present.",
    "Live Unity Bridge, compile check, operational harness scenario, and Play Mode validation evidence are still missing."
  ],
  strengths: ["Production Core gaps are now represented in the operational productization graph and resumable reports."],
  weaknesses: ["Stage 4 approval cannot be claimed until live Unity proof and non-sample validation evidence exist."],
  risks: [
    {
      riskId: "RISK-PCORE-LiveUnity-001",
      summary: "Production Core could be overstated without a passed operational live Unity scenario.",
      severity: "High",
      evidenceNodeIds: ["EVID-E2E-Static-Report"]
    }
  ],
  recommendations: [
    {
      recommendationId: "REC-PCORE-LiveUnity-001",
      summary: "Run Unity Bridge apply-mode validation with an operational scenario and replace blocked/sample evidence with passed or classified failure evidence.",
      owner: "Input Agent",
      referencesNodeIds: ["AC-E2E-002", "EVID-E2E-Static-Report"]
    }
  ],
  decision: "Changes Requested",
  confidence: "High",
  evidence: [
    { kind: "Sync Report", summary: "Sync report generated.", path: "reports/sync_report.json" },
    { kind: "Traceability View", summary: "Traceability view generated.", path: "reports/traceability_view.json" },
    { kind: "Project Dashboard", summary: "Dashboard generated.", path: "reports/project_dashboard.json" },
    { kind: "Validation Evidence", summary: "Live harness evidence exists but may be blocked.", path: "validation/evidence/EVID-top-down-collectible-latest.json" }
  ]
});

await writeJson("benchmarks/reports/latest-live-scored-benchmark-report.json", {
  schemaVersion: "1.0.0",
  reportId: `BR-AInvil-LiveScored-${generatedAt.slice(0, 10)}`,
  generatedAt,
  runMode: "LiveScoredPartial",
  evaluator: "AInvil Production Core gate generator",
  scores: [
    { dimension: "Evidence Usage", score: 3, evidence: "PC1-PC4 artifacts are generated and validator-backed.", notes: "Live Unity passed evidence remains missing." },
    { dimension: "Validation", score: "NotRun", evidence: "Unity Bridge live passed output has not been captured.", notes: "Run PC3 with reachable Unity Bridge." }
  ],
  remainingUnevaluatedCategories: ["Unity Production", "Validation"],
  criticalFailures: [
    { failure: "Live Unity proof missing or blocked.", severity: "High", evidence: "validation/evidence/EVID-top-down-collectible-latest.json" }
  ]
});

await writeText("reports/production_core_architecture_retrospective.md", `# Production Core Architecture Retrospective

- Generated at: ${generatedAt}

## What Worked

- Workflow execution records make safe automation inspectable.
- Sync, traceability, and dashboard views make resume state visible.

## What Failed

- Live Unity proof is still environment-dependent and currently cannot be assumed passed.

## What Was Slower Than Expected

- Moving from document readiness to evidence-backed validation requires bridge availability and sample scene setup.

## Assumptions Validated

- A graph-backed workflow can produce deterministic operational views.

## Assumptions Weakened

- Static validation alone is not enough for Production Core.

## Costs And Usefulness

- Traceability maintenance cost: Medium.
- Validation maintenance cost: Medium until Unity setup is repeatable.
- Resume usefulness: Improved through dashboard and sync report.
- Benchmark usefulness: Partial until live scoring exists.

## Recommended Stage 5 Work

- Add graph patch plans, CI validation, and persistent multi-project history after live proof is stable.
`);

console.log("Production Core gate artifacts generated.");

async function writeJson(relativePath, value) {
  await writeText(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeText(relativePath, text) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}
