# PC-2 Runtime Execution Records Technical Spec

## 1. Purpose

PC-2 introduces a guarded workflow execution layer and durable execution records.

The goal is not broad automation. The goal is to make every attempted workflow transition inspectable before AInvil mutates important project state.

## 2. Scope

In scope:

- Workflow execution record schema.
- Execution record validator.
- Runtime executor module.
- `RunBenchmark` transition execution.
- Blocked records for evidence-required transitions.
- CLI read-only execution history.
- Script entrypoint for dry-run and low-risk apply execution.

Out of scope:

- Graph mutation.
- Unity Bridge mutation.
- Validation level promotion.
- KPI value invention.
- User-approval UI.

## 3. New Files

| file | purpose |
| --- | --- |
| `schemas/workflow_execution_record.schema.json` | JSON schema for execution records. |
| `core/workflow-executor.mjs` | Executes or blocks approved transitions. |
| `scripts/execute-workflow-transition.mjs` | Script entrypoint for dry-run/apply execution. |
| `scripts/validate-workflow-execution-records.mjs` | Validates all workflow execution records. |
| `workflow/runs/*.json` | Durable execution records. |

## 4. Execution Record Contract

Path pattern:

```text
workflow/runs/WER-*.json
```

Required fields:

| field | type | notes |
| --- | --- | --- |
| `schemaVersion` | string | Must be `1.0.0`. |
| `executionId` | string | Must match file stem. |
| `transitionId` | string | Transition ID or `ExternalManual`. |
| `transitionType` | string | Example: `RunBenchmark`, `ResolveValidationGap`. |
| `approvalClass` | string | Copied from approval record. |
| `executionReadiness` | string | Copied from approval record. |
| `mode` | string | `dryRun` or `apply`. |
| `startedAt` | string | ISO timestamp. |
| `finishedAt` | string | ISO timestamp. |
| `status` | string | `DryRun`, `Succeeded`, `Failed`, or `Blocked`. |
| `inputs` | object | Source report/plan/approval IDs and options. |
| `outputs` | object | Created files, generated reports, patch plans, or no-op output. |
| `evidenceRefs` | array | Report paths, graph nodes, review IDs, benchmark IDs. |
| `errors` | array | Empty on success. |
| `nextAction` | object | Required for `Blocked` or `Failed`. |

Allowed statuses:

```text
DryRun
Succeeded
Failed
Blocked
```

## 5. Executor API

File:

```text
core/workflow-executor.mjs
```

Exports:

```js
export async function dryRunApprovedTransition(options)
export async function executeApprovedTransition(options)
export async function createBlockedExecutionRecord(options)
```

Options:

| option | required | description |
| --- | --- | --- |
| `transitionId` | yes | Transition ID to evaluate. |
| `mode` | yes | `dryRun` or `apply`. |
| `allowMutations` | no | Defaults to false. Must be true for apply. |
| `outputDir` | no | Defaults to `workflow/runs`. |
| `generatedAt` | no | Test override. |

Return:

```js
{
  executionRecord,
  recordPath,
  createdFiles,
  blockedReason
}
```

## 6. Execution Policy

| transition type | dry run | apply | behavior |
| --- | --- | --- | --- |
| `RunBenchmark` | yes | yes | Generate benchmark report and record execution. |
| `ResolveValidationGap` | yes | no | Write blocked record requiring validation evidence. |
| `UpdateKpiDashboard` | yes | no | Write blocked record requiring KPI evidence. |
| `RequestReview` | yes | no | Write blocked record requiring review workflow. |
| Unknown | yes | no | Write blocked record. |

Apply mode rules:

- `allowMutations` must be true.
- Approval record must be `AutoEligible`.
- Execution readiness must be `Ready`.
- Safety level must be `LowRisk`.
- Transition type must be explicitly supported.

## 7. RunBenchmark Execution

Algorithm:

1. Load or generate workflow runtime report.
2. Load or generate workflow transition plan.
3. Load or generate workflow transition approval.
4. Find approval record by `transitionId`.
5. Check policy.
6. In dry-run mode, write a `DryRun` execution record and do not generate reports.
7. In apply mode, call `createBenchmarkReport`.
8. Write `benchmarks/reports/latest-benchmark-report.md`.
9. Write `benchmarks/reports/latest-benchmark-report.json`.
10. Validate benchmark report.
11. Write `Succeeded` execution record.

Created files:

```text
benchmarks/reports/latest-benchmark-report.md
benchmarks/reports/latest-benchmark-report.json
workflow/runs/WER-*.json
```

## 8. Validator Rules

Script:

```text
scripts/validate-workflow-execution-records.mjs
```

Rules:

- Directory may be empty only before PC-2 is complete.
- Every `*.json` parses.
- `schemaVersion` is `1.0.0`.
- `executionId` is unique.
- `status` is allowed.
- `outputs.createdFiles` paths exist for `Succeeded`.
- `Blocked` and `Failed` records include `nextAction`.
- `Succeeded` records must not come from `EvidenceRequired`, `ReviewRequired`, `UserApprovalRequired`, `Blocked`, or `Forbidden` approvals.
- `apply` records must not exist for unsupported transition types.

## 9. CLI Additions

Command:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs executions
```

Output:

- Record count.
- Latest execution ID.
- Counts by status.
- Counts by transition type.
- Latest blocked reason.
- Latest created files.

Execution command should come after read-only listing:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs execute --transition TRANS-RunBenchmark-001 --dry-run
node plugins\ainvil\cli\ainvil-cli.mjs execute --transition TRANS-RunBenchmark-001 --apply
```

## 10. Validation Commands

```powershell
node plugins\ainvil\scripts\execute-workflow-transition.mjs --transition TRANS-RunBenchmark-001 --dry-run
node plugins\ainvil\scripts\execute-workflow-transition.mjs --transition TRANS-RunBenchmark-001 --apply
node plugins\ainvil\scripts\validate-workflow-execution-records.mjs
node plugins\ainvil\cli\ainvil-cli.mjs executions
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
```

## 11. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PC2-001 | No execution records exist. | Validator runs. | It exits 0 only if empty directory is allowed during initial setup. |
| AC-PC2-002 | `RunBenchmark` is auto-eligible. | Dry-run execution runs. | A `DryRun` record is written and benchmark report is not modified. |
| AC-PC2-003 | `RunBenchmark` is auto-eligible. | Apply execution runs. | Benchmark report files and `Succeeded` execution record are written. |
| AC-PC2-004 | `ResolveValidationGap` is evidence-required. | Execution is requested. | A `Blocked` record is written and no validation status is promoted. |
| AC-PC2-005 | Execution records exist. | CLI executions runs. | Counts and latest record are displayed. |

## 12. Definition Of Done

PC-2 is done when:

- Execution records exist and validate.
- `RunBenchmark` can be executed through runtime policy.
- Evidence-required transitions create blocked records.
- Plugin validation includes execution record validation.
- CLI can inspect execution history.

