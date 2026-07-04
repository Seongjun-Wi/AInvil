import { runGuardedWorkflowRuntime } from "../core/workflow-runtime.mjs";

const result = await runGuardedWorkflowRuntime();

console.log(`Guarded workflow runtime completed: ${result.runRecord.runId}`);
console.log(`Applied operations: ${result.runRecord.appliedOperations.length}`);
console.log(`Skipped transitions: ${result.runRecord.skippedTransitions.length}`);
console.log(`Next action: ${result.runRecord.nextAction.title}`);
