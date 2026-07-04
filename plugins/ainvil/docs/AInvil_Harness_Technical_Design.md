# AInvil Harness Technical Design

## 1. Scope

This document defines the first implementation of the AInvil harness.

The initial harness is static and dependency-free. It validates the presence and structure of harness documents, schemas, scripts, and scenario fixtures. It also verifies that scenario fixtures represent AInvil's goal-driven production loop.

## 2. Files

```text
docs/
  AInvil_Harness_Engineering.md
  AInvil_Harness_Technical_Design.md
harness/
  README.md
  scenarios/
    top_down_collectible.json
    inventory_grid_ui.json
    character_animation_binding.json
schemas/
  harness_scenario.schema.json
scripts/
  validate-ainvil-harness.mjs
  run-ainvil-live-harness.mjs
```

## 3. Validator Responsibilities

`validate-ainvil-harness.mjs` should:

- Confirm harness docs exist.
- Confirm the harness scenario schema exists and parses.
- Confirm the scenario directory exists.
- Parse every scenario JSON file.
- Validate required scenario fields.
- Validate expected document references.
- Validate expected Unity capability groups.
- Validate expected Unity artifacts.
- Validate validation checks.
- Enforce Play Mode or input validation for interactive scenarios.
- Emit clear error messages.

## 4. Scenario Schema

The JSON schema documents the scenario contract for future provider adapters and desktop GUI use. The current validator performs manual checks to avoid adding external dependencies.

Core fields:

- `schemaVersion`.
- `id`.
- `title`.
- `userGoal`.
- `milestone`.
- `interactive`.
- `riskLevel`.
- `expectedDocuments`.
- `expectedUnityCapabilities`.
- `expectedUnityArtifacts`.
- `validationChecks`.
- `passCriteria`.

## 5. Capability Groups

Allowed capability groups:

- `Project inspection`.
- `Document traceability`.
- `Milestone planning`.
- `Asset-first construction`.
- `Scene construction`.
- `Component and script implementation`.
- `Prefab production`.
- `Package enablement`.
- `Project settings`.
- `UI implementation`.
- `Input implementation`.
- `Animation and character behavior`.
- `Camera and presentation`.
- `Physics and interaction`.
- `Audio feedback`.
- `Navigation and AI`.
- `2D, tilemap, terrain, particles, and VFX`.
- `Build and release validation`.
- `Performance validation`.
- `Document synchronization`.

## 6. Validation Types

Allowed validation types:

- `Static`.
- `Compile`.
- `Console`.
- `Scene`.
- `Asset`.
- `Prefab`.
- `Component`.
- `Input`.
- `PlayMode`.
- `UI`.
- `Animation`.
- `Build`.
- `DocumentSync`.

## 7. Failure Classes

Allowed failure classes:

- `DesignTraceMissing`.
- `TechnicalPlanMissing`.
- `UnityArtifactMissing`.
- `AssetFallbackIncorrect`.
- `InputNotReceived`.
- `GameLogicFailed`.
- `BridgeDisconnected`.
- `PreconditionFailed`.
- `ConsoleError`.
- `CompileError`.
- `PackageMissing`.
- `SettingsMismatch`.
- `ValidationNotRun`.
- `Unknown`.

## 8. Plugin Validator Integration

`validate-ainvil-plugin.mjs` should include harness assets in its required file checks. The dedicated harness validator remains separate so it can be run directly in CI or by the future desktop app.

## 9. Future Live Harness

The static scenario format is also the input to the live runner.

Implemented live runner:

- `scripts/run-ainvil-live-harness.mjs`

Modes:

- `probe`: non-mutating bridge checks.
- `apply`: may create `AInvilInputTestBridge`, enter Play Mode, send input, and exit Play Mode.

Live runner outputs:

- scenario id.
- Unity Bridge status.
- compile result.
- console result.
- hierarchy snapshot.
- input validation result.
- expected artifact probes.
- pass/fail summary.

Future live runner expansion:

- Apply full UnityChangeSet plans.
- Capture playtest report markdown.
- Capture document sync diffs.
- Execute scenario-specific game logic assertions.
