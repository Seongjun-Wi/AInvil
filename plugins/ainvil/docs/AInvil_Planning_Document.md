# AInvil Planning Document

## 1. Purpose

AInvil is a Unity-based AI game production agent. It collaborates with the user from game idea and GDD creation to technical design, Unity implementation, playability validation, long-term project memory, and documentation synchronization.

AInvil should not be framed as a simple Unity MCP plugin. Existing Unity MCP tools mainly expose Unity operations so an LLM can manipulate scenes, assets, scripts, and prefabs. AInvil uses Unity operations as one capability inside a larger game production workflow.

AInvil's core identity:

- AI-native Game Development Platform.
- Product Manifesto and Architectural Principles.
- RFC-based architectural evolution.
- Product governance and maturity model.
- Studio Playbook shared operating constitution.
- Game Director supervision layer.
- AI game design partner.
- Technical design assistant.
- Unity implementation agent.
- Playability validation agent.
- Long-term project memory and synchronization system.

The user owns the creative vision. AInvil improves, structures, implements, validates, and maintains that vision without silently replacing it.

Language policy:

- AInvil internal source-of-truth documents, templates, schemas, prompts, and harness documents are written in English.
- AInvil responds to users in the user's language.
- Generated game project documents follow the user's requested language.
- Code identifiers, API names, schema fields, and comments use English.

## 2. Current State

Implemented:

- Codex plugin manifest and marketplace entry.
- AInvil orchestrator skill.
- GDD Agent, Unity Agent, and Input Agent skills.
- Requirement-first design-to-validation workflow.
- Source-of-truth document hierarchy.
- AInvil Manifesto, Architectural Principles, RFC Process, Product Governance, and Maturity Model.
- AInvil Builds AInvil dogfooding initiative and Architecture Retrospective template.
- Platform Architecture, Platform Migration Plan, Package Boundaries, and Workflow Runtime Platform Plan.
- Studio KPI Framework, KPI Collection Strategy, KPI Review Process, and KPI Dashboard template.
- Phase 1 Production State Graph schema and default state file.
- Phase 1 Production Intelligence Engine and report validator.
- Review & Governance System with review record schema and validator.
- Studio Playbook, validation checklist, and integration guide.
- AInvil Capability Benchmark docs, seed datasets, scoring rubric, report template, and dataset validator.
- Unity Bridge MCP server.
- Unity Editor package with HTTP RPC bridge.
- Play Mode reconnect support.
- Runtime input validation bridge.
- Asset-first gameplay/world object construction.
- Asset-first prototype UI construction.
- Animation asset discovery and Animator binding.
- Document templates and JSON schemas.
- Provider-neutral core modules for future multi-LLM support.
- Node-based plugin validation script.
- Static AInvil harness for goal-to-playable scenario validation.

Direction now prioritized:

- Product foundation and governance over feature accumulation.
- Platform direction: Codex plugin as one client of reusable AInvil core.
- Dogfooding AInvil development through AInvil's own production workflow.
- Studio KPIs as the measurement framework for future evolution.
- Director Layer above the existing Orchestrator.
- Production State Graph as the operational backbone.
- Production Intelligence Engine as the read-only reasoning layer.
- Review & Governance System as the structured decision-making layer.
- Studio Playbook as the shared operating constitution.
- Capability Benchmark as the release evaluation framework.
- Design Critic / Design Review capability.
- GDD Completeness Checker.
- Traceability Matrix.
- Project Dashboard / Resume State.
- Unity Validation Pipeline.

Pending live validation:

- Unity C# compile after package import.
- Play Mode reconnect in a running Unity Editor.
- Runtime calls to `unity_create_input_test_bridge` and `unity_input_test_bridge`.
- Codex app reload confirming MCP tools are exposed after plugin reinstall.

Production Core gaps:

- Guarded Workflow Runtime now persists workflow reports, transition plans, approval classifications, run records, graph next-action synchronization, generated traceability views, and generated project dashboards. It intentionally does not promote validation, approve user decisions, or modify Unity without evidence.
- Workflow Execution Records now capture transition-level dry-run, succeeded, and blocked outcomes under `workflow/runs/`. The first executable low-risk transition is `TRANS-RunBenchmark-Refresh`; evidence-required validation transitions remain blocked.
- PC3 live harness evidence export, PC4 sync/resume operational views, and PC5 Production Core gate review are implemented. Current gate decision is `Changes Requested` because the latest live Unity scenario has classified artifact failures rather than passed validation.
- The current Production State Graph is still an example graph. AInvil needs at least one real dogfooding graph and one Unity sample-game graph with non-placeholder validation evidence.
- Live harness evidence is not yet sufficient to prove repeatable Unity production. A public-facing vertical slice should include successful bridge health, compile, Play Mode, input validation, and evidence capture.
- Documentation synchronization exists as a product principle and template set, but implemented Unity changes do not yet automatically produce synchronized graph updates, traceability rows, validation records, and drift findings.
- Director Layer behavior is defined in governance and prompts, but it still needs durable review records, persisted direction packets, and milestone decision history from real workflows.
- Benchmark datasets exist, but AInvil needs generated benchmark reports and regression comparison before claiming capability improvement across releases.

## 3. Product Vision

AInvil helps a game developer move from a rough idea or incomplete GDD to a playable, validated Unity project while keeping design intent, technical planning, Unity implementation, validation evidence, and project memory synchronized.

Foundational product documents:

- `AInvil_Manifesto.md`: product beliefs and long-term identity.
- `AInvil_Architectural_Principles.md`: durable architectural decision criteria.
- `AInvil_RFC_Process.md`: traceable architectural change process.
- `AInvil_Product_Governance.md`: compatibility, migration, deprecation, and versioning policy.
- `AInvil_Maturity_Model.md`: objective product maturity stages.
- `AInvil_Dogfooding_Initiative.md`: self-application workflow for future AInvil development.
- `AInvil_Platform_Architecture.md`: multi-client platform direction and current structure classification.
- `AInvil_Platform_Migration_Plan.md`: staged migration from plugin foundation to platform architecture.
- `AInvil_Package_Boundaries.md`: future package ownership and extraction rules.
- `AInvil_Workflow_Runtime_Platform_Plan.md`: platform-core placement for Workflow Runtime.
- `AInvil_Production_Core_Product_Plan.md`: concrete product plan for reaching Stage 4 Production Core.
- `AInvil_Production_Core_Technical_Spec.md`: implementation plan for guarded runtime execution, evidence capture, synchronization, and live validation.
- `Studio_KPI_Framework.md`: measurable success criteria for AInvil evolution.
- `KPI_Collection_Strategy.md`: how KPI data is collected.
- `KPI_Review_Process.md`: how KPI changes guide release and architecture decisions.

Core values:

- Preserve user creative intent.
- Protect the game's long-term identity through the Director Layer.
- Challenge weak designs constructively.
- Complete missing design information before implementation.
- Convert vague design into implementation-ready tasks.
- Keep documents and Unity project state aligned.
- Use specialist agents rather than one oversized agent.
- Make Unity validation repeatable.
- Keep the core portable across Codex, other LLMs, and a future standalone GUI.
- Treat Codex as an important client, not the owner of platform architecture.

## 3.1 Differentiation from Unity MCP Tools

| Unity MCP tools | AInvil |
| --- | --- |
| Expose Unity operations. | Runs an AI game production workflow. |
| Manipulate scenes, assets, scripts, and prefabs. | Understands and improves the game design intent before implementation. |
| Help an LLM operate Unity. | Converts GDDs into technical design, feature specs, Unity mappings, validation plans, and synchronized project state. |
| Usually focus on editor actions. | Tracks whether features are playable and what validation evidence exists. |
| Have limited long-term production memory. | Maintains milestone, active feature, latest confirmed intent, open questions, blockers, validated features, and next recommended action. |

