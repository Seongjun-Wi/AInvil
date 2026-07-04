# AInvil Technical Design

## 1. Scope

This document converts the AInvil planning document into implementable contracts and system responsibilities.

AInvil is a platform-level AI Game Production OS, not a simple Unity MCP plugin or Codex-only tool. The technical architecture must support a Director Layer, design collaboration, design critique, GDD completion, technical design, Unity implementation, playability validation, long-term project state, traceability, synchronization, and future multi-client access.

Current implementation scope:

- Codex plugin integration.
- Read-only AInvil CLI prototype.
- Platform architecture direction and package boundary planning.
- Product foundation documents.
- AInvil Builds AInvil dogfooding workflow.
- Studio KPI measurement framework.
- AI game production agent prompts.
- Director Layer above the Orchestrator.
- File-based Production State Graph.
- Read-only Production Intelligence Engine.
- Review & Governance System.
- Studio Playbook shared policy.
- AInvil Capability Benchmark evaluation framework.
- Design review and GDD completion templates.
- Project state and traceability contracts.
- Unity Bridge MCP server.
- Unity Editor package.
- Play Mode reconnect.
- Runtime input validation bridge.
- Asset-first gameplay/world object construction.
- Asset-first prototype UI construction.
- Animation asset discovery and Animator binding.
- Templates and JSON schemas.
- Provider-neutral core modules.
- Workflow Runtime platform-core plan.
- Production Core product plan and technical spec.
- Static AInvil harness assets and validator.

## 1.1 Product Architecture Direction

```text
User creative intent
  Director Layer
    Vision / Design Intelligence / Production Direction / Project Health
    AInvil Orchestrator
      Production State Graph
      Production Intelligence Engine
      Review & Governance System
      Studio Playbook Policy
      Project State / Resume State
    Design Critic Workflow
    GDD Completeness Workflow
    Traceability Matrix
      GDD Agent
        GDD / System Design / Technical Design / Feature Specs
      Unity Agent
        Unity implementation plan / scenes / prefabs / scripts / data
      Input Agent
        Input spec / playability validation / validation evidence
      Documentation Synchronization
      Unity Bridge and MCP tools
        Unity Editor and Play Mode
```

The Director Layer does not replace the Orchestrator. It supervises vision, design quality, production direction, design pattern use, and project health. The Orchestrator coordinates execution through the existing GDD Agent, Unity Agent, and Input Agent.

Unity Bridge remains the transport and editor automation layer. It should not define AInvil's product identity. AInvil's differentiator is that it understands the game design intent, improves weak designs collaboratively, maps requirements to Unity artifacts, validates playability, and remembers project state across long development cycles.

The Production State Graph is the operational backbone that connects vision, decisions, requirements, tasks, Unity targets, input specs, acceptance criteria, validation evidence, health, and next actions. Human-facing Markdown documents remain readable views and detailed source documents.

The Production Intelligence Engine consumes the graph and emits operational reports. It is read-only: it computes health, coverage, risks, validation coverage, and recommendations, but specialist agents remain responsible for updating graph state.

The Review & Governance System consumes Production Intelligence and project artifacts to create structured review records. It does not add specialist agents. It defines review workflows performed by Director Layer, Orchestrator, GDD Agent, Unity Agent, Input Agent, and User.

The Studio Playbook is the shared operating policy that keeps all layers consistent. It does not own state or execution; it guides how decisions are made.

The AInvil Capability Benchmark is the release evaluation framework. It does not add production authority or new agents. It measures whether existing layers perform better on repeatable game-production scenarios across design review, GDD completion, technical translation, production planning, Unity production, validation, project management, and Director quality.

The product foundation documents define long-term governance above implementation details:

- The Manifesto defines product beliefs.
- Architectural Principles define durable constraints.
- The RFC Process makes significant evolution traceable.
- Product Governance defines compatibility, deprecation, migration, and versioning expectations.
- The Maturity Model defines objective stage gates.

The AInvil Builds AInvil dogfooding workflow validates the architecture by using it to manage future AInvil development. RFCs should become production graph requirements and implementation tasks; reviews, validation, benchmark results, and retrospectives should feed future product decisions.

