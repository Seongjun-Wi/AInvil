# PC-5 Production Core Gate Technical Spec

## 1. Purpose

PC-5 decides whether AInvil qualifies for `Stage 4: Production Core`.

This is a gate, not a feature sprint. It gathers evidence from PC-1 through PC-4 and produces a reviewable readiness decision.

## 2. Scope

In scope:

- Production Core readiness review.
- Live scored benchmark report.
- KPI dashboard values.
- Architecture retrospective.
- Stage 4 gap classification.
- Final validation bundle.

Out of scope:

- New core feature development.
- Package extraction.
- Desktop/web app.
- Multi-project support.
- Team workflow support.

## 3. Required Evidence Inputs

| evidence | required path |
| --- | --- |
| Product plan | `docs/AInvil_Production_Core_Product_Plan.md` |
| Technical plan | `docs/AInvil_Production_Core_Technical_Spec.md` |
| PC-level specs | `docs/production-core/*.md` |
| Benchmark report | `benchmarks/reports/latest-benchmark-report.json` |
| Live scored benchmark report | `benchmarks/reports/latest-live-scored-benchmark-report.json` |
| Workflow execution records | `workflow/runs/*.json` |
| Validation evidence | `validation/evidence/*.json` |
| Sync report | `reports/sync_report.json` |
| Traceability view | `reports/traceability_view.json` |
| Project dashboard | `reports/project_dashboard.json` |
| KPI dashboard | `reports/kpi_dashboard.json` or `reports/kpi_dashboard.md` |
| Production Core readiness review | `reviews/production_core_readiness_review.json` |
| Architecture retrospective | `reports/production_core_architecture_retrospective.md` |

## 4. Production Core Readiness Review

Path:

```text
reviews/production_core_readiness_review.json
```

Review type:

```text
Production Review
```

Required sections:

- Stage 4 exit criteria assessment.
- Evidence table.
- Unresolved blockers.
- Accepted gaps.
- Deferred gaps.
- Rejected claims.
- Decision.
- Required follow-up.

Allowed decisions:

```text
Approved
Changes Requested
Deferred
Rejected
```

Approval rule:

The review can be `Approved` only when:

- One vertical slice has validation evidence.
- One live Unity scenario has passed or produced classified actionable failure evidence accepted by the user.
- Traceability view shows vertical-slice requirements linked to evidence.
- Dashboard shows resume state.
- Benchmark report includes at least one live scored evaluation.
- KPI dashboard values exist.

## 5. Live Scored Benchmark Report

Path:

```text
benchmarks/reports/latest-live-scored-benchmark-report.json
```

Differences from Dataset Baseline:

- `runMode` must not be `DatasetBaseline`.
- At least one score dimension must be numeric.
- Evidence must include evaluated AInvil output.
- Critical failures must be recorded.
- Regressions and improvements must be compared when previous report exists.

Validation rules:

- Numeric scores must be 0-5.
- Score evidence must not be empty.
- `NotRun` is allowed only for categories not evaluated in the live run.
- Report must state remaining unevaluated categories.

## 6. KPI Dashboard Requirements

Minimum KPI values:

| KPI | required value |
| --- | --- |
| Validation coverage | Percentage or count by validation level. |
| Traceability completeness | Complete rows vs total rows. |
| Live harness pass count | Passed, failed, blocked counts. |
| Workflow execution success count | Succeeded, blocked, failed counts. |
| Resume readiness | Qualitative or scored status. |
| Documentation drift count | Count by drift type. |
| Benchmark evaluated categories | Count and list. |

KPI values must reference evidence paths.

## 7. Architecture Retrospective

Path:

```text
reports/production_core_architecture_retrospective.md
```

Required sections:

- What worked.
- What failed.
- What was slower than expected.
- Which architectural assumptions were validated.
- Which architectural assumptions were weakened.
- Traceability maintenance cost.
- Validation maintenance cost.
- Resume usefulness.
- Benchmark usefulness.
- Recommended Stage 5 work.

## 8. Stage 4 Gate Validator

Script:

```text
scripts/validate-production-core-gate.mjs
```

Responsibilities:

- Check required evidence files exist.
- Validate review record.
- Validate benchmark reports.
- Validate execution records.
- Validate validation evidence.
- Validate sync report, traceability view, and dashboard.
- Check KPI dashboard exists.
- Report missing Stage 4 exit criteria.

Exit behavior:

- Exit 0 only when gate evidence is complete.
- Exit 1 with actionable missing evidence list otherwise.

## 9. Validation Commands

```powershell
node plugins\ainvil\scripts\validate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-workflow-execution-records.mjs
node plugins\ainvil\scripts\validate-validation-evidence.mjs
node plugins\ainvil\scripts\validate-sync-report.mjs
node plugins\ainvil\scripts\validate-traceability-view.mjs
node plugins\ainvil\scripts\validate-project-dashboard.mjs
node plugins\ainvil\scripts\validate-review-records.mjs
node plugins\ainvil\scripts\validate-production-core-gate.mjs
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
```

## 10. Gate Decision Matrix

| condition | decision |
| --- | --- |
| All evidence exists and validates. | `Approved` |
| Minor non-critical gaps exist and are explicitly deferred. | `Deferred` or `Approved with accepted gaps` if governance allows it. |
| Live Unity proof is missing. | `Changes Requested` |
| Validation evidence is missing for implemented vertical slice. | `Changes Requested` |
| Benchmark scores are all `NotRun`. | `Changes Requested` |
| Traceability or dashboard is missing. | `Changes Requested` |
| Claims are unsupported by evidence. | `Rejected` |

## 11. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PC5-001 | PC-1 through PC-4 artifacts exist. | Gate validator runs. | Missing evidence is reported clearly. |
| AC-PC5-002 | All required evidence exists. | Gate validator runs. | Validator exits 0. |
| AC-PC5-003 | Readiness review is created. | Review validator runs. | Review references evidence and has a valid decision. |
| AC-PC5-004 | Live scored benchmark exists. | Benchmark validator runs. | At least one numeric score has evidence. |
| AC-PC5-005 | KPI dashboard exists. | Gate validator runs. | KPI values reference evidence paths. |

## 12. Definition Of Done

PC-5 is done when:

- Production Core readiness review exists and validates.
- Gate validator can explain whether Stage 4 is approved, deferred, or blocked.
- All claims in the review are backed by evidence files.
- Stage 4 gaps are resolved, accepted, deferred, or converted into Stage 5 work.

