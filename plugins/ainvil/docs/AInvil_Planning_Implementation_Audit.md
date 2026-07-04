# AInvil Planning vs Implementation Audit

## 1. Purpose

This audit compares the current implementation with `AInvil_Planning_Document.md` and records what was synchronized during the guarded runtime implementation pass.

The audit does not treat planned future platform surfaces as implemented unless there is working code, artifacts, and validation evidence in the repository.

## 2. Current Alignment Summary

| Planning area | Current implementation status | Evidence |
| --- | --- | --- |
| Product foundation and governance | Implemented | Manifesto, architecture principles, RFC process, governance, maturity model, Studio Playbook, benchmark docs, KPI docs |
| Codex plugin surface | Implemented | `.codex-plugin/plugin.json`, skills, MCP config |
| Specialist agents | Implemented as Codex skills | `skills/orchestrator`, `skills/gdd-agent`, `skills/unity-agent`, `skills/input-agent` |
| Unity Bridge and package | Implemented, live Unity validation still environment-dependent | `mcp-server/server.mjs`, `unity-package/Packages/com.codex.unity-bridge` |
| Production State Graph | Implemented as schema and persisted graph | `schemas/production_state_graph.schema.json`, `state/production_state_graph.json` |
| Production Intelligence | Implemented as read-only report generation and validation | `core/workflow-report.mjs`, `reports/production_intelligence_report.json` |
| Review & Governance | Implemented as schema, template, example, and validators | `schemas/review_record.schema.json`, `reviews/example_review_record.json` |
| Capability Benchmark | Implemented as seed datasets, reports, templates, and validators | `benchmarks/datasets`, `benchmarks/reports/latest-benchmark-report.json` |
| CLI prototype | Implemented | `cli/ainvil-cli.mjs` |
| Workflow Runtime Report | Implemented | `core/workflow-report.mjs`, `reports/workflow_runtime_report.json` |
| Workflow Transition Planner | Implemented | `core/workflow-transitions.mjs`, `reports/workflow_transition_plan.json` |
| Workflow Transition Approval | Implemented | `core/workflow-approvals.mjs`, `reports/workflow_transition_approval.json` |
| Guarded Workflow Runtime | Implemented in this pass | `core/workflow-runtime.mjs`, `scripts/run-workflow-runtime.mjs`, CLI `execute` |
| Runtime run records | Implemented in this pass | `reports/workflow_run_latest.json`, `reports/workflow_runs/` |
| Transition execution records | Implemented in this pass | `schemas/workflow_execution_record.schema.json`, `core/workflow-executor.mjs`, `workflow/runs/` |
| Graph next-action synchronization | Implemented in this pass | `NA-WorkflowRuntime-NextAction` in `state/production_state_graph.json` |
| Generated Traceability Matrix | Implemented in this pass | `reports/traceability_matrix.generated.md` |
| Generated Project Dashboard | Implemented in this pass | `reports/project_dashboard.generated.md` |

## 3. Guarded Runtime Scope

The guarded runtime executes only evidence-safe operations:

- Persist workflow runtime report.
- Persist transition plan.
- Persist transition approval classification.
- Update the graph's `nextRecommendedAction`.
- Upsert a graph `NextAction` node and `next_step_for` edge.
- Generate a traceability matrix from graph links.
- Generate a project dashboard from workflow health.
- Persist latest and historical workflow run records.

The runtime intentionally does not:

- Promote validation levels without actual validation evidence.
- Mark a feature as complete or validated without evidence.
- Approve user decisions.
- Resolve open creative questions.
- Modify Unity scenes, assets, scripts, or prefabs.
- Replace source-of-truth design intent.

## 4. Remaining Gaps Against Full Planning Document

| Planned capability | Status | Reason it remains open |
| --- | --- | --- |
| Live Unity compile validation | Needs live Unity evidence | Requires a running Unity Editor/project state and actual compile result |
| Play Mode validation loop | Needs live Unity evidence | Requires Unity Bridge runtime session and validation execution |
| Runtime input validation evidence | Needs live Unity evidence | `AInvilInputTestBridge` exists, but the current graph still records placeholder evidence |
| Automatic Unity change-to-document synchronization | Partial | Guarded runtime syncs graph/dashboard/traceability views, but Unity changes are not yet automatically harvested into graph nodes |
| Director persisted decision history from real workflows | Partial | Review templates and graph nodes exist; real persisted direction packets need project runs |
| KPI dashboard values and trends | Planned/blocked on evidence | Runtime refuses to invent KPI values |
| Real dogfooding graph | Planned | Current graph is still an example graph |
| Sample-game graph with non-placeholder validation evidence | Planned | Requires actual sample-game implementation and validation |
| Package extraction to platform packages | Planned | Migration plan says extraction should wait until runtime/evidence responsibilities stabilize |
| Desktop/web/IDE/team/CI surfaces | Future direction | Phase 3/4 platform work, not a plugin-local completion item |
| Persistent memory service and sync service | Future direction | Requires platform architecture beyond current plugin scope |

## 5. Validation Performed

- `node plugins\ainvil\cli\ainvil-cli.mjs execute`
- `node plugins\ainvil\scripts\validate-production-state-graph.mjs`
- `node plugins\ainvil\scripts\validate-workflow-runtime-report.mjs`
- `node plugins\ainvil\scripts\validate-workflow-transition-plan.mjs`
- `node plugins\ainvil\scripts\validate-workflow-transition-approval.mjs`
- `node plugins\ainvil\scripts\validate-ainvil-cli.mjs`
- `node plugins\ainvil\scripts\validate-ainvil-plugin.mjs`

## 6. Next Required Production-Core Step

The next highest-confidence step is to replace placeholder validation evidence with real Unity evidence:

1. Open a Unity project with the AInvil Unity package installed.
2. Verify bridge health and compile status.
3. Enter Play Mode.
4. Invoke `AInvilInputTestBridge` for `AC-CoreLoop-001`.
5. Persist actual validation evidence.
6. Regenerate workflow runtime artifacts.

Until that evidence exists, AInvil should continue reporting validation gaps rather than claiming full Production Core completion.
