# AInvil Workflow Runtime Platform Plan

## 1. Purpose

The Workflow Runtime Engine should be designed as platform core, not Codex-plugin-only logic.

It should coordinate AInvil production workflows using shared project state and evidence so that multiple clients can display or act on the same workflow decisions.

## 2. Placement

Future package:

```text
packages/workflow/
```

Package name:

```text
ainvil-workflow
```

Current planning location:

```text
plugins/ainvil/docs/AInvil_Workflow_Runtime_Platform_Plan.md
```

The runtime should eventually be usable by:

- AInvil CLI.
- Codex plugin.
- Desktop app.
- Web dashboard.
- IDE integrations.
- Future platform clients.

## 3. Non-Goals

The Workflow Runtime should not:

- Depend on Codex skills.
- Modify Unity directly.
- Replace the Director Layer.
- Replace user creative ownership.
- Become a generic autonomous coding agent.
- Hide uncertainty or unsupported confidence.

## 4. Inputs

The runtime should operate on platform data:

- Production State Graph.
- Review Records.
- Production Intelligence Report.
- Benchmark Reports.
- KPI Dashboard.
- RFC metadata.
- Validation Evidence.
- Open decisions and blockers.

## 5. Outputs

The runtime should emit client-neutral outputs:

- Workflow state.
- Next recommended actions.
- Required user confirmations.
- Required reviews.
- Required validations.
- Evidence gaps.
- Traceability gaps.
- Benchmark gates.
- KPI warnings.
- Blockers.
- Resume summary.

Any client should be able to render these outputs in its own interface.

## 6. Runtime Responsibilities

The runtime should:

- Read current operational state.
- Identify incomplete workflow transitions.
- Evaluate governance gates.
- Evaluate validation gates.
- Evaluate benchmark gates.
- Evaluate KPI warnings.
- Produce traceable next actions.
- Preserve uncertainty.
- Explain which evidence was used.

It should not invent project facts. Missing evidence should be represented as missing evidence.

## 7. Relationship To Existing Layers

| layer | relationship |
| --- | --- |
| Director Layer | Uses runtime outputs as operational context, but remains responsible for vision and design direction. |
| Orchestrator | Uses runtime outputs to route work across agents or clients. |
| GDD Agent | Receives design/document tasks from workflow outputs. |
| Unity Agent | Receives implementation or validation tasks from workflow outputs. |
| Input Agent | Receives input/playability validation tasks from workflow outputs. |
| CLI | Displays workflow state and runs platform validation commands. |
| Codex plugin | Presents workflow outputs through Codex interaction. |
| Dashboard/Desktop | Visualizes workflow state, blockers, KPIs, and evidence gaps. |

## 8. First Safe Implementation

The first implementation should be read-only.

Recommended first runtime function:

```text
evaluateProjectWorkflowState(input) -> WorkflowRuntimeReport
```

It should read existing files in place and report:

- Current milestone.
- Active feature.
- Missing reviews.
- Missing validation evidence.
- Benchmark gate status.
- KPI unknowns.
- Next recommended action.

It should not mutate graph, documents, Unity, reviews, or reports.

Current first step:

- `core/workflow-report.mjs` creates a read-only Workflow Runtime Report.
- `core/workflow-transitions.mjs` creates a read-only Workflow Transition Plan from the report.
- `core/workflow-approvals.mjs` classifies transition approval requirements.
- `scripts/generate-workflow-runtime-report.mjs` writes the report artifact when explicitly requested.
- `scripts/validate-workflow-runtime-report.mjs` validates references.
- `scripts/generate-workflow-transition-plan.mjs` writes the transition plan artifact when explicitly requested.
- `scripts/validate-workflow-transition-plan.mjs` validates transition candidate references.
- `scripts/generate-workflow-transition-approval.mjs` writes the approval artifact when explicitly requested.
- `scripts/validate-workflow-transition-approval.mjs` validates approval classifications.
- `cli/ainvil-cli.mjs workflow` displays an in-memory workflow summary.
- `cli/ainvil-cli.mjs transitions` displays an in-memory transition plan summary.
- `cli/ainvil-cli.mjs approvals` displays an in-memory approval summary.

This is still not the Workflow Runtime Engine.

## 9. Compatibility Requirements

Initial implementation must preserve:

```powershell
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
node plugins\ainvil\scripts\validate-ainvil-harness.mjs
```

If a workflow validator is later added, it should be deterministic and safe to run without Unity.

## 10. Exit Criteria For Platform-Core Runtime

The runtime can be considered platform-core ready when:

- It runs without Codex.
- It runs without Unity.
- It consumes platform contracts rather than prompt text.
- It produces client-neutral structured output.
- It is covered by deterministic validation.
- Codex plugin and CLI can both consume the same runtime report.
- Runtime recommendations are traceable to graph, reviews, intelligence, benchmark, KPI, or validation evidence.
