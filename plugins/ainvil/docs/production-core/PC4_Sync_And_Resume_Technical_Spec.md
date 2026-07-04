# PC-4 Sync And Resume Technical Spec

## 1. Purpose

PC-4 makes AInvil resumable after implementation and validation.

It derives traceability, dashboard, drift findings, and next actions from platform artifacts without turning generated views into source-of-truth documents.

## 2. Scope

In scope:

- Sync report generation.
- Traceability view generation.
- Project dashboard generation.
- Drift detection.
- CLI read-only summary commands.
- Resume summary derived from graph, reviews, validation evidence, benchmark reports, execution records, and KPI data.

Out of scope:

- Silent graph mutation.
- User-facing design changes.
- Unity scene mutation.
- Desktop dashboard UI.
- Team collaboration features.

## 3. New Files

| file | purpose |
| --- | --- |
| `schemas/sync_report.schema.json` | Sync report schema. |
| `schemas/traceability_view.schema.json` | Generated traceability view schema. |
| `schemas/project_dashboard.schema.json` | Generated project dashboard schema. |
| `core/sync-report.mjs` | Creates sync report. |
| `core/traceability-view.mjs` | Derives traceability rows from graph paths. |
| `core/project-dashboard.mjs` | Derives dashboard summary. |
| `scripts/generate-sync-report.mjs` | Writes sync report. |
| `scripts/validate-sync-report.mjs` | Validates sync report. |
| `scripts/generate-traceability-view.mjs` | Writes traceability view. |
| `scripts/validate-traceability-view.mjs` | Validates traceability view. |
| `scripts/generate-project-dashboard.mjs` | Writes dashboard. |
| `scripts/validate-project-dashboard.mjs` | Validates dashboard. |
| `reports/sync_report.json` | Generated sync report. |
| `reports/traceability_view.json` | Generated traceability view. |
| `reports/project_dashboard.json` | Generated project dashboard. |

## 4. Sync Report Contract

Required top-level fields:

| field | description |
| --- | --- |
| `schemaVersion` | `1.0.0`. |
| `syncReportId` | Stable report ID. |
| `generatedAt` | ISO timestamp. |
| `sourceFiles` | Files used to generate report. |
| `graphSummary` | Node, edge, active feature, milestone, validation summary. |
| `traceabilitySummary` | Counts by traceability status. |
| `dashboardSummary` | Resume-ready dashboard fields. |
| `driftFindings` | Missing or conflicting links. |
| `blockedSyncItems` | Items sync could not resolve. |
| `recommendedNextActions` | Evidence-backed actions. |

## 5. Traceability View Contract

Rows should include:

| field | description |
| --- | --- |
| `rowId` | Stable row ID. |
| `featureId` | Feature node. |
| `requirementId` | Requirement node. |
| `featureSpecId` | Feature spec node. |
| `taskId` | Implementation task. |
| `unityTargetId` | Unity target. |
| `inputSpecId` | Input spec. |
| `acceptanceId` | Acceptance criterion. |
| `validationEvidenceId` | Evidence node or evidence file. |
| `validationLevel` | Best available validation level. |
| `status` | Complete or gap status. |
| `missingLinks` | Missing nodes or relationships. |
| `nextAction` | Suggested action. |

Statuses:

```text
Complete
Needs Requirement Definition
Needs Feature Spec
Needs Implementation Task
Needs Technical Mapping
Needs Input Spec
Needs Acceptance Criteria
Needs Validation
Orphan Implementation
Blocked
Unknown
```

## 6. Dashboard Contract

Fields:

| field | description |
| --- | --- |
| `projectName` | From graph. |
| `currentVision` | Current vision node summary. |
| `currentMilestone` | Current milestone node summary. |
| `activeFeature` | Active feature node summary. |
| `healthSummary` | Graph or intelligence health. |
| `validationCoverage` | Counts by validation level. |
| `implementedFeatures` | Feature IDs with implemented tasks. |
| `validatedFeatures` | Feature IDs with sufficient evidence. |
| `blockedTasks` | Blocked task IDs. |
| `openQuestions` | Open design or technical questions. |
| `latestBenchmarkReport` | Latest benchmark report path. |
| `latestLiveHarnessReport` | Latest harness report path. |
| `latestExecutionRecord` | Latest workflow execution record path. |
| `nextRecommendedAction` | Evidence-backed next action. |

## 7. Drift Detection Rules

Report these drift types:

| drift type | condition |
| --- | --- |
| `RequirementWithoutTask` | Requirement node has no implementation task path. |
| `TaskWithoutUnityTarget` | Implementation task has no Unity target. |
| `AcceptanceWithoutEvidence` | Acceptance criterion has no evidence. |
| `EvidenceWithoutAcceptance` | Evidence exists but is not linked to an acceptance criterion. |
| `UnityTargetWithoutRequirement` | Unity target cannot trace back to requirement. |
| `ValidationLevelInsufficient` | Evidence exists but required validation level is unmet. |
| `SourceDocumentMissing` | Node refs point to missing source files. |

## 8. CLI Additions

Commands:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs sync
node plugins\ainvil\cli\ainvil-cli.mjs traceability
node plugins\ainvil\cli\ainvil-cli.mjs dashboard
```

Output expectations:

- `sync`: report ID, drift count, blocked sync count, next actions.
- `traceability`: row count, counts by status, top missing links.
- `dashboard`: project, milestone, active feature, health, validation coverage, latest reports, next action.

## 9. Validation Commands

```powershell
node plugins\ainvil\scripts\generate-sync-report.mjs
node plugins\ainvil\scripts\validate-sync-report.mjs
node plugins\ainvil\scripts\generate-traceability-view.mjs
node plugins\ainvil\scripts\validate-traceability-view.mjs
node plugins\ainvil\scripts\generate-project-dashboard.mjs
node plugins\ainvil\scripts\validate-project-dashboard.mjs
node plugins\ainvil\cli\ainvil-cli.mjs sync
node plugins\ainvil\cli\ainvil-cli.mjs traceability
node plugins\ainvil\cli\ainvil-cli.mjs dashboard
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
```

## 10. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PC4-001 | Current graph and reports exist. | Sync report generation runs. | Sync report is written and validates. |
| AC-PC4-002 | Graph contains current example validation gaps. | Traceability generation runs. | `Needs Validation` rows are produced. |
| AC-PC4-003 | Benchmark report exists. | Dashboard generation runs. | Dashboard references latest benchmark report. |
| AC-PC4-004 | Execution records exist. | Dashboard generation runs. | Dashboard references latest execution record. |
| AC-PC4-005 | CLI commands run. | User inspects outputs. | Resume state and next action are visible. |

## 11. Definition Of Done

PC-4 is done when:

- Sync report, traceability view, and dashboard generate and validate.
- CLI can inspect sync, traceability, and dashboard outputs.
- Missing links are actionable and evidence-backed.
- Generated views do not overwrite source-of-truth design docs.
- Resume state is clear enough to continue work without reading every document.

