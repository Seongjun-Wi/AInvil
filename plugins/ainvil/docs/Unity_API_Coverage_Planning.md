# Unity Capability Planning for Goal-Driven Game Creation

## 1. Purpose

This document defines how AInvil should use Unity APIs to turn the user's game goal, GDD, technical design, scene blueprints, component contracts, prefab contracts, input specs, and validation reports into a playable Unity game.

Unity API coverage is a means, not the product goal. AInvil should not expose APIs just because Unity supports them. AInvil should expose and compose Unity capabilities when they help the system understand the design, implement the game, validate the result, and keep documents synchronized.

## 2. Product Objective

AInvil exists to help a user make a Unity game from design intent.

The Unity Bridge expansion should therefore optimize for:

- Converting the GDD into concrete Unity tasks.
- Choosing Unity features that fit the user's game genre and mechanics.
- Creating scenes, objects, components, assets, prefabs, input maps, UI, and validation hooks that match the technical design.
- Keeping design documents and Unity project state aligned.
- Letting the user inspect and approve risky changes.
- Making each iteration playable and testable.

## 3. Capability Definition

A Unity capability is useful to AInvil only when it supports at least one production-loop step:

- Read design intent.
- Translate intent into implementation requirements.
- Inspect the current Unity project.
- Select the right Unity feature, package, asset, or fallback.
- Apply a scoped implementation change.
- Validate the result in Editor or Play Mode.
- Report the result back to the GDD, technical design, registry, contracts, or open questions.

Capabilities should be grouped by game-making outcome rather than by raw Unity namespace.

## 4. Full Production Loop

Unity capabilities should support this loop:

1. Read the user's request, GDD, technical design, input spec, registry, scene blueprint, component contracts, and prefab contracts.
2. Identify the next playable milestone.
3. Determine which Unity domains are required for that milestone.
4. Inspect the current Unity project before editing.
5. Search existing project assets before creating fallback objects.
6. Install or enable official Unity packages only when the milestone requires them.
7. Create or update scenes, prefabs, scripts, data assets, UI, input actions, and settings.
8. Validate compile state, console state, scene structure, references, input behavior, and Play Mode behavior.
9. Classify failures by design, implementation, input, bridge, package, setting, or Unity runtime cause.
10. Sync discoveries and implementation state back into documents.

## 5. Capability Groups

| Capability group | Game-making purpose | Current status | Priority |
| --- | --- | --- | --- |
| Design-to-Unity traceability | Link GDD requirements to Unity objects, assets, components, tests, and validation state. | Partial | P0 |
| Project inspection | Understand scenes, assets, packages, settings, scripts, prefabs, console state, and Play Mode state before planning changes. | Partial | P0 |
| Milestone planning | Choose the smallest playable implementation step from the user's goal and documents. | Planned | P0 |
| Asset-first construction | Use existing project assets before fallback primitives or generated UI. | Partial | P0 |
| Scene construction | Build scene hierarchy, gameplay roots, managers, cameras, lighting, world objects, UI roots, and debug hooks. | Partial | P0 |
| Component and script implementation | Create or configure components that match component contracts and technical design ownership. | Partial | P0 |
| Prefab production | Create, instantiate, validate, and maintain prefabs according to prefab contracts. | Partial | P0 |
| Package enablement | Install official Unity packages when required by the design, such as Input System, TextMeshPro, Cinemachine, AI Navigation, Timeline, or 2D Tilemap. | Planned | P0 |
| Project settings | Apply project-wide settings only when required by the design or package workflow. | Planned | P0 |
| UI implementation | Build usable game-facing UI from design, not plain text lists unless explicitly requested. | Partial | P1 |
| Input implementation | Map input specs to legacy input, New Input System actions, UI buttons, and runtime validation hooks. | Partial | P1 |
| Animation and character behavior | Bind animation assets and controllers to characters, enemies, NPCs, and interactables. | Partial | P1 |
| Camera and presentation | Configure cameras, Cinemachine, rendering, lighting, post-processing, and view framing according to game genre. | Planned | P1 |
| Physics and interaction | Configure colliders, rigidbodies, character movement, triggers, joints, and collision layers that support mechanics. | Planned | P1 |
| Audio feedback | Add audio sources, mixers, snapshots, and event hooks for game feedback. | Planned | P2 |
| Navigation and AI | Configure NavMesh, agents, links, areas, and movement validation when the game requires AI movement. | Planned | P2 |
| 2D, tilemap, terrain, particles, VFX | Use specialized Unity systems when they fit the intended game format. | Planned | P2 |
| Build and release validation | Configure build targets, build settings, reports, tests, screenshots, and failure classification. | Planned | P2 |
| Performance validation | Collect frame timing, profiler summaries, memory signals, and scene complexity warnings. | Planned | P3 |

