#!/usr/bin/env node
import { evaluateProductionCoreReview } from "../core/production-core-review.mjs";
import { relativeAInvilPath } from "../core/ainvil-paths.mjs";

const dryRun = process.argv.includes("--dry-run");
const result = await evaluateProductionCoreReview({ writeReview: !dryRun });
const evaluation = result.evaluation;

console.log(`Production Core review evaluated: ${evaluation.previousStatus} -> ${evaluation.newStatus}`);
console.log(`Evaluation report: ${relativeAInvilPath(result.evaluationPath)}`);
console.log(`Criteria report: ${relativeAInvilPath(result.criteriaPath)}`);
if (dryRun) console.log("Mode: dry-run (review record was not changed)");
if (evaluation.remainingChanges.length > 0) {
  console.log("Remaining changes:");
  for (const item of evaluation.remainingChanges) {
    console.log(`- ${item.id}: ${item.summary}`);
    console.log(`  next: ${item.nextAction}`);
  }
} else {
  console.log("Remaining changes: none");
}
