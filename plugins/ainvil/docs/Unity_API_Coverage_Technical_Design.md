# Unity Capability Technical Design for Goal-Driven Game Creation

## 1. Scope

This document translates `Unity_API_Coverage_Planning.md` into an implementation architecture for AInvil.

The bridge should not become a flat remote wrapper over Unity APIs. It should also not define AInvil's identity. AInvil is a Unity-based AI game production agent; Unity operations are one part of a larger workflow that starts with design intent and ends with validation evidence and synchronized project state.

The Unity capability layer should let AInvil:

- Read the user's goal and source-of-truth documents.
- Choose the Unity systems needed for the next playable milestone.
- Apply scoped Unity changes.
- Validate the prototype.
- Sync implementation state back into documents.

Immediate product priorities before more raw Unity API expansion:

1. Design Critic / Design Review.
2. GDD Completeness Checker.
3. Traceability Matrix.
4. Project Dashboard / Resume State.
5. Unity Validation Pipeline.

## 2. Architecture

```text
User Goal
  GDD Agent
    Design Review, GDD Completeness, GDD, Technical Design, Feature Specs, Decisions
      AInvil Orchestrator
        Project State / Resume State
        Traceability Matrix
        Milestone Planner
          Unity Agent
            Capability Planner
              MCP Tool Contract
                Unity Bridge HTTP RPC
                  Unity Main Thread Dispatcher
                    Unity Editor APIs
                    Runtime Validation APIs
          Input Agent
            Input Spec
            Play Mode Validation
```

The MCP server remains the current transport for Codex. The future AInvil Desktop App and other LLM providers should use the same logical capability contracts through provider adapters.

## 3. Core Data Flow

Each implementation run should produce or update:

- `ProjectState`: current design, implementation, validation, and open-question state.
- `TaskGraph`: milestone tasks and dependencies.
- `TraceabilityMatrix`: GDD section, requirement, feature spec, implementation task, Unity target, input spec, acceptance criteria, and validation evidence.
- `UnityChangeSet`: planned and applied Unity changes.
- Structure registry: files, scenes, scripts, prefabs, data assets, materials, UI, debug objects, and validation state.
- Scene blueprint: expected scene hierarchy and object roles.
- Component contracts: script responsibilities, fields, references, and validation checks.
- Prefab contracts: prefab structure, dependencies, spawn rules, and validation checks.
- Input spec: controls, expected behavior, implementation targets, and validation results.
- Playtest report: compile state, console state, scene checks, input checks, and gameplay checks.

## 4. Capability Planner

Add a planning layer above raw Unity tools.

Responsibilities:

- Read the current milestone requirement.
- Identify required Unity capability groups.
- Check whether required packages are installed.
- Inspect current project state before mutation.
- Prefer project assets and conventions.
- Generate a dry-run plan for risky changes.
- Select bridge tools to execute.
- Produce validation steps.
- Emit document updates required after execution.

Planned logical tool:

- `ainvil_plan_unity_changes`

Inputs:

- `goal`.
- `milestoneId`.
- `gddRefs`.
- `technicalDesignRefs`.
- `sceneBlueprintRefs`.
- `componentContractRefs`.
- `prefabContractRefs`.
- `inputSpecRefs`.
- `constraints`.
- `dryRun`.

Outputs:

- required capability groups.
- required packages.
- planned Unity operations.
- affected assets, scenes, GameObjects, scripts, prefabs, and settings.
- required confirmations.
- validation plan.
- document sync plan.

## 5. Traceability Contract

Every high-level Unity workflow should return traceability:

- `sourceGoal`: user request or milestone.
- `documentRefs`: GDD, technical design, feature spec, or input spec references.
- `unityTargets`: scenes, GameObjects, components, prefabs, assets, packages, or settings.
- `implementationState`: Implemented, Prototype default, Mocked, Deferred, Cut, Needs design confirmation, Needs technical confirmation.
- `validationState`: Not run, Passed, Failed, Blocked, Pending Unity, Pending user decision.
- `nextActions`: specific next steps.

This makes the bridge useful for game creation instead of merely exposing Unity calls.

## 6. Capability Tool Families

### 6.1 Project Understanding

Purpose:

- Let AInvil understand the Unity project before choosing implementation actions.

Representative and planned tools:

- `unity_get_status`
- `unity_get_hierarchy`
- `unity_get_game_object`
- `unity_find_assets`
- `unity_list_scenes`
- `unity_list_packages`
- `unity_get_project_settings`
- `unity_get_build_settings`
- `unity_get_tags_layers`
- `unity_get_console_logs`
- `unity_compile_status`