AInvil should compete by being traceable, design-aware, validation-aware, and memory-aware, not by exposing the largest number of raw Unity APIs.

## 4. Agent Scope

### 4.0 Director Layer

Responsibilities:

- Preserve the game's long-term vision, core fantasy, and intended player experience.
- Review design quality before major implementation begins.
- Warn about feature creep, conflicting systems, design drift, and production inconsistency.
- Maintain structured design pattern knowledge as reusable principles, not copied mechanics.
- Review milestone health before the next milestone begins.
- Provide direction packets to the Orchestrator.

The Director Layer is not another implementation agent. It must not directly modify Unity, generate scripts, edit scenes, create prefabs, or run implementation tools. It supervises and directs; the Orchestrator coordinates execution through GDD Agent, Unity Agent, and Input Agent.

Implemented support:

- Product architecture document describes the Director Layer.
- Orchestrator prompt recognizes Director guidance.
- Director review and milestone/project health templates.

Remaining work:

- Persist Director review summaries in ProjectState.
- Build periodic project health reports.
- Add structured design pattern libraries.
- Add milestone review automation.

### 4.1 AInvil Orchestrator

Responsibilities:

- Convert Director guidance into routed work for GDD Agent, Unity Agent, and Input Agent.
- Maintain the end-to-end production loop.
- Track project state, task graph, run logs, validation status, and open questions.
- Decide when user confirmation is required.
- Maintain traceability from design intent to Unity validation evidence.
- Support "continue where we left off" through project state.

Implemented support:

- `ProjectState` schema.
- `TaskGraph` schema.
- `AgentRunLog` schema.
- AInvil planning and technical design documents.

Remaining work:

- Persist run logs automatically.
- Add checkpoint/resume behavior.
- Add a GUI task board backed by `TaskGraph`.
- Add project dashboard generation from `ProjectState`.
- Add automatic traceability matrix generation.

### 4.2 GDD Agent

Responsibilities:

- Infer design intent.
- Review and critique weak game designs.
- Check GDD completeness.
- Write or refine GDDs.
- Convert GDD content into technical design.
- Track design decisions and implementation impact.

Implemented support:

- GDD template.
- Technical design template.
- Feature spec template.
- Design decision log template.
- Design review template.
- GDD completeness report template.
- Traceability matrix template.

Remaining work:

- Add automated GDD quality checks.
- Add feature traceability reports linking GDD sections to Unity assets and input tests.
- Add genre-aware design review packs.
- Add scope and one-person feasibility assessment.

### 4.3 Unity Agent

Responsibilities:

- Inspect and modify Unity scenes, GameObjects, components, prefabs, materials, data assets, and package setup.
- Maintain project structure registry, scene blueprints, component contracts, and prefab contracts.
- Validate compile status, scene state, and console logs.
- Map implementation work back to requirements, feature specs, and validation evidence.

Implemented support:

- Unity Bridge MCP tools.
- `unity_project_diff`.
- `unity_create_asset_based_object`.
- `unity_create_asset_based_layout`.
- `unity_create_asset_grid_ui`.
- `unity_find_animation_assets`.
- `unity_create_animator_controller`.
- `unity_assign_animator_controller`.
- `unity_get_animator_info`.
- Project structure template.
- Scene blueprint template.
- Component contract template.
- Prefab contract template.
- `UnityChangeSet` schema.

Remaining work:

- Run live Unity compile validation.
- Add richer registry diff output for assets, scripts, and prefabs.
- Add rollback/change-set replay strategy.
- Add scene/prefab/script synchronization checks.
- Add regression checks for changed requirements.

### 4.4 Input Agent

Responsibilities:

- Define keyboard, mouse, gamepad, UI, touch, and debug inputs.
- Maintain input specifications.
- Validate Play Mode behavior.
- Classify input failures.
- Record validation evidence for the traceability matrix.

