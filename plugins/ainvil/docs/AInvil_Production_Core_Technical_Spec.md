# AInvil Production Core Technical Spec

## 1. Purpose

This technical spec describes how to implement the Production Core product plan without destabilizing the current Codex plugin.

The implementation should keep existing paths working, add deterministic validation, and move AInvil from read-only reporting toward guarded workflow execution and evidence-backed synchronization.

Detailed milestone implementation specs:

- `production-core/PC1_Evidence_Baseline_Technical_Spec.md`.
- `production-core/PC2_Runtime_Execution_Records_Technical_Spec.md`.
- `production-core/PC3_Live_Unity_Proof_Technical_Spec.md`.
- `production-core/PC4_Sync_And_Resume_Technical_Spec.md`.
- `production-core/PC5_Production_Core_Gate_Technical_Spec.md`.
- `AInvil_Playability_Validation_Technical_Plan.md`.

## 2. Architecture Target

```text
Production State Graph
  + Review Records
  + Production Intelligence Report
  + Workflow Transition Approval
  + Benchmark Reports
  + Live Harness Reports
  + Validation Evidence
  + KPI Dashboard
    -> Workflow Runtime Executor
      -> Execution Records
      -> Graph Patch Plan
      -> Sync Report
      -> Traceability View
      -> Project Dashboard
      -> Resume Summary
```

The runtime executor must be platform-core logic. Codex, CLI, desktop, and future clients can invoke or display it, but it must not depend on Codex skills.

## 3. Current Modules To Preserve

| module | current responsibility | Production Core extension |
| --- | --- | --- |
| `core/workflow-report.mjs` | Build read-only workflow report. | Remain the input report for runtime execution. |
| `core/workflow-transitions.mjs` | Build transition candidates. | Feed executable transition IDs to executor. |
| `core/workflow-approvals.mjs` | Classify approval and readiness. | Act as the safety gate before execution. |
| `core/benchmark-report.mjs` | Generate baseline benchmark report. | Transition action target for `RunBenchmark` refresh execution. |
| `core/loaders.mjs` | Read platform artifacts. | Added loader for workflow execution records; validation evidence, dashboard, and sync report loaders remain planned. |
| `core/artifact-checks.mjs` | Required artifact checks. | Add required Production Core artifacts as they become stable. |
| `cli/ainvil-cli.mjs` | Read-only inspection. | Add inspection commands first; execution commands only after dry-run support. |

## 4. New Artifacts

### 4.1 Workflow Execution Record

Path:

```text
plugins/ainvil/workflow/runs/*.json
```

Schema:

```text
plugins/ainvil/schemas/workflow_execution_record.schema.json
```

Shape:

| field | type | required | description |
| --- | --- | --- | --- |
| `schemaVersion` | string | yes | `1.0.0`. |
| `executionId` | string | yes | Stable run ID, for example `WER-20260702-RunBenchmark-001`. |
| `transitionId` | string | yes | Transition from Workflow Transition Plan. |
| `transitionType` | string | yes | Transition type such as `RunBenchmark`. |
| `approvalClass` | string | yes | Approval class from approval report. |
| `startedAt` | string | yes | ISO timestamp. |
| `finishedAt` | string | no | ISO timestamp. |
| `status` | string | yes | `Planned`, `Running`, `Succeeded`, `Failed`, `Blocked`, or `DryRun`. |
| `inputs` | object | yes | Source report IDs, target artifact IDs, and options. |
| `outputs` | object | yes | Created reports, graph patches, validation evidence, or no-op result. |
| `evidenceRefs` | array | yes | Files, graph node IDs, review IDs, or report IDs. |
| `errors` | array | yes | Failure messages. |
| `nextAction` | object | no | Follow-up action when blocked or failed. |

Validation rules:

- `executionId` must be unique per file.
- `transitionId` must exist in the latest transition plan or be marked `ExternalManual`.
- `EvidenceRequired`, `UserApprovalRequired`, `ReviewRequired`, and `Blocked` transitions must not have `status: Succeeded` unless the required evidence is referenced.
- Any file in `outputs.createdFiles` must exist.

### 4.2 Graph Patch Plan

Path:

```text
plugins/ainvil/reports/graph_patch_plan.json
```