Game-making use:

- Determine what already exists.
- Avoid duplicate scenes, scripts, prefabs, and managers.
- Identify missing packages or settings required by the design.

### 6.2 Milestone Scene Construction

Purpose:

- Build the smallest playable scene matching the current milestone.

Representative and planned tools:

- `unity_create_game_object`
- `unity_create_asset_based_object`
- `unity_create_asset_based_layout`
- `unity_set_game_object`
- `unity_add_component`
- `unity_set_component_property`
- `unity_assign_object_reference`
- `unity_save_scene`
- `unity_create_scene`
- `unity_validate_scene_contract`

Game-making use:

- Create player, enemies, pickups, buildings, interactables, managers, cameras, lighting, UI roots, and debug hooks according to scene blueprints.

### 6.3 Asset-First Implementation

Purpose:

- Prevent prototypes from ignoring useful project assets or replacing game-facing objects with plain text.

Representative and planned tools:

- `unity_find_assets`
- `unity_create_prefab_instance`
- `unity_create_asset_based_object`
- `unity_create_asset_based_layout`
- `unity_create_asset_grid_ui`
- `unity_get_asset_info`
- `unity_get_asset_dependencies`
- `unity_get_asset_preview`

Game-making use:

- Use existing prefabs, sprites, models, materials, audio, animation clips, and UI prefabs before creating fallback primitives or generated UI.

### 6.4 Script and Component Realization

Purpose:

- Turn component contracts into Unity scripts and configured components.

Representative and planned tools:

- `unity_get_component_schema`
- `unity_add_component`
- `unity_remove_component`
- `unity_set_component_property`
- `unity_assign_object_reference`
- `unity_generate_component_script`
- `unity_validate_component_contract`

Game-making use:

- Keep script responsibilities aligned with technical design.
- Avoid large mixed-responsibility scripts.
- Validate serialized fields and scene references.

### 6.5 Prefab Production

Purpose:

- Turn repeated or spawnable gameplay objects into reusable prefabs.

Representative and planned tools:

- `unity_create_prefab_instance`
- `unity_open_prefab_stage`
- `unity_get_prefab_info`
- `unity_apply_prefab_overrides`
- `unity_revert_prefab_overrides`
- `unity_create_prefab_from_object`
- `unity_create_prefab_variant`
- `unity_validate_prefab_contract`

Game-making use:

- Support enemies, projectiles, pickups, UI cells, buildings, doors, interactables, and other repeated content.

### 6.6 Package and Project Setup

Purpose:

- Enable Unity packages and settings only when the design requires them.

Planned tools:

- `unity_list_packages`
- `unity_search_package`
- `unity_add_package`
- `unity_remove_package`
- `unity_get_package_errors`
- `unity_get_project_settings`
- `unity_set_project_settings`
- `unity_get_tags_layers`
- `unity_set_tags_layers`
- `unity_get_build_settings`
- `unity_set_build_settings`

Game-making use:

- Install TextMeshPro for production UI text.
- Install Input System for action maps.
- Install Cinemachine for camera behavior.
- Install AI Navigation for agent movement.
- Install 2D Tilemap for tile-based games.
- Install Timeline or VFX Graph only when the design requires them.

### 6.7 UI and Player Feedback

Purpose:

- Build game-facing UI and feedback systems from the design.

Representative and planned tools:

- `unity_create_asset_grid_ui`
- `unity_click_ui_button`
- `unity_get_ui_text`
- `unity_create_canvas`
- `unity_create_ui_panel`
- `unity_create_ui_button`
- `unity_create_tmp_text`
- `unity_set_ui_layout`
- `unity_validate_ui_contract`
- `unity_create_audio_event`
- `unity_configure_audio_mixer`

Game-making use:

- Implement inventory, shop, HUD, pause menu, dialogue, card grids, status panels, and feedback cues.

### 6.8 Input and Playability

Purpose:

- Map input specs to actual gameplay behavior and validate it in Play Mode.

Representative and planned tools:

- `unity_send_key_event`
- `unity_click_ui_button`
- `unity_get_debug_state`
- `unity_probe_validation_observation`
- `unity_create_input_test_bridge`
- `unity_input_test_bridge`
- `unity_get_input_actions`
- `unity_create_input_actions_asset`
- `unity_set_input_binding`
- `unity_validate_input_spec`

Game-making use:

- Confirm the user can control the prototype, interact with UI, trigger abilities, pause, select items, and complete the core loop.

### 6.9 Genre and Content Systems

Purpose:

- Use specialized Unity systems when the game design calls for them.

Planned capability groups:

- Animation: clips, controllers, blend trees, transitions, avatars, sprite animation, Timeline hooks.
- Camera: Camera, Cinemachine, follow rigs, framing, split-screen when required.
- Rendering: URP/HDRP checks, render settings, post-processing, materials.
- Physics: colliders, rigidbodies, joints, collision matrix, character movement.
- Navigation: NavMeshSurface, NavMeshAgent, areas, links, bake validation.
- 2D and tilemap: sprites, tile palettes, tilemaps, 2D colliders.
- Terrain: terrain data, brushes, layers, trees, details.
- Particles and VFX: ParticleSystem modules, VFX Graph package detection.
- Lighting: lights, skybox, reflection probes, light probes, bake settings.

Game-making use:

- Select only the systems that serve the current GDD and milestone.

### 6.10 Validation, Build, and Performance

Purpose:

- Prove that the implementation works or identify exactly why it does not.

Validation Design probe RPC details are specified in `Unity_Bridge_Validation_Probe_RPC_Technical_Spec.md`. That document covers the immediate bridge work for `unity_get_ui_text`, `unity_get_debug_state`, richer `unity_click_ui_button`, safer `unity_invoke_component_method`, and optional `unity_probe_validation_observation`.

Representative and planned tools:

- `unity_run_editor_tests`
- `unity_run_playmode_tests`
- `unity_capture_game_view`
- `unity_capture_scene_view`
- `unity_validate_scene_contract`
- `unity_validate_component_contract`
- `unity_validate_prefab_contract`
- `unity_build_player`
- `unity_get_last_build_report`
- `unity_get_frame_timing`
- `unity_get_profiler_summary`

Game-making use:

- Validate compile state, console state, scene structure, references, input behavior, playable loop, build readiness, and performance risk.

## 7. RPC Result Contract

High-level workflow results should return:

- `ok`.
- `workflow`.
- `capabilityGroups`.
- `sourceGoal`.
- `documentRefs`.
- `unityTargets`.
- `plannedOperations`.
- `appliedOperations`.
- `validationResults`.
- `documentSync`.
- `warnings`.
- `error`.

Low-level Unity tools should still return:

- `ok`.
- `tool`.
- `capabilityVersion`.
- `data`.
- `warnings`.
- `error`.

Structured errors should include:

- `code`.
- `message`.
- `domain`.
- `retryable`.
- `requiresUserConfirmation`.
- `suggestedNextAction`.

## 8. Dry-Run and Confirmation Contract

Risky tools and workflows should accept:

- `dryRun`.
- `confirmToken`.
- `allowedPaths`.
- `userGoal`.
- `documentRefs`.

Dry-run output should include:

- Why the operation is needed for the game goal.
- Which documents justify the operation.
- Planned Unity operations.
- Affected assets, scenes, packages, settings, or scripts.
- Expected validation steps.
- Required document updates.

## 9. Capability Versioning

The bridge status response should include:

- semantic package version.
- capability version.
- supported low-level tools.
- supported high-level workflows.
- supported capability groups.
- Unity version.
- installed package summary.
- known validation limitations.

The MCP server should reject or warn on workflows that require missing bridge capabilities.

## 10. Implementation Sequence

1. Add capability registry metadata to the MCP server and Unity bridge.
2. Add traceability fields to high-level AInvil workflow outputs.
3. Add `ainvil_plan_unity_changes` as a logical planning workflow.
4. Add Package Manager and Project Settings tools because many design-driven workflows depend on them.
5. Add deeper AssetDatabase and Prefab tools to support asset-first implementation.
6. Add UI and TextMeshPro workflows for game-facing interfaces.
7. Add Input System workflows for documented controls and Play Mode validation.
8. Add scene, component, and prefab contract validators.
9. Add camera, physics, audio, lighting, navigation, 2D, terrain, animation, and VFX workflows based on genre needs.
10. Add build, screenshot, test, and profiling workflows.
11. Expose dry-run previews and validation reports in the future AInvil Desktop App.
12. Export the same logical schemas through provider-neutral adapters.

## 11. Acceptance Criteria

- Unity capability expansion is tied to user goals and AInvil documents.
- New tools state the game-making outcome they support.
- High-level workflows return traceability and document sync instructions.
- Existing low-level tools remain available for direct inspection and fallback.
- Risky operations support dry-run and explicit confirmation.
- Validation covers compile, console, scene, references, input, Play Mode, and build state where relevant.
- AInvil can report which design requirements are implemented, mocked, pending, blocked, or unvalidated.
- Static plugin validation passes.
- Unity live validation exists for representative workflows or the validation gap is documented.
