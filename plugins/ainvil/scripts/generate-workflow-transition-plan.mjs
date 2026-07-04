import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createWorkflowTransitionPlan } from "../core/workflow-transitions.mjs";
import { pluginRoot } from "../core/ainvil-paths.mjs";

const planPath = path.resolve(pluginRoot, process.argv[2] || "reports/workflow_transition_plan.json");
const plan = await createWorkflowTransitionPlan();

await mkdir(path.dirname(planPath), { recursive: true });
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

console.log(`Workflow transition plan generated: ${path.relative(pluginRoot, planPath)}`);
