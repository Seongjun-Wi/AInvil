# PC-1 Evidence Baseline Technical Spec

## 1. Purpose

PC-1 makes current AInvil evidence gaps visible, reproducible, and validator-backed.

This milestone does not claim live capability. It creates the baseline artifacts that later milestones use to prove improvement.

## 2. Scope

In scope:

- Baseline benchmark report generation and validation.
- Workflow report awareness of benchmark availability.
- Preservation of live harness blocked evidence.
- Production Core product and technical planning documents.
- CLI visibility for current gaps.

Out of scope:

- Live benchmark scoring.
- Unity Bridge pass requirement.
- Graph mutation.
- Runtime transition execution.
- KPI dashboard values.

## 3. Existing Implementation Baseline

Current files:

| file | role |
| --- | --- |
| `core/benchmark-report.mjs` | Creates Dataset Baseline benchmark reports. |
| `scripts/generate-benchmark-report.mjs` | Writes benchmark report Markdown and JSON artifacts. |
| `scripts/validate-benchmark-report.mjs` | Validates the generated benchmark report. |
| `benchmarks/reports/latest-benchmark-report.md` | Human-readable baseline report. |
| `benchmarks/reports/latest-benchmark-report.json` | Machine-readable baseline report. |
| `harness/reports/latest-live-harness-report.json` | Current live harness result, including blocked bridge evidence. |
| `cli/ainvil-cli.mjs benchmark` | Shows benchmark readiness and latest report. |
| `cli/ainvil-cli.mjs workflow` | Shows benchmark report availability and workflow blockers. |

## 4. Required Artifacts

### 4.1 Benchmark Report

Paths:

```text
benchmarks/reports/latest-benchmark-report.md
benchmarks/reports/latest-benchmark-report.json
```

Rules:

- `runMode` must be `DatasetBaseline`.
- Scores must remain `NotRun` until live agent outputs are evaluated.
- Missing benchmark categories must be listed explicitly.
- Recommendations must include live evaluation as a next step.

### 4.2 Live Harness Blocked Evidence

Path:

```text
harness/reports/latest-live-harness-report.json
```

Rules:

- `BridgeDisconnected` is a valid blocked state.
- Blocked scenarios must include actionable next steps.
- The report is evidence of environment state, not feature validation.

### 4.3 Planning Documents

Paths:

```text
docs/AInvil_Production_Core_Product_Plan.md
docs/AInvil_Production_Core_Technical_Spec.md
docs/production-core/PC1_Evidence_Baseline_Technical_Spec.md
```

Rules:

- Product plan owns milestone and feature intent.
- Technical spec owns implementation contracts.
- PC-level spec owns developer-facing task breakdown.

## 5. Implementation Tasks

| task id | task | files | status |
| --- | --- | --- | --- |
| TASK-PC1-001 | Generate baseline benchmark report. | `core/benchmark-report.mjs`, `scripts/generate-benchmark-report.mjs` | Implemented |
| TASK-PC1-002 | Validate benchmark report structure. | `scripts/validate-benchmark-report.mjs` | Implemented |
| TASK-PC1-003 | Include benchmark report in required artifact checks. | `core/artifact-checks.mjs` | Implemented |
| TASK-PC1-004 | Include benchmark report generation in plugin validation. | `scripts/validate-ainvil-plugin.mjs` | Implemented |
| TASK-PC1-005 | Document Dataset Baseline mode. | `docs/AInvil_Benchmark_Workflow.md` | Implemented |
| TASK-PC1-006 | Add PC-level technical spec and link from parent docs. | `docs/production-core/PC1_Evidence_Baseline_Technical_Spec.md` | Planned |

## 6. Validation Commands

Run from repository root:

```powershell
node plugins\ainvil\scripts\generate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-benchmark-report.mjs
node plugins\ainvil\cli\ainvil-cli.mjs benchmark
node plugins\ainvil\cli\ainvil-cli.mjs workflow
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
node plugins\ainvil\scripts\validate-ainvil-cli.mjs
node plugins\ainvil\scripts\validate-ainvil-harness.mjs
```

Expected result:

- Benchmark report generation exits 0.
- Benchmark report validation exits 0.
- CLI benchmark output shows latest benchmark report.
- CLI workflow output shows benchmark report path.
- Plugin, CLI, and harness validators exit 0.

## 7. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PC1-001 | Benchmark datasets exist. | Benchmark report generation runs. | Markdown and JSON reports are written. |
| AC-PC1-002 | Benchmark report JSON exists. | Validator runs. | Validator exits 0 and reports the relative path. |
| AC-PC1-003 | Latest benchmark report exists. | CLI benchmark runs. | CLI reports the latest benchmark report path. |
| AC-PC1-004 | Workflow report runs. | CLI workflow runs. | Benchmark report availability is shown. |
| AC-PC1-005 | Unity Bridge is unavailable. | Live harness report is inspected. | Blocked bridge evidence remains visible and classified. |

## 8. Definition Of Done

PC-1 is done when:

- Baseline benchmark report exists and validates.
- Static plugin, CLI, and harness validation pass.
- Current benchmark, validation, and Unity Bridge gaps are visible from CLI or generated reports.
- No document claims live capability scores from Dataset Baseline mode.

## 9. Known Gaps Carried To PC-2

- Runtime cannot execute approved transitions.
- Benchmark generation is script-driven, not transition-driven.
- No workflow execution record is written for benchmark generation.
- KPI dashboard values remain missing.

