import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolveAInvilPath } from "../core/ainvil-paths.mjs";

const options = parseArgs(process.argv.slice(2));
const requiredFiles = [
  "docs/AInvil_Production_Core_Product_Plan.md",
  "docs/AInvil_Production_Core_Technical_Spec.md",
  "docs/production-core/PC1_Evidence_Baseline_Technical_Spec.md",
  "docs/production-core/PC3_Live_Unity_Proof_Technical_Spec.md",
  "docs/production-core/PC4_Sync_And_Resume_Technical_Spec.md",
  "docs/production-core/PC5_Production_Core_Gate_Technical_Spec.md",
  "benchmarks/reports/latest-benchmark-report.json",
  "benchmarks/reports/latest-live-scored-benchmark-report.json",
  "workflow/runs/latest.json",
  "validation/evidence/EVID-top-down-collectible-latest.json",
  "reports/sync_report.json",
  "reports/traceability_view.json",
  "reports/project_dashboard.json",
  "reports/kpi_dashboard.json",
  "reviews/production_core_readiness_review.json",
  "reports/production_core_architecture_retrospective.md"
];

const errors = [];
for (const file of requiredFiles) await mustExist(file);

const review = await readJson("reviews/production_core_readiness_review.json");
const liveScored = await readJson("benchmarks/reports/latest-live-scored-benchmark-report.json");
const kpi = await readJson("reports/kpi_dashboard.json");
const evidence = await readJson("validation/evidence/EVID-top-down-collectible-latest.json");

if (review.reviewType !== "Production Review") errors.push("readiness review must be a Production Review.");
if (!["Approved", "Changes Requested", "Deferred", "Rejected"].includes(review.decision)) errors.push(`unsupported readiness decision: ${review.decision}.`);
if (options.requireApproved && review.decision !== "Approved") errors.push(`Production Core gate requires decision Approved, current decision: ${review.decision || "missing"}.`);
if (liveScored.runMode === "DatasetBaseline") errors.push("live scored benchmark runMode must not be DatasetBaseline.");
if (!(liveScored.scores || []).some((score) => Number.isInteger(score.score))) errors.push("live scored benchmark must include at least one numeric score.");
if (!kpi.values || Object.keys(kpi.values).length === 0) errors.push("kpi dashboard must include values.");
if (review.decision === "Approved" && evidence.status !== "Passed") errors.push("Production Core cannot be Approved unless live validation evidence passed.");

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`Production Core gate validation passed with decision: ${review.decision}.`);

async function mustExist(relativePath) {
  try {
    await access(resolveAInvilPath(relativePath), constants.F_OK);
  } catch {
    errors.push(`missing required evidence: ${relativePath}`);
  }
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(resolveAInvilPath(relativePath), "utf8"));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return {};
  }
}

function parseArgs(args) {
  const parsed = { requireApproved: false };
  for (const arg of args) {
    if (arg === "--require-approved") {
      parsed.requireApproved = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Validate Production Core gate artifacts.

Usage:
  node plugins/ainvil/scripts/validate-production-core-gate.mjs [--require-approved]

Options:
  --require-approved   Fail unless the readiness review decision is exactly Approved.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}