Implemented support:

- Input spec template.
- Playtest report template.
- `InputValidationResult` schema.
- `unity_send_key_event`.
- `unity_click_ui_button`.
- `unity_input_test_bridge`.
- `unity_create_input_test_bridge`.
- `AInvilInputTestBridge` runtime component.

Remaining work:

- Validate against Unity New Input System projects.
- Add example game-specific input adapters.
- Store validation results automatically.
- Add regression validation by requirement and input context.

## 5. AInvil Production Workflow

AInvil's workflow is:

```text
Idea / Partial GDD
  -> Director Vision Review
  -> Director Design Review
  -> User Confirmation
  -> Orchestrator Production Planning
  -> Production State Graph Update
  -> Production Intelligence Report
  -> Review & Governance Gate when required
  -> Studio Playbook Policy Check
  -> GDD Completeness Check
  -> GDD / System Design / Technical Design
  -> Feature Specs
  -> Traceability Matrix
  -> Unity Implementation Plan
  -> Unity Scene / Prefab / Script / Data Changes
  -> Compile / Play Mode / Runtime Validation
  -> Director Milestone Review
  -> Production State Graph / Project State / Documentation Sync
```

Unity Bridge is the local tool layer between AInvil and Unity Editor, but it is not AInvil's product identity.

The long-term Unity capability expansion plan is tracked in `Unity_API_Coverage_Planning.md`. AInvil should expand Unity Bridge to serve goal-driven game creation, not to blindly expose every Unity C# member. Each capability must help convert user intent and documents into Unity implementation, validation, and document synchronization.

Implemented capabilities:

- Scene hierarchy inspection.
- GameObject and component inspection.
- GameObject creation, update, and deletion.
- Component add/remove and serialized field updates.
- Asset search and material/prefab utilities.
- Scene open/save/list.
- Console and compile status.
- Play Mode enter/exit.
- UI button click.
- key event sending.
- Runtime input test bridge invocation.
- Play Mode reconnect and health retry.
- Asset-first gameplay/world object generation.
- Asset-first grid UI generation.
- Animation asset discovery and AnimatorController binding.

Design rule:

- `unity_send_key_event` is best-effort.
- `unity_input_test_bridge` is the preferred repeatable validation path when `AInvilInputTestBridge` exists.

## 6. Standalone GUI Direction

The future AInvil Desktop App should include:

- Project Dashboard.
- Agent Console.
- Document Workspace.
- Unity Inspector Bridge.
- Task Board.
- Validation Center.
- Settings for provider, model, Unity Bridge URL, and workspace paths.

Recommended MVP stack:

- Tauri first, Electron or .NET/WPF as alternatives.

## 7. Multi-LLM Strategy

AInvil should not depend on one provider-specific prompt or tool format.

Implemented foundation:

- `provider-adapter.mjs`.
- `tool-calling-adapter.mjs`.
- `context-pack.mjs`.

Target integrations:

- Codex plugin.
- Generic MCP server.
- OpenAI tool/app connector.
- Anthropic/Claude connector.
- Local LLM fallback.

## 8. Roadmap

### Phase 1: AI Game Design Partner

Status: In progress.

- Director Layer above the Orchestrator.
- Production State Graph foundation.
- Production Intelligence Engine foundation.
- Review & Governance System foundation.
- Studio Playbook foundation.
- Director Vision Review.
- Director Design Review.
- Director Milestone Review.
- Project Health Review.
- Design Pattern Knowledge Library.
- Design Critic / Design Review.
- GDD Completeness Checker.
- Better Feature Specs with design quality, feasibility, and validation readiness.
- Project Dashboard / Resume State.
- Traceability Matrix.
- ProjectState fields for latest confirmed user intent, active feature, implemented features, validated features, blockers, and next recommended action.
- Traceability Matrix and Project Dashboard as graph-derived views.
- Production Health Report as graph-backed operational summary.
- Review records for major decisions and governance gates.
- Capability Benchmark seed suite for evaluating whether AInvil improves design review, GDD completion, technical translation, validation honesty, and Director quality.
- AInvil Builds AInvil dogfooding workflow for validating the existing architecture through real AInvil development.
- Studio KPI Framework for measuring design, production, intelligence, user experience, and product outcomes.
- Platform Architecture direction that separates core platform logic, Codex client logic, and Unity integration logic.