## 6. Decision Rules

Before using a Unity API, AInvil should ask:

- Which user goal or document requirement does this serve?
- Which playable milestone does this move forward?
- Is there an existing project convention or asset that should be reused?
- Is this change safe to apply automatically?
- Does this change require a dry-run preview or user confirmation?
- Which document must be updated after this change?
- How will the result be validated?

A Unity API should be deferred if it does not serve the current goal, creates broad project risk, or cannot be validated.

## 7. Tool Design Principles

- Prefer goal-oriented tools over raw API mirrors.
- Keep low-level bridge tools available for inspection and fallback.
- Compose low-level tools into high-level workflows such as `create playable inventory`, `create controllable player`, `set up enemy navigation`, or `validate core loop`.
- Return document traceability with each significant result.
- Make dry-run output readable by the future AInvil GUI.
- Use capability versioning so agents know which workflows are available.
- Keep package installs, project settings changes, asset deletion, render pipeline switches, and build target switches explicit.

## 8. Safety Boundaries

The following operations must require dry-run review or explicit confirmation:

- Deleting or overwriting assets.
- Removing packages.
- Switching render pipelines.
- Switching build targets or platform modules.
- Changing project-wide input, graphics, quality, physics, player, tags, or layer settings.
- Running builds that write outside approved workspace paths.
- Importing external assets.
- Changing source control settings.

Asset Store browsing or importing is not part of the default workflow. AInvil may document recommendations only when explicitly asked, and automatic import should remain disabled unless a future approved connector is designed.

## 9. Roadmap

### Phase 0: Align Existing Bridge With AInvil Workflow

Status: partial.

- Keep current scene, object, component, asset, prefab, animation, input, console, compile, and Play Mode tools.
- Ensure every implemented tool reports which document requirement or validation target it serves when used by AInvil workflows.
- Update Unity Agent guidance so API usage is selected by milestone requirements.

### Phase 1: Requirement Traceability and Milestone Execution

Add the missing glue between documents and Unity operations.

Expected outcomes:

- GDD features map to technical design tasks.
- Technical design tasks map to scene objects, scripts, prefabs, input actions, packages, and tests.
- Unity changes update registry entries, contracts, and validation status.
- AInvil can answer which parts of the design are implemented, mocked, pending, or blocked.

### Phase 2: Essential Unity Capability Enablement

Add Package Manager, Project Settings, Tags/Layers, Build Settings, and deeper AssetDatabase support.

Expected outcomes:

- AInvil can install official Unity packages only when required by the user's design.
- AInvil can explain why a package or setting is needed before changing the project.
- Package and settings changes are reflected in technical design and validation reports.

### Phase 3: Playable Prototype Domains

Add deeper UI, input, physics, camera, audio, lighting, and prefab workflows.

Expected outcomes:

- AInvil can create genre-appropriate playable prototypes instead of generic object dumps.
- Input Agent can validate documented actions in Play Mode.
- Unity Agent can build scenes that communicate gameplay clearly through assets, layout, camera, UI, and feedback.

### Phase 4: Specialized Game Systems

Add navigation, terrain, 2D, tilemap, particles, VFX, advanced animation, Timeline, and Cinemachine workflows when required by the game design.

Expected outcomes:

- AInvil can support common game genres with the right Unity systems.
- Specialized systems remain opt-in based on the GDD and technical design.

### Phase 5: Build, Test, Performance, and GUI Review

Add build pipeline, test runner, screenshots, frame checks, profiler summaries, dry-run previews, and GUI review panels.

Expected outcomes:

- The future AInvil Desktop App can show document traceability, planned Unity changes, package changes, setting changes, validation results, and unresolved design questions.
- Codex, other LLM providers, and the desktop GUI use the same logical capability model.

## 10. Acceptance Criteria

For each new Unity capability:

- It states which game-making outcome it supports.
- It maps to at least one AInvil document type or validation artifact.
- It has an inspect path before mutation.
- It has validation behavior.
- Risky operations support dry-run and explicit confirmation.
- It returns structured errors and suggested next actions.
- It updates or references the project registry, scene blueprint, component contract, prefab contract, input spec, technical design, or validation report.
- Static plugin validation passes.
- Unity live validation exists or the validation gap is documented.
