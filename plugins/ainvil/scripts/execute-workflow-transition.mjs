import { executeApprovedTransition } from "../core/workflow-executor.mjs";

const args = new Set(process.argv.slice(2));
const transitionArgIndex = process.argv.indexOf("--transition");
const transitionId = transitionArgIndex >= 0 ? process.argv[transitionArgIndex + 1] : undefined;
const apply = args.has("--apply");
const dryRun = args.has("--dry-run") || !apply;

const result = await executeApprovedTransition({
  transitionId,
  mode: dryRun ? "dryRun" : "apply",
  allowMutations: apply
});

console.log(`Workflow execution ${result.executionRecord.status}: ${result.executionRecord.executionId}`);
console.log(`Transition: ${result.executionRecord.transitionId}`);
console.log(`Created files: ${result.createdFiles.join(", ") || "None"}`);
if (result.blockedReason) console.log(`Blocked reason: ${result.blockedReason}`);