Purpose:

Represent graph mutations before applying them.

Operations:

| operation | description |
| --- | --- |
| `addNode` | Add a new node with ID, type, owner, status, and refs. |
| `updateNode` | Update allowed fields on an existing node. |
| `addEdge` | Add an edge between existing or newly planned nodes. |
| `updateNextAction` | Replace graph-level next recommended action. |

Safety:

- Patch plan validates against graph schema before commit.
- Patch plan is stored as evidence even when not applied.
- Design-facing nodes must respect source-of-truth order.
- Validation levels can only be promoted when evidence references exist.

### 4.3 Validation Evidence Export

Path:

```text
plugins/ainvil/validation/evidence/*.json
```

Purpose:

Capture Play Mode, input, compile, console, and harness results as reusable evidence.

Minimum fields:

| field | description |
| --- | --- |
| `evidenceId` | Stable ID. |
| `source` | `LiveHarness`, `UnityBridge`, `Manual`, `StaticValidator`, or `Benchmark`. |
| `validationLevel` | AInvil validation level. |
| `status` | `Passed`, `Failed`, `Blocked`, `Warning`, or `NotRun`. |
| `acceptanceIds` | Linked acceptance criteria. |
| `requirementIds` | Linked requirements. |
| `unityTargets` | Scene, prefab, object, script, or data targets. |
| `checks` | Structured check results. |
| `timestamp` | ISO timestamp. |
| `remainingGaps` | Known gaps. |

### 4.4 Sync Report

Path:

```text
plugins/ainvil/reports/sync_report.json
```

Purpose:

Report what synchronized, what drifted, and what requires human or agent action.

Sections:

- `graphUpdates`.
- `traceabilityRows`.
- `dashboardUpdates`.
- `driftFindings`.
- `blockedSyncItems`.
- `recommendedNextActions`.

## 5. Runtime Executor Design

### 5.1 Module

File:

```text
plugins/ainvil/core/workflow-executor.mjs
```

Public API:

```js
export async function executeApprovedTransition(options)
export async function dryRunApprovedTransition(options)
```

Inputs:

| input | description |
| --- | --- |
| `transitionId` | Transition to execute. |
| `mode` | `dryRun` or `apply`. |
| `approval` | Workflow Transition Approval data. |
| `plan` | Workflow Transition Plan data. |
| `report` | Workflow Runtime Report data. |
| `allowMutations` | Explicit boolean. Must be false by default. |

Outputs:

```js
{
  executionRecord,
  createdFiles,
  graphPatchPlan,
  blockedReason,
  nextAction
}
```

### 5.2 Execution Policy

Default mode: `dryRun`.

Implementation status:

- `core/workflow-executor.mjs` implements dry-run/apply handling for approved transitions.
- `TRANS-RunBenchmark-Refresh` can apply because it is `AutoEligible`, `Ready`, and low-risk.
- Evidence-required transitions are recorded as `Blocked` and do not mutate source artifacts.
- Execution records are written to `workflow/runs/latest.json` and `workflow/runs/<executionId>.json`.

Allowed first transition:

| transition type | dry run | apply | reason |
| --- | --- | --- | --- |
| `RunBenchmark` | yes | yes | Low-risk, creates report artifacts, does not modify design state. |
| `UpdateKpiDashboard` | yes | no | Needs real KPI values. |
| `ResolveValidationGap` | yes | no | Requires validation evidence. |
| `RunUnityHarness` | yes | later | Requires reachable Unity Bridge and clear side-effect policy. |
| `ApplyGraphPatch` | yes | later | Requires patch validation and backups. |

Blocked transitions must create execution records with `status: Blocked`, not silently disappear.

### 5.3 RunBenchmark Implementation

Implementation steps:

1. Load workflow approval data.
2. Find `TRANS-RunBenchmark-001`.
3. Confirm approval class is `AutoEligible`.
4. Generate benchmark report through `createBenchmarkReport`.
5. Write Markdown and JSON reports.
6. Validate report.
7. Write workflow execution record.
8. Return next recommended action.

No graph mutation is required for the first implementation.

## 6. Synchronization Design

### 6.1 Module

File:

```text
plugins/ainvil/core/sync-report.mjs
```

Public API:

```js
export async function createSyncReport(options)
```

Inputs:

- Production State Graph.
- Production Intelligence Report.
- Workflow Execution Records.
- Validation Evidence.
- Benchmark Reports.
- Review Records.
- Live Harness Reports.

Outputs:

- Traceability rows.
- Dashboard summary.
- Drift findings.
- Recommended graph patch plan.

### 6.2 Traceability Generation

Generate rows from graph paths:

```text
Vision -> Feature -> Requirement -> FeatureSpec -> ImplementationTask
  -> UnityTarget -> InputSpec -> AcceptanceCriterion -> ValidationEvidence
```

Row statuses:

| status | meaning |
| --- | --- |
| `Complete` | Full path exists and validation level meets requirement. |
| `Needs Requirement Definition` | Feature has no requirement. |
| `Needs Technical Mapping` | Requirement/task has no Unity target. |
| `Needs Acceptance Criteria` | Requirement has no acceptance criterion. |
| `Needs Validation` | Acceptance criterion has no evidence or insufficient validation level. |
| `Orphan Implementation` | Unity target has no requirement path. |

### 6.3 Dashboard Generation

Dashboard fields:

- Project name.
- Current vision.
- Current milestone.
- Active feature.
- Health summary.
- Implemented features.
- Validated features.
- Blocked tasks.
- Validation coverage by level.
- Latest benchmark report.
- Latest live harness result.
- Latest execution record.
- Next recommended action.

## 7. Live Unity Harness Integration

### 7.1 First Scenario

Target scenario:

```text
harness/scenarios/top_down_collectible.json
```

Reason:

It proves movement, input, collectible feedback, score state, Play Mode behavior, and validation evidence in one small loop.

### 7.2 Required Harness Extensions

- Export validation evidence JSON from probe/apply results.
- Link scenario checks to acceptance IDs.
- Preserve `BridgeDisconnected` as a valid blocked evidence state.
- Add a `--evidence-out` option.
- Add a `--scenario` option for running one scenario.

### 7.3 Unity Preconditions

- Unity project opened.
- Unity package installed.
- Unity Bridge running at `http://127.0.0.1:17777/rpc`.
- Sample scene available or generated.
- Game View focus path available for input checks, or `AInvilInputTestBridge` present.

## 8. CLI Additions

Add commands in this order:

| command | mode | purpose |
| --- | --- | --- |
| `executions` | read-only | List workflow execution records. |
| `sync` | read-only | Show current sync report summary. |
| `traceability` | read-only | Show generated traceability rows and gaps. |
| `dashboard` | read-only | Show project dashboard summary. |
| `execute --transition <id> --dry-run` | dry-run | Preview execution without mutations. |
| `execute --transition <id> --apply` | apply | Execute only approved low-risk transitions. |

Execution commands should be added only after execution record validation exists.

## 9. Scripts And Validators

New scripts:

```text
scripts/generate-workflow-execution-record.mjs
scripts/validate-workflow-execution-records.mjs
scripts/generate-sync-report.mjs
scripts/validate-sync-report.mjs
scripts/generate-traceability-view.mjs
scripts/validate-traceability-view.mjs
scripts/generate-project-dashboard.mjs
scripts/validate-project-dashboard.mjs
```

Plugin validation should include new validators only after the corresponding artifacts are generated by deterministic scripts.

## 10. Implementation Sequence

### Step 1: Execution Record Foundation

Detailed spec: `production-core/PC2_Runtime_Execution_Records_Technical_Spec.md`.

Files:

- Add `schemas/workflow_execution_record.schema.json`.
- Add `core/workflow-executor.mjs`.
- Add `scripts/validate-workflow-execution-records.mjs`.
- Add `workflow/runs/.gitkeep` or first generated record.

Status: Implemented.

Acceptance:

- Validator passes with an empty or example run directory.
- CLI can list execution records.

### Step 2: RunBenchmark Transition Execution

Files:

- Extend `workflow-executor.mjs`.
- Add `scripts/execute-workflow-transition.mjs`.
- Update CLI with dry-run execution inspection.

Status: Implemented for benchmark refresh.

Acceptance:

- `RunBenchmark` transition creates benchmark reports and execution record.
- Evidence-required transitions are blocked with records.

