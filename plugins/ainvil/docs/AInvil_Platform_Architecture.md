# AInvil Platform Architecture

## 1. Direction

AInvil should evolve from a Codex plugin into an AI-native Game Development Platform.

The Codex plugin remains important, but it should become one client of a larger platform. AInvil's long-term product direction is:

```text
Platform-level AI Game Production OS
  -> CLI
  -> Codex plugin
  -> Desktop app
  -> IDE integrations
  -> Web dashboard
  -> Unity integration
  -> Future engine integrations
```

The core architecture should not be owned by the Codex plugin. Shared platform logic should move toward reusable packages while current plugin behavior remains stable.

## 2. Why The Codex Plugin Is A Client

The current plugin is the first usable AInvil surface. It provides prompts, MCP configuration, Unity Bridge wiring, validators, templates, and documentation in a deployable bundle.

However, AInvil's real product identity is not "a Codex plugin." AInvil is an AI Game Production OS. Its core value comes from:

- Production State Graph.
- Production Intelligence.
- Review & Governance.
- Director Layer.
- Studio Playbook.
- Capability Benchmark.
- Studio KPI Framework.
- Dogfooding evidence loop.
- Future workflow runtime.

Those systems should eventually be usable by multiple clients. Codex should access platform logic, not define it.

## 3. Current Structure Review

### 3.1 Core Platform Logic Candidates

These parts should be treated as reusable platform core candidates:

- `docs/AInvil_Manifesto.md`
- `docs/AInvil_Architectural_Principles.md`
- `docs/AInvil_RFC_Process.md`
- `docs/AInvil_Product_Governance.md`
- `docs/AInvil_Maturity_Model.md`
- `docs/Studio_Playbook.md`
- `docs/AInvil_Production_State_Graph.md`
- `docs/AInvil_Production_Intelligence.md`
- `docs/AInvil_Review_Governance.md`
- `docs/AInvil_Benchmark.md`
- `docs/Studio_KPI_Framework.md`
- `docs/AInvil_Dogfooding_Initiative.md`
- `schemas/production_state_graph.schema.json`
- `schemas/production_intelligence_report.schema.json`
- `schemas/review_record.schema.json`
- `schemas/benchmark_case.schema.json`
- `templates/review_report.md`
- `templates/governance_rules.md`
- `templates/benchmark_report.md`
- `templates/scoring_rubric.md`
- `templates/kpi_dashboard.md`
- `templates/architecture_retrospective.md`
- `scripts/validate-production-state-graph.mjs`
- `scripts/generate-production-intelligence-report.mjs`
- `scripts/validate-production-intelligence-report.mjs`
- `scripts/validate-review-records.mjs`
- `scripts/validate-benchmark-datasets.mjs`
- `benchmarks/datasets/`
- `reports/`
- `reviews/`
- `state/`

These are currently stored inside `plugins/ainvil` for packaging convenience, but conceptually they are platform-level.

### 3.2 Client-Specific Logic

These parts should remain Codex-client-specific until migration is intentionally performed:

- `.codex-plugin/plugin.json`
- `.mcp.json`
- `skills/`
- Codex-specific skill routing and prompt packaging.
- Codex plugin validation glue in `scripts/validate-ainvil-plugin.mjs`.
- MCP registration assumptions tied to Codex plugin loading.
- Codex marketplace/install metadata outside the plugin directory.

The Codex plugin should become `ainvil-codex-plugin` in the future platform layout.

### 3.3 Unity Integration Logic

These parts are Unity integration logic, not general platform core:

- `unity-package/Packages/com.codex.unity-bridge/`
- `mcp-server/server.mjs`
- Unity Bridge HTTP RPC transport.
- Play Mode reconnect logic.
- Runtime input bridge.
- Unity-specific validation tools.
- Unity-specific asset, prefab, scene, Animator, and input operations.
- Unity-focused templates such as scene blueprints, prefab contracts, component contracts, and input validation reports.

This logic should eventually become `ainvil-unity`.

### 3.4 Existing Reusable Core

The current `core/` directory already points in the right direction:

- `core/provider-adapter.mjs`
- `core/tool-calling-adapter.mjs`
- `core/context-pack.mjs`

These should be treated as early platform-core candidates, but they should not be overgeneralized before real clients exist.

## 4. Future Platform Shape

A future platform-oriented repository may evolve toward:

```text
ainvil/
  packages/
    core/
    graph/
    workflow/
    intelligence/
    benchmark/
    governance/
    sdk/

  apps/
    cli/
    codex-plugin/
    desktop/
    web/

  integrations/
    unity/
    unreal/
    godot/

  services/
    sync/
    memory/
    telemetry/

  docs/
```

This is a target direction, not an immediate migration command.

## 5. What Should Not Move Yet

Do not move these yet:

- Codex skill prompts.
- MCP server entrypoint.
- Unity package.
- Current schemas.
- Current validators.
- Current templates.
- Current benchmark datasets.
- Current state, reports, or reviews.

The current plugin should remain functional while platform boundaries are clarified.

Safe next work should add wrappers, package boundaries, and stable interfaces before moving files.

## 6. Platform Boundary Rule

Core platform logic should be reusable.

Client-specific logic should adapt platform outputs to a user surface.

Integration logic should connect platform plans to engines and tools.

No platform core module should depend on Codex skills. No platform core module should require Unity to exist. Unity and Codex should be consumers of platform contracts, not owners of them.

## 7. Compatibility Requirements

Migration must preserve:

```powershell
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
node plugins\ainvil\scripts\validate-ainvil-harness.mjs
```

Any new validation script should be wired into existing validation only when it is deterministic, fast, and does not require live Unity unless explicitly marked as live validation.