The Studio KPI Framework measures whether AInvil is improving. KPI collection and review connect dogfooding evidence, benchmark progression, governance compliance, validation coverage, traceability cost, user corrections, and recommendation quality to future architectural decisions.

The platform architecture direction treats the Codex plugin as one client of reusable AInvil core. Platform-level logic should move toward packages for core contracts, graph, workflow, intelligence, benchmark, governance, SDK, and clients. Unity-specific logic should remain in an integration boundary.

The read-only CLI prototype is the first non-Codex client. It consumes existing files in place and summarizes platform state without modifying graph files, reports, reviews, benchmarks, Unity, or plugin metadata.

The first practical platform-core extraction is read-only and lives in `core/`: shared path resolution, loaders, summaries, artifact checks, Workflow Runtime Report generation, Workflow Transition Plan generation, and Workflow Transition Approval classification. The CLI consumes these modules, and plugin validation reuses shared artifact checks.

The Workflow Runtime Report is client-neutral and read-only. It reports current state, blockers, review status, validation gaps, benchmark/KPI gaps, and next action evidence. It does not perform workflow transitions.

The Workflow Transition Planner is also client-neutral and read-only. It consumes the report and recommends possible transitions with status, priority, prerequisites, missing prerequisites, evidence references, confidence, and safety notes. It does not execute transitions.

The Workflow Transition Approval Model classifies each transition by approval class, readiness, evidence requirements, review requirements, safety level, automation eligibility, and user-facing message. It does not approve or execute transitions.

The Workflow Runtime Engine should be platform core. It should consume Production State Graph, Review Records, Production Intelligence Report, Benchmark Reports, KPI Dashboard, RFC metadata, and Validation Evidence. It should emit client-neutral workflow outputs that Codex, CLI, desktop, web, or IDE clients can display or act on.

## 2. Current Plugin Architecture

```text
AInvil Plugin
  .codex-plugin/plugin.json
  .mcp.json
  skills/
  mcp-server/server.mjs
  unity-package/Packages/com.codex.unity-bridge
  templates/
  schemas/
  core/
  docs/
  scripts/
  cli/
```

### 2.1 Manifest

`plugin.json` declares:

- plugin identity.
- AInvil display metadata.
- `skills: ./skills/`.
- `mcpServers: ./.mcp.json`.

### 2.2 MCP Configuration

`.mcp.json` declares:

- server name: `unity-bridge`.
- command: `node`.
- entrypoint: `./mcp-server/server.mjs`.
- working directory: plugin root (`cwd: "."`) so the entrypoint resolves after plugin installation.
- startup and tool timeouts for Codex MCP registration.
- environment: `UNITY_BRIDGE_URL=http://127.0.0.1:17777/rpc`.

### 2.3 Validation

`scripts/validate-ainvil-plugin.mjs` verifies:

- manifest fields.
- MCP config.
- skill files.
- product foundation documents.
- dogfooding workflow and architecture retrospective template.
- platform architecture, migration plan, package boundaries, and workflow runtime platform plan.
- CLI prototype document and smoke validator.
- KPI framework, collection strategy, review process, and dashboard template.
- templates.
- schemas.
- Unity package files.
- core modules.
- MCP stdio handshake through `scripts/validate-mcp-server.mjs`.

## 2.4 Platform Package Direction

Future package boundaries:

- `ainvil-core`.
- `ainvil-graph`.
- `ainvil-workflow`.
- `ainvil-intelligence`.
- `ainvil-benchmark`.
- `ainvil-governance`.
- `ainvil-unity`.
- `ainvil-cli`.
- `ainvil-codex-plugin`.

Current migration rule: do not move files until stable interfaces and compatibility shims are defined. The existing plugin must keep validating during each migration stage.

## 3. Agent Contracts

### 3.0 Director Layer

Responsibilities:

- Preserve the game's long-term identity, core fantasy, and intended player experience.
- Review design quality before major implementation begins.
- Warn about feature creep, conflicting systems, production inconsistency, and design drift.
- Maintain structured design pattern knowledge and extract reusable principles from references.
- Review milestone health before the next milestone begins.
- Provide direction packets to the Orchestrator.

Boundaries:

- Does not modify Unity.
- Does not generate scripts.
- Does not edit scenes or create prefabs.
- Does not override confirmed user decisions.
- Does not create a parallel implementation path outside the Orchestrator.

Templates:

- `director_review.md`.
- `milestone_review.md`.
- `project_health_report.md`.
- `design_pattern_library.md`.

### 3.1 AInvil

Responsibilities:

- Convert Director guidance into routed work across specialist agents.
- Maintain production flow.
- Track source-of-truth documents and validation state.
- Maintain project dashboard / resume state.
- Maintain traceability from GDD sections to validation evidence.
- Prioritize design review, GDD completion, traceability, dashboard, and validation pipeline before raw Unity API expansion.

Data contracts:

- `ProductionStateGraph`.
- `ProductionIntelligenceReport`.
- `ReviewRecord`.
- `ProjectState`.
- `TaskGraph`.
- `AgentRunLog`.
- `TraceabilityMatrix`.

### 3.2 GDD Agent

Responsibilities:

- Convert game ideas into design documents.
- Review design quality.
- Detect missing GDD sections.
- Produce technical design inputs.
- Maintain design decisions.

Templates:

- `gdd.md`.
- `technical_design.md`.
- `feature_spec.md`.
- `design_decision_log.md`.
- `design_review.md`.
- `gdd_completeness_report.md`.
- `traceability_matrix.md`.

### 3.3 Unity Agent

Responsibilities:

- Inspect Unity before editing.
- Apply scene, asset, prefab, component, and material changes.
- Maintain structure registry and contracts.
- Map Unity changes back to the traceability matrix.
- Report validation confidence and remaining gaps after every implementation run.

Tools:

- Unity Bridge MCP tools.
- `unity_project_diff`.
- `unity_create_asset_based_object`.
- `unity_create_asset_based_layout`.
- `unity_create_asset_grid_ui`.
- `unity_find_animation_assets`.
- `unity_create_animator_controller`.
- `unity_assign_animator_controller`.
- `unity_get_animator_info`.

Schemas:

- `UnityChangeSet`.
- `UnityBridgeStatus`.

### 3.4 Input Agent

Responsibilities:

- Define input specs.
- Validate input in Play Mode.
- Classify validation failures.
- Produce validation evidence linked to acceptance criteria and traceability rows.

Tools:

- `unity_send_key_event`.
- `unity_click_ui_button`.
- `unity_input_test_bridge`.
- `unity_create_input_test_bridge`.

Schemas:

- `InputValidationResult`.

## 4. Unity Bridge

Long-term Unity capability coverage is defined in `Unity_API_Coverage_Technical_Design.md`. New bridge work should be tied to AInvil's production loop: user goal, documents, milestone planning, Unity implementation, validation, and document synchronization. Low-level tools should remain available, but high-level workflows should be selected by game-making outcomes.

Validation Design probe RPCs for `click`, `invoke`, `textValue`, and `DebugStateProbe` are specified in `Unity_Bridge_Validation_Probe_RPC_Technical_Spec.md`. That spec should guide the next Unity Bridge implementation step before broadening into unrelated raw Unity APIs.

Do not expand raw Unity APIs ahead of the higher-level product workflow unless the new API directly supports design review, traceability, project state, implementation synchronization, or validation confidence.

### 4.1 Editor Bridge

File:

- `unity-package/Packages/com.codex.unity-bridge/Editor/CodexUnityBridgeServer.cs`

Key behavior:

- HTTP listener on `http://127.0.0.1:17777/rpc`.
- Unity main-thread dispatch.
- `/health` endpoint.
- Play Mode reconnect on `EnteredPlayMode`.
- retry scheduling through `EditorApplication.delayCall`.

Status fields:

- `bridgeRunning`.
- `bridgeStatus`.
- `capabilityVersion`.
- `isPlaying`.
- `isPlayingOrWillChangePlaymode`.
- `playModeTransitionCount`.
- `inputTestBridgeAvailable`.

Current capability version:

- `0.6.0-asset-first-objects`.

### 4.2 MCP Server

File:

- `mcp-server/server.mjs`

Responsibilities:

- Expose Unity tools through MCP.
- Forward tool calls to Unity Bridge RPC.
- Retry calls when bridge is reconnecting or transitioning.
- Provide `unity_project_diff` without requiring C# changes.

### 4.3 Runtime Input Bridge

File:

- `unity-package/Packages/com.codex.unity-bridge/Runtime/AInvilInputTestBridge.cs`

Responsibilities:

- Record test input trace.
- Expose UnityEvents for project-specific input adapters.
- Provide public methods called by `unity_input_test_bridge`.

Public methods:

- `GetInputDebugState()`.
- `PressKey(string key)`.
- `ReleaseKey(string key)`.
- `ClickUiPath(string path)`.
- `InvokeSetupHook(string hookId, string jsonArgs)`.
- `ClearInputTrace()`.

### 4.4 Asset-First Gameplay and World Objects

Tools:

- `unity_create_asset_based_object`.
- `unity_create_asset_based_layout`.

Purpose:

- Ensure AInvil checks project assets before creating player, enemy, prop, building, environment, pickup, or interactable objects.
- Use existing prefabs when they match the requested object.
- Use primitive fallback objects only when no suitable asset exists.

Single object behavior:

- Search project prefabs using `assetQuery`.
- Instantiate the best matching prefab when available.
- Otherwise create the requested fallback primitive.
- Optional support for adding a `CharacterController` and child Camera for player prototypes.

Layout behavior:

- Search project prefabs using `assetQuery`.
- Instantiate repeated prefab objects when available.
- Otherwise create repeated primitive fallback objects.
- Supports `grid`, `line`, and `scatter` layout modes.
- Building-like cube fallback layouts vary height to better communicate a city/building block prototype.

Policy:

- Fallback primitives must be marked as prototype defaults in the project structure registry.
- Do not skip asset search unless the user explicitly asks for primitive-only placeholders.

### 4.5 Asset-First Prototype UI

Tool:

- `unity_create_asset_grid_ui`

Purpose:

- Prevent gameplay-facing UI such as inventory, shops, character rosters, item collections, and card lists from being implemented as plain Text lists.
- Build a Canvas-backed grid using an existing cell prefab or generated Image/Button cells.

Inputs:

- `parentPath`: optional parent GameObject. Defaults to an existing or generated Canvas.
- `panelName`: generated panel name.
- `cellCount`: number of cells.
- `columns`: fixed column count.
- `cellSize`: UI cell size.
- `spacing`: grid spacing.
- `includeLabels`: whether generated cells include labels.
- `useButtons`: whether generated cells include Button components.
- `spriteAssetPath`: optional Sprite asset path or GUID.
- `cellPrefabPath`: optional prefab asset path or GUID.

Policy:

- Search existing assets first.
- Use prefabs when available.
- Use generated grid cells as prototype defaults.
- Use Text only as labels, counters, debug output, or explicit text-only UI.

### 4.6 Animation Binding

Tools:

- `unity_find_animation_assets`.
- `unity_create_animator_controller`.
- `unity_assign_animator_controller`.
- `unity_get_animator_info`.

Purpose:

- Discover AnimationClip, AnimatorController, RuntimeAnimatorController, and Avatar assets.
- Create a simple AnimatorController from available clips.
- Assign a controller to a character GameObject.
- Inspect resulting Animator setup.

Limitations:

- Blend trees, humanoid retargeting setup, Avatar configuration, root motion tuning, and advanced transition condition authoring require further tool expansion.
- Runtime animation playback still requires Play Mode validation.

## 5. Failure Classification

| failure type | meaning |
| --- | --- |
| `InputNotReceived` | Editor/runtime input event was sent but game input system did not receive it |
| `GameLogicFailed` | input was received but expected gameplay state did not happen |
| `BridgeDisconnected` | MCP server could not reach Unity Bridge |
| `PreconditionFailed` | scene, component, or game state was not ready |
| `ConsoleError` | Unity console reported an error |
| `Unknown` | failure source is not yet classified |

