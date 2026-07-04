# AInvil Workflow Runtime Report

## 1. Purpose

The Workflow Runtime Report is the first workflow-facing read-only report in AInvil core.

It is not the Workflow Runtime Engine.

It does not execute tasks, transition state, modify documents, update the graph, write reviews, change KPI data, run Unity, or call Codex skills. It reads existing platform artifacts and explains the current workflow state in a client-neutral format.

## 2. What It Answers

The report answers:

- What is the current workflow state?
- What is blocked?
- What review is missing?
- What validation is missing?
- What benchmark or KPI gap exists?
- What should happen next?

## 3. Inputs

The report uses:

- Production State Graph.
- Production Intelligence Report.
- Review Records.
- Benchmark datasets.
- Benchmark report availability.
- KPI framework and dashboard availability.

## 4. Outputs

The generated JSON report includes:

- Metadata.
- Source files used.
- Current state.
- Workflow blockers.
- Review status.
- Validation status.
- Benchmark / KPI status.
- Client-neutral next action.

## 5. Files

```text
core/workflow-report.mjs
schemas/workflow_runtime_report.schema.json
reports/workflow_runtime_report.json
scripts/generate-workflow-runtime-report.mjs
scripts/validate-workflow-runtime-report.mjs
templates/workflow_runtime_report.md
```

## 6. CLI Integration

The CLI exposes:

```bash
node plugins/ainvil/cli/ainvil-cli.mjs workflow
```

The command generates an in-memory report and prints a human-readable summary. It does not write the report file.

## 7. Future Path

```text
Workflow Runtime Report
  -> Workflow Transition Planner
  -> Workflow Runtime Engine
  -> Automated production lifecycle execution
```

The current report prepares the data boundary for future workflow automation without adding automation prematurely.

The next read-only layer is documented in `AInvil_Workflow_Transition_Planner.md`.

## 8. Validation

The report validator checks:

- Required fields.
- Existing graph node references.
- Existing review references.
- Existing benchmark references.
- No fabricated references in known reference fields.

The report is client-neutral and can be consumed by CLI, Codex plugin, desktop app, web dashboard, or future IDE clients.