### Step 3: Sync Report Foundation

Detailed spec: `production-core/PC4_Sync_And_Resume_Technical_Spec.md`.

Files:

- Add `schemas/sync_report.schema.json`.
- Add `core/sync-report.mjs`.
- Add `scripts/generate-sync-report.mjs`.
- Add `scripts/validate-sync-report.mjs`.

Acceptance:

- Sync report identifies current validation gaps.
- Sync report references benchmark report and workflow execution record.

### Step 4: Traceability And Dashboard Views

Files:

- Add generated reports or views under `reports/`.
- Reuse templates where possible.
- Add CLI `traceability` and `dashboard`.

Acceptance:

- CLI shows missing links and next action from generated views.
- Views are derived from graph and evidence, not separate source-of-truth.

### Step 5: Live Harness Evidence Export

Detailed spec: `production-core/PC3_Live_Unity_Proof_Technical_Spec.md`.

Files:

- Extend `scripts/run-ainvil-live-harness.mjs`.
- Add evidence export path under `validation/evidence/`.
- Add validator for evidence files.
- Add sample preparation and runtime-safe input bridge support for repeatable PC3 Play Mode proof.

Acceptance:

- Bridge unavailable remains `Blocked` with evidence.
- Bridge reachable can produce `Passed` or classified failure evidence.
- `--prepare-sample` can create the top-down collectible sample scene/artifacts before evidence export.

### Step 6: Graph Patch Plan

Files:

- Add `schemas/graph_patch_plan.schema.json`.
- Add `core/graph-patches.mjs`.
- Add generate/validate scripts.

Acceptance:

- Patch plans validate before graph mutation.
- Validation level promotion requires evidence.

### Step 7: Production Core Gate Review

Detailed spec: `production-core/PC5_Production_Core_Gate_Technical_Spec.md`.

Files:

- Add `reviews/production_core_readiness_review.json`.
- Add benchmark scored report once live evaluation exists.
- Add KPI dashboard values.

Acceptance:

- Stage 4 readiness is evidence-backed and reviewable.

## 11. Testing Strategy

Static tests:

- Existing plugin validation.
- CLI smoke validation.
- Harness fixture validation.
- New schema validators.
- Node syntax checks for new modules.

Runtime tests:

- Benchmark transition dry-run.
- Benchmark transition apply.
- Blocked validation transition.
- Sync report generation from current example graph.
- Live harness with unavailable Unity Bridge.
- Live harness with reachable Unity Bridge.

Regression tests:

- Existing reports remain valid.
- Existing CLI commands keep working.
- Plugin validation remains green.
- No source-of-truth document is overwritten by generated operational views.

## 12. Definition Of Done

Production Core implementation is done when:

- One vertical slice has complete traceability from design to validation evidence.
- One live Unity scenario passes or produces classified actionable failure evidence.
- Workflow execution records exist for automated transitions.
- Sync report, traceability view, dashboard, and resume summary are generated from platform artifacts.
- Benchmark report includes at least one live scored evaluation.
- KPI dashboard has current values.
- Production Core readiness review is recorded.

Current implementation status:

- PC3 validation evidence export is implemented through `run-ainvil-live-harness.mjs --evidence-out`.
- PC4 sync/resume views are implemented through `core/traceability-view.mjs`, `core/project-dashboard.mjs`, and `core/sync-report.mjs`.
- PC5 gate artifacts and validator are implemented.
- Current gate decision is `Changes Requested`, not `Approved`, because the latest live Unity scenario produced classified artifact failures rather than passed validation.

## 13. Open Questions

| question | owner | impact | status |
| --- | --- | --- | --- |
| Which Unity sample project should be the official Production Core proof? | User / Orchestrator | Determines live validation target. | Needs decision |
| Should graph mutation be allowed in the first runtime executor, or delayed until graph patch plans mature? | Orchestrator | Affects risk and implementation speed. | Proposed: delay mutation |
| Should CLI `execute --apply` be enabled before desktop UI exists? | User / Orchestrator | Affects user trust and safety. | Proposed: dry-run first |
| Which KPI values are mandatory for Stage 4 gate? | Director Layer / Orchestrator | Affects readiness review. | Needs decision |
