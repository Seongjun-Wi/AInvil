# AInvil Platform Migration Plan

## 1. Purpose

This migration plan shifts AInvil from Codex-plugin architecture toward AI-native platform architecture without destabilizing the current working plugin.

The goal is staged extraction, not a risky rewrite.

## 2. Migration Principles

- Keep the current Codex plugin working.
- Prefer documentation and boundaries before file movement.
- Extract stable platform interfaces before extracting implementations.
- Preserve existing validation commands.
- Avoid making AInvil a generic coding agent.
- Preserve AInvil's identity as an AI Game Production OS.

## 3. Stage 1: Current Plugin Foundation

Status: Current stage.

Keep everything working as-is:

- Codex plugin manifest.
- Skills.
- Unity Bridge MCP server.
- Unity package.
- Templates.
- Schemas.
- Production State Graph.
- Production Intelligence.
- Review & Governance.
- Benchmark.
- KPI Framework.
- Dogfooding workflow.
- Validators.

Exit criteria:

- Plugin validation passes.
- Harness validation passes.
- Platform architecture boundaries are documented.
- No files are moved without migration rationale.

## 4. Stage 2: Extract Platform Core

Goal: identify reusable platform modules and contracts.

Status: Started with read-only core extraction.

Candidate extractions:

- `ainvil-core`: shared product contracts, context packaging, provider abstraction.
- `ainvil-graph`: Production State Graph schema, graph readers, graph validators.
- `ainvil-intelligence`: production intelligence report generation and validation.
- `ainvil-governance`: review records, RFC policy, governance validation.
- `ainvil-benchmark`: benchmark datasets, scoring rubric, benchmark report contracts.
- `ainvil-workflow`: workflow runtime interfaces and execution records.
- `ainvil-sdk`: typed client APIs for CLI, Codex plugin, desktop, and web clients.

Exit criteria:

- Package boundary document exists.
- Extracted modules expose stable APIs.
- Codex plugin still validates.
- Existing paths either remain supported or have compatibility shims.

Initial extracted modules:

- `core/ainvil-paths.mjs`.
- `core/loaders.mjs`.
- `core/summaries.mjs`.
- `core/artifact-checks.mjs`.

These modules are intentionally read-only and operate on existing files in place.

## 5. Stage 3: Add CLI Client

Goal: prove platform logic is not Codex-only.

Status: Prototype started and refactored to use read-only core modules.

The CLI should initially support:

- Validate plugin/platform state.
- Inspect Production State Graph.
- Generate Production Intelligence report.
- Validate review records.
- Validate benchmark datasets.
- Produce KPI Dashboard from manual inputs or existing reports.

Exit criteria:

- CLI can use extracted platform modules.
- CLI does not duplicate Codex skill logic.
- CLI can run without Unity.
- CLI can inspect existing plugin files read-only before package extraction.

## 6. Stage 4: Add Runtime Workflow Engine

Goal: implement workflow runtime in platform core.

The runtime should operate on:

- Production State Graph.
- Review Records.
- Production Intelligence Report.
- Benchmark Reports.
- KPI Dashboard.
- RFC metadata.

It should emit client-neutral outputs:

- Recommended next actions.
- Required reviews.
- Required validations.
- Blockers.
- Evidence gaps.
- Benchmark gates.
- KPI warnings.
- Workflow state transitions.

Exit criteria:

- Workflow runtime has no dependency on Codex skills.
- Codex plugin can display or act on runtime outputs.
- CLI can run the same workflow plan.
- Runtime decisions are traceable to evidence.

## 7. Stage 5: Add Dashboard / Desktop / Sync

Goal: expand product surfaces after platform core stabilizes.

Future clients and services may include:

- Desktop dashboard.
- Web dashboard.
- IDE integrations.
- Multi-project dashboard.
- Sync service.
- Persistent memory service.
- Telemetry for KPI trends.

Exit criteria:

- Platform core remains client-neutral.
- Clients share contracts rather than reimplementing business logic.
- Project data can be synchronized without losing traceability or validation evidence.

## 8. Migration Safety

Before each stage:

- Declare expected KPI impact.
- Identify affected packages, plugin files, docs, schemas, validators, and tests.
- Run static validation.
- Run benchmark validation when behavior changes.
- Record migration notes.

After each stage:

- Update architecture docs.
- Update retrospective.
- Update KPI Dashboard.
- Record accepted regressions if any.

## 9. What To Do Next

The read-only platform boundary and CLI prototype now exist. The recommended next implementation step is to prove the first Production Core workflow without moving the plugin.

Do not move the plugin yet. First prove that AInvil can run a scoped production workflow end to end:

- Start from a user game idea or incomplete GDD.
- Produce Director review, requirements, acceptance criteria, and implementation tasks.
- Execute or coordinate Unity work through the bridge.
- Verify compile and Play Mode behavior.
- Capture validation evidence.
- Update the Production State Graph, traceability view, project dashboard, and next action.
- Produce a benchmark report or dogfooding retrospective that records what improved and what remained blocked.

This proof should use existing files in place. Package extraction should wait until the runtime workflow, evidence capture, and synchronization responsibilities are stable enough to preserve through migration.