## 6. Provider-Neutral Core

Files:

- `core/provider-adapter.mjs`.
- `core/tool-calling-adapter.mjs`.
- `core/context-pack.mjs`.

Purpose:

- Keep future LLM provider integrations separate from Codex-specific plugin implementation.
- Convert generic tools into provider-specific shapes.
- Package GDD, technical design, Unity state, recent changes, and open questions.

## 7. Acceptance Criteria

Static checks:

- plugin validator exits 0.
- harness validator exits 0.
- live harness script passes JavaScript syntax checks.
- JSON files parse.
- JavaScript modules pass `node --check`.
- new design review, GDD completeness, traceability, and project dashboard templates exist.
- Director review, milestone review, project health, and design pattern templates exist.
- production state graph schema exists.
- default `state/production_state_graph.json` validates with the graph validator.
- production intelligence report schema exists.
- `reports/production_intelligence_report.json` is generated from the graph and validates with the report validator.
- review record schema exists.
- review records validate against graph node references.
- Studio Playbook, validation checklist, and integration guide exist.
- benchmark docs, dataset structure, report template, scoring rubric, seed datasets, schema, and validator exist.
- Manifesto, Architectural Principles, RFC Process, Product Governance, and Maturity Model exist.
- AInvil Builds AInvil dogfooding workflow and Architecture Retrospective template exist.
- Platform Architecture, Platform Migration Plan, Package Boundaries, and Workflow Runtime Platform Plan exist.
- Production Core Product Plan and Production Core Technical Spec exist.
- AInvil CLI prototype exists and CLI smoke validation passes.
- Workflow Runtime Report schema, template, generator, validator, report artifact, and CLI command exist.
- Workflow Transition Plan schema, template, generator, validator, report artifact, and CLI command exist.
- Workflow Transition Approval schema, template, generator, validator, report artifact, and CLI command exist.
- Studio KPI Framework, KPI Collection Strategy, KPI Review Process, and KPI Dashboard template exist.
- benchmark datasets validate with `scripts/validate-benchmark-datasets.mjs`.
- ProjectState schema tracks latest confirmed user intent, active feature, implemented features, validated features, blockers, open decisions, and next recommended action.

Unity live checks:

- package imports without C# compile errors.
- `unity_get_status` works before Play Mode.
- `unity_get_status` works after Play Mode.
- `unity_create_input_test_bridge` creates `/Debug/AInvilInputTestBridge`.
- `unity_input_test_bridge action=getState` succeeds.
- `unity_create_asset_based_object` uses a prefab when one matches, otherwise creates a documented primitive fallback.
- `unity_create_asset_based_layout` creates repeated prefab or primitive fallback objects for environment layouts.
- `unity_create_asset_grid_ui` creates Image/Button grid cells instead of a Text list.
- `unity_find_animation_assets` lists clips/controllers.
- `unity_assign_animator_controller` assigns a controller to a target Animator.

Plugin integration checks:

- Codex loads AInvil with display name `AInvil`.
- MCP server `unity-bridge` is available after plugin reload.
- Unity tools are callable from Codex.
- AInvil default prompts and skill descriptions frame the product as an AI game production partner, not a simple Unity automation plugin.
- AInvil can produce a Design Review, GDD Completeness Report, Project Dashboard, and Traceability Matrix before Unity implementation.
- AInvil can produce Director guidance before major implementation and a Director milestone review before the next milestone.
- AInvil can maintain a Phase 1 production graph with unique node IDs, valid edge references, valid statuses, valid validation levels, and next-action references.
- AInvil can produce graph-backed production intelligence findings without fabricated node references.
- AInvil can record major decisions through structured reviews with evidence and graph references.
- AInvil prompts reference the Studio Playbook for important decisions without duplicating the whole policy in every agent.
- AInvil benchmark reports can compare capability changes before major architectural releases.
