import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkflowTransitionApproval } from "../core/workflow-approvals.mjs";
import { pluginRoot } from "../core/ainvil-paths.mjs";

const approvalPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_transition_approval.json");
const approval = await createWorkflowTransitionApproval();

await mkdir(path.dirname(approvalPath), { recursive: true });
await writeFile(approvalPath, `${JSON.stringify(approval, null, 2)}\n`, "utf8");

console.log(`Workflow transition approval generated: ${path.relative(pluginRoot, approvalPath)}`);
