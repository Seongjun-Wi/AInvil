# AInvil Harness Engineering

## 1. Purpose

The AInvil harness verifies that the plugin supports goal-driven Unity game creation, not just isolated tool calls.

The harness should evaluate whether AInvil can move from a user goal to documented design, technical planning, Unity implementation targets, Play Mode validation, and document synchronization.

## 2. Harness Model

```text
User Goal
  GDD / Feature Spec
    Technical Design
      TaskGraph / ProjectState
        UnityChangeSet
          Unity Scene / Assets / Scripts / Prefabs / Packages
            Play Mode Validation
              Playtest Report
                Document Sync
```

The harness is intentionally layered. Static checks run without Unity. Live checks run when Unity Editor and Unity Bridge are available.

## 3. Harness Layers

### 3.1 Static Plugin Harness

Purpose:

- Confirm plugin structure, manifest, skills, templates, schemas, MCP config, Unity package files, provider-neutral core modules, and harness assets exist.

Implemented by:

- `scripts/validate-ainvil-plugin.mjs`
- `scripts/validate-ainvil-harness.mjs`

### 3.2 Document Traceability Harness

Purpose:

- Confirm every scenario links the user goal to expected AInvil documents and validation artifacts.
- Prevent implementation-only changes that are not grounded in GDD, technical design, task graph, input spec, or validation reports.

Required scenario evidence:

- GDD or feature spec requirement.
- Technical design requirement.
- TaskGraph task.
- UnityChangeSet expectation.
- Input spec or playtest validation when the scenario is interactive.

### 3.3 Unity Capability Harness

Purpose:

- Confirm the scenario uses Unity capabilities because they serve the game goal.
- Prevent raw API coverage from replacing goal-driven implementation.

Required scenario evidence:

- Project inspection.
- Asset-first decision when visible game objects or UI content are created.
- Scene, component, prefab, package, input, UI, animation, camera, physics, or validation capabilities selected as needed.
- Dry-run or confirmation flag for risky operations.

### 3.4 Play Mode Interaction Harness

Purpose:

- Confirm interactive scenarios define how Input Agent validates the prototype.
- Confirm Play Mode validation is expected when gameplay behavior is claimed.

Required scenario evidence:

- Input action or UI interaction.
- Runtime validation path.
- Expected result.
- Failure classification.

### 3.5 Scenario Harness

Purpose:

- Evaluate end-to-end game-making slices.
- Keep scenarios small, playable, and directly tied to common user goals.

Initial scenario set:

- Top-down collectible prototype.
- Inventory grid UI prototype.
- Character animation binding prototype.

## 4. Scenario Requirements

Each scenario must include:

- `schemaVersion`.
- `id`.
- `title`.
- `userGoal`.
- `milestone`.
- `expectedDocuments`.
- `expectedUnityCapabilities`.
- `expectedUnityArtifacts`.
- `validationChecks`.
- `passCriteria`.

Each expected Unity artifact should include:

- `kind`.
- `path`.
- `requirementRef`.
- `status`.

Each validation check should include:

- `id`.
- `type`.
- `target`.
- `expected`.
- `failureClass`.

## 5. Live Unity Harness

The live runner uses the same scenario fixtures as the static harness.

Implemented runner:

- `scripts/run-ainvil-live-harness.mjs`

Modes:

- `probe`: non-mutating bridge, compile, console, hierarchy, and artifact probes.
- `apply`: may create `AInvilInputTestBridge`, enter Play Mode, send input, and exit Play Mode.

Live harness steps:

1. Confirm `/health`.
2. Confirm `unity_get_status`.
3. Capture compile status.
4. Capture console errors.
5. Capture hierarchy access.
6. Probe expected scenario artifacts.
7. In apply mode, run interactive input bridge checks for interactive scenarios.
8. Emit a JSON harness report.

The runner should produce `Blocked` rather than a misleading failure when Unity Editor or Unity Bridge is unavailable.

## 6. Acceptance Criteria

- Static plugin validation includes harness assets.
- Harness scenarios parse and pass structural checks.
- Each scenario has document traceability.
- Each scenario names game-making Unity capabilities instead of raw API lists.
- Interactive scenarios contain Play Mode or input validation checks.
- Risky operations are represented as dry-run or confirmation-gated.
- The harness can fail clearly with actionable messages.
