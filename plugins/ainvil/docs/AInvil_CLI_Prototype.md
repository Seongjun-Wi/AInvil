# AInvil CLI Prototype

## 1. Purpose

The AInvil CLI prototype is the first read-only non-Codex entrypoint for AInvil.

It proves that AInvil's platform concepts can be consumed outside the Codex plugin without moving files, rewriting the plugin, requiring Unity, or requiring Codex.

## 2. Location

```text
plugins/ainvil/cli/ainvil-cli.mjs
```

Run with:

```bash
node plugins/ainvil/cli/ainvil-cli.mjs <command>
```

## 3. Read-Only Constraint

The CLI must not modify:

- Production State Graph.
- Production Intelligence reports.
- Review records.
- Benchmark datasets.
- KPI documents.
- Unity projects.
- Plugin metadata.
- Codex skills.

If a report is missing, the CLI reports that it is missing. It does not fabricate or silently generate output.

## 4. Commands

### `status`

Summarizes:

- Current vision.
- Current milestone.
- Active feature.
- Project health.
- Blocked tasks.
- Next recommended action.
- Intelligence summary.
- KPI dashboard availability.

### `graph`

Summarizes the Production State Graph:

- Node counts by type.
- Edge counts by type.
- Invalid references.
- Missing links.
- Open questions.
- Blocked nodes.

### `intelligence`

Reads the Production Intelligence Report and summarizes:

- Health categories.
- Coverage gaps.
- Risks.
- Recommendations.
- Validation coverage.

### `reviews`

Summarizes review records:

- Review count by type.
- Pending reviews.
- Changes requested.
- Approved reviews.
- Major risks.

### `benchmark`

Summarizes benchmark readiness:

- Benchmark case count by category.
- Missing expected outputs.
- Scoring rubric availability.
- Benchmark report template availability.
- Latest benchmark report if available.

### `kpi`

Summarizes KPI readiness:

- Known KPI categories.
- Collection strategy availability.
- Review process availability.
- Dashboard template availability.
- Missing KPI data.

### `workflow`

Generates an in-memory Workflow Runtime Report summary.

Shows:

- Current vision.
- Current milestone.
- Active feature.
- Workflow blockers.
- Review status.
- Validation gaps.
- Benchmark report availability.
- KPI dashboard availability.
- Next recommended workflow action.

The command does not write `reports/workflow_runtime_report.json`. Use `scripts/generate-workflow-runtime-report.mjs` when a report artifact is needed.

### `transitions`

Generates an in-memory Workflow Transition Plan summary.

Shows:

- Available transitions.
- Blocked transitions.
- Transitions needing review.
- Safest recommended transition.
- Reasons and evidence-backed target artifacts.

The command does not write `reports/workflow_transition_plan.json`. Use `scripts/generate-workflow-transition-plan.mjs` when a plan artifact is needed.

### `approvals`

Generates an in-memory Workflow Transition Approval summary.

Shows:

- Approval class counts.
- Execution readiness counts.
- Safety level counts.
- Auto-eligible transitions.
- Approval-required transitions.
- Blocked transitions.
- Forbidden transitions.
- Safest next approved action if any.

The command does not write `reports/workflow_transition_approval.json`. Use `scripts/generate-workflow-transition-approval.mjs` when an approval artifact is needed.

### `doctor`

Runs read-only health checks:

- Required file existence.
- Production State Graph validator.
- Production Intelligence Report validator.
- Review Records validator.
- Benchmark Dataset validator.

The full plugin validator is intentionally not run by `doctor` because plugin validation may regenerate reports. The CLI stays read-only.

## 5. Relationship To Platform Architecture

The CLI is an early client of AInvil platform concepts.

It consumes existing `plugins/ainvil` files in place:

- Production State Graph.
- Production Intelligence Report.
- Review Records.
- Benchmark datasets.
- KPI framework and templates.

It does not depend on Codex skills. It does not depend on Unity Bridge. It does not require a database.

## 5.1 Shared Platform Core Boundary

The CLI now uses the first extracted read-only AInvil Core modules:

- `core/ainvil-paths.mjs`: shared path resolution for current platform artifacts.
- `core/loaders.mjs`: read-only loading for graph, intelligence report, reviews, benchmarks, and KPI artifacts.
- `core/summaries.mjs`: pure summary helpers for status, graph, intelligence, reviews, benchmarks, and KPI output.
- `core/artifact-checks.mjs`: shared required-artifact checks for CLI doctor and validators.
- `core/workflow-report.mjs`: read-only Workflow Runtime Report builder used by future workflow-facing clients.
- `core/workflow-transitions.mjs`: read-only Workflow Transition Planner used by future workflow-facing clients.
- `core/workflow-approvals.mjs`: read-only Workflow Transition Approval classifier used by future workflow-facing clients.

This keeps CLI behavior small while proving that AInvil's platform concepts are not trapped inside the Codex plugin.

CLI-specific responsibilities remain:

- Command parsing.
- Terminal formatting.
- Exit codes.
- Calling read-only validators for `doctor`.

Codex-specific responsibilities remain in:

- `.codex-plugin/`
- `.mcp.json`
- `skills/`
- Codex plugin validation glue.

Unity-specific responsibilities remain in:

- `mcp-server/`
- `unity-package/`
- Unity Bridge and Play Mode validation tools.

## 6. Future Migration

This prototype can later become:

```text
apps/cli/
```

or:

```text
packages/ainvil-cli/
```

after platform packages exist.

The CLI should eventually consume:

- `ainvil-core`.
- `ainvil-graph`.
- `ainvil-workflow`.
- `ainvil-intelligence`.
- `ainvil-benchmark`.
- `ainvil-governance`.

The current prototype should stay small until those package boundaries are proven.