### Phase 2: Unity Production Assistant

Status: Planned / partially implemented.

- Production Core product plan and technical spec.
- Director-guided milestone implementation gates.
- Reliable Unity Bridge validation.
- Compile and Play Mode checks.
- Input validation.
- Scene/prefab/script synchronization.
- Requirement-linked regression checks.
- UnityChangeSet reports.
- Scene, prefab, component, and traceability drift detection.

Production Core entry work:

- Build one end-to-end vertical slice: user idea, Director review, GDD completion, requirements, acceptance criteria, Unity implementation, compile check, Play Mode validation, validation evidence, traceability update, project dashboard update, and next action.
- Convert Workflow Runtime from read-only reporting into a guarded execution engine that can apply approved transitions, write execution records, update graph state, and stop safely when evidence or approval is missing.
- Guarded runtime foundation implemented: safe synchronization transitions now write execution records, update graph next action, and generate dashboard/traceability operational views while stopping before evidence-required or approval-required transitions.
- Replace the example Production State Graph as the main product proof with real dogfooding and sample-game graphs that include confirmed decisions, implementation tasks, Unity targets, acceptance criteria, and validation evidence.
- Add an automatic document synchronization pass after Unity work that updates graph nodes, traceability views, validation reports, project dashboard summaries, and drift findings without overwriting user-approved design intent.
- Persist Director direction packets, review outcomes, milestone decisions, and user confirmations as inspectable production records.
- Produce benchmark reports from the seed datasets and compare them across releases before major architecture changes.
- Maintain a public demo path that can prove AInvil is not only a Unity bridge: the demo must show design critique, implementation, validation, evidence, and resume state in one coherent workflow.

### Phase 3: Full Agent Tool

Status: Planned.

- Platform package extraction.
- CLI client using platform core.
- Workflow Runtime Engine in platform core.
- Persistent Director memory and vision history.
- Versioned production graph history.
- Historical production intelligence reports and trend analysis.
- Persistent memory.
- Task graph executor.
- Rollback/replay.
- CI integration.
- Multi-project dashboard.
- Team workflow.
- Multi-LLM provider adapters.
- Long-running project retrieval and synchronization.

### Phase 4: AI-Native Game Development Platform

Status: Future direction.

- Codex plugin operates as `ainvil-codex-plugin`.
- CLI, desktop, web, and IDE clients consume shared platform packages.
- Unity integration becomes `ainvil-unity`.
- Future engine integrations can consume the same workflow, graph, governance, benchmark, and KPI contracts.
- Sync, memory, and telemetry services support long-running multi-client production.

### Release Gate

Before major architectural releases, run the AInvil Capability Benchmark in addition to static validators and live Unity checks. Architectural changes should preserve or improve benchmark performance, especially for creative ownership, traceability, evidence usage, validation honesty, and unknown handling.

Significant architectural changes should also follow the RFC process and satisfy Product Governance requirements for compatibility, migration, deprecation, and versioning.

Future AInvil milestones should include an Architecture Retrospective. Retrospectives should capture review usefulness, recommendation usefulness, false positives, missing recommendations, documentation maintenance cost, traceability maintenance cost, resume time, idea-to-implementation time, and benchmark score progression.

Future architectural work should declare expected KPI impact before implementation and compare actual KPI movement during review. KPI regressions should be recorded with rationale instead of being hidden behind feature count.
