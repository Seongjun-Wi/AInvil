# AInvil Package Boundary Proposal

## 1. Purpose

This document proposes future package boundaries for AInvil as an AI-native Game Development Platform.

The boundaries are not an instruction to move files immediately. They define where responsibilities should land as the platform is extracted safely from the current Codex plugin.

## 2. Boundary Summary

| package | responsibility |
| --- | --- |
| `ainvil-core` | Shared product contracts, context packaging, provider-neutral abstractions, common result types. |
| `ainvil-graph` | Production State Graph schema, graph access, graph validation, graph-derived views. |
| `ainvil-workflow` | Client-neutral workflow runtime, workflow state transitions, next-action generation. |
| `ainvil-intelligence` | Production Intelligence report generation, health signals, risk analysis, evidence-backed recommendations. |
| `ainvil-benchmark` | Benchmark datasets, scoring rubrics, benchmark reports, regression comparison. |
| `ainvil-governance` | RFC process, review records, governance rules, deprecation and migration policy checks. |
| `ainvil-unity` | Unity Bridge, MCP server, Unity Editor package, Play Mode/input validation, Unity artifact synchronization. |
| `ainvil-cli` | Command-line client that consumes platform packages. |
| `ainvil-codex-plugin` | Codex plugin wrapper, skills, plugin manifest, Codex-specific routing and validation glue. |

## 3. `ainvil-core`

Owns:

- Shared type conventions.
- Context-pack construction.
- Provider-neutral adapter interfaces.
- Tool-calling abstraction interfaces.
- Common result and evidence structures.

Must not own:

- Codex skill prompts.
- Unity RPC details.
- Specific workflow policy.

Current candidates:

- `core/context-pack.mjs`
- `core/provider-adapter.mjs`
- `core/tool-calling-adapter.mjs`
- `core/ainvil-paths.mjs`
- `core/loaders.mjs`
- `core/summaries.mjs`
- `core/artifact-checks.mjs`
- `core/workflow-report.mjs`
- `core/workflow-transitions.mjs`
- `core/workflow-approvals.mjs`

Current extracted read-only responsibilities:

- Resolve platform artifact paths from the current plugin layout.
- Load platform artifacts without modifying them.
- Summarize graph, intelligence, review, benchmark, KPI, and status data.
- Check required platform artifacts for CLI doctor and plugin validation.
- Build a client-neutral read-only Workflow Runtime Report.
- Build a client-neutral read-only Workflow Transition Plan.
- Classify workflow transition approval requirements.

## 4. `ainvil-graph`

Owns:

- Production State Graph schema.
- Graph validation.
- Graph traversal helpers.
- Traceability path queries.
- Graph-derived dashboard inputs.

Current candidates:

- `schemas/production_state_graph.schema.json`
- `state/production_state_graph.json`
- `scripts/validate-production-state-graph.mjs`
- `templates/traceability_matrix.md`
- `templates/project_dashboard.md`

## 5. `ainvil-workflow`

Owns:

- Workflow runtime interfaces.
- Workflow runtime reports.
- Workflow transition plans.
- Workflow transition approval models.
- Workflow state transitions.
- Workflow event records.
- Next-action evaluation.
- Review and validation gate evaluation.
- KPI and benchmark gate awareness.

Must not depend on:

- Codex skills.
- Unity Bridge.
- A specific UI.

Inputs:

- Production State Graph.
- Review Records.
- Production Intelligence Report.
- Benchmark Reports.
- KPI Dashboard.
- RFC metadata.

Outputs:

- Client-neutral workflow plan.
- Required user confirmations.
- Required reviews.
- Required validations.
- Evidence gaps.
- Blockers.
- Next recommended actions.

## 6. `ainvil-intelligence`

Owns:

- Production Intelligence Report schema.
- Health computation.
- Coverage gap analysis.
- Production risk analysis.
- Evidence-backed recommendation generation.

Current candidates:

- `schemas/production_intelligence_report.schema.json`
- `scripts/generate-production-intelligence-report.mjs`
- `scripts/validate-production-intelligence-report.mjs`
- `templates/production_health_report.md`

## 7. `ainvil-benchmark`

Owns:

- Capability Benchmark definitions.
- Dataset schema.
- Dataset validation.
- Scoring rubrics.
- Benchmark reports.
- Regression comparison policy.

Current candidates:

- `docs/AInvil_Benchmark.md`
- `docs/AInvil_Benchmark_Workflow.md`
- `docs/AInvil_Benchmark_Dataset_Structure.md`
- `schemas/benchmark_case.schema.json`
- `benchmarks/datasets/`
- `templates/benchmark_report.md`
- `templates/scoring_rubric.md`
- `scripts/validate-benchmark-datasets.mjs`

## 8. `ainvil-governance`

Owns:

- Manifesto and architectural principles.
- RFC process.
- Product governance.
- Review records.
- Governance rules.
- Maturity model.
- KPI framework.
- Dogfooding retrospective contracts.

Current candidates:

- `docs/AInvil_Manifesto.md`
- `docs/AInvil_Architectural_Principles.md`
- `docs/AInvil_RFC_Process.md`
- `docs/AInvil_Product_Governance.md`
- `docs/AInvil_Maturity_Model.md`
- `docs/AInvil_Review_Governance.md`
- `docs/Studio_KPI_Framework.md`
- `schemas/review_record.schema.json`
- `reviews/`
- `templates/review_report.md`
- `templates/governance_rules.md`
- `templates/kpi_dashboard.md`
- `templates/architecture_retrospective.md`
- `scripts/validate-review-records.mjs`

## 9. `ainvil-unity`

Owns:

- Unity Bridge MCP server.
- Unity Editor package.
- Runtime input bridge.
- Play Mode validation tools.
- Unity-specific scene/prefab/script/data synchronization.
- Unity-specific validation evidence capture.

Current candidates:

- `mcp-server/server.mjs`
- `unity-package/Packages/com.codex.unity-bridge/`
- Unity-specific templates for scenes, components, prefabs, input, and playtests.

Must not own:

- Product identity.
- Production State Graph semantics.
- Review governance.
- Benchmark policy.

## 10. `ainvil-cli`

Owns:

- CLI commands.
- Human-readable terminal output.
- Local project entrypoints.
- Platform validation commands.

Should consume:

- `ainvil-core`
- `ainvil-graph`
- `ainvil-intelligence`
- `ainvil-governance`
- `ainvil-benchmark`
- `ainvil-workflow`

## 11. `ainvil-codex-plugin`

Owns:

- Codex plugin manifest.
- Codex skills.
- Codex-specific routing.
- MCP configuration for Codex.
- Plugin validation glue.
- Codex packaging expectations.

Should consume platform packages rather than duplicate platform logic.

Current candidates:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `skills/`
- `scripts/validate-ainvil-plugin.mjs`

## 12. Extraction Rule

Only extract a package when:

- It has a clear boundary.
- It can be consumed by at least one non-Codex client or test entrypoint.
- Existing plugin validation remains green.
- Migration does not break current file paths without compatibility shims.
