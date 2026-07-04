# AInvil Playability Validation Technical Plan

## 1. Purpose

This document defines how AInvil technically validates Unity playability.

The goal is to move beyond editor inspection and prove whether a requirement-backed gameplay loop actually works in Play Mode, with evidence that can be linked back to requirements, acceptance criteria, Unity targets, and Production State Graph nodes.

## 2. Validation Principle

AInvil validates playability through this chain:

```text
Requirement
  -> BDD Acceptance Criteria
  -> Unity Target
  -> Play Mode Setup
  -> Player or Debug Action
  -> Runtime State Observation
  -> Pass / Fail / Blocked Classification
  -> ValidationEvidence
  -> Traceability / Dashboard / Next Action
```

A feature is not `Validated` because objects exist. A feature is validated only when Play Mode or runtime evidence proves the expected behavior at the required validation level.

## 3. Validation Levels

| level | meaning | required evidence |
| --- | --- | --- |
| `Unity Inspection` | Required scenes, objects, components, and references are inspectable. | Hierarchy, GameObject, component, asset, or prefab checks. |
| `Compile Verified` | Unity reports no compile errors for the project state under test. | `unity_compile_status` and console review. |
| `Play Mode Verified` | Scene can enter Play Mode and required validation harness objects are available. | Play Mode enter/exit, bridge reconnect, setup hook success. |
| `Runtime Tested` | A documented action changes runtime state according to acceptance criteria. | Before/after state, action trace, observed result, console state. |
| `User Confirmed` | User confirms player-facing feel or subjective behavior. | User confirmation linked to evidence and remaining gaps. |

Validation levels are cumulative only when evidence exists for each layer. `Compile Verified` does not imply `Runtime Tested`.

## 4. Control Surfaces

Detailed Validation Design probe RPC planning is tracked in `Unity_Bridge_Validation_Probe_RPC_Technical_Spec.md`. That spec defines how `click`, `invoke`, `textValue`, and `DebugStateProbe` map to Unity Bridge RPCs and validation evidence.

### 4.1 Unity Bridge MCP Tools

Use these for editor and runtime control:

| tool | use |
| --- | --- |
| `unity_get_status` | Check editor, scene, compile, selection, play mode state. |
| `unity_compile_status` | Confirm compilation before Play Mode validation. |
| `unity_get_console_logs` | Detect errors before and after validation. |
| `unity_get_hierarchy` | Verify required scene hierarchy. |
| `unity_get_game_object` | Inspect object/component state. |
| `unity_enter_play_mode` | Enter Play Mode. |
| `unity_exit_play_mode` | Exit Play Mode. |
| `unity_create_input_test_bridge` | Create/select repeatable validation bridge. |
| `unity_input_test_bridge` | Press keys, click UI paths, invoke setup hook, get trace. |
| `unity_send_key_event` | Send keyboard input when Game View input is required. |
| `unity_click_ui_button` | Invoke UI Button interaction. |
| `unity_invoke_component_method` | Invoke setup/debug/state-inspection hooks. |
| `unity_get_ui_text` | Read UI text for `textValue` observations. |
| `unity_get_debug_state` | Read project-defined debug state for `DebugStateProbe`. |
| `unity_probe_validation_observation` | Dispatch one Validation Design observation to the correct probe RPC. |

### 4.2 Runtime Validation Bridge

`AInvilInputTestBridge` is the preferred repeatable control point when a scenario needs deterministic validation.

It should support:

- Input trace capture.
- Key press/release.
- UI path click.
- Setup hook invocation.
- Debug state query.
- Trace clearing before each run.

Debug hooks must support validation setup and observation. They must not silently replace player-facing input validation unless the acceptance criterion is debug-only.

## 5. Validation Modes

### 5.1 Probe Mode

Probe mode verifies readiness without claiming gameplay success.

Pipeline:

1. Check Unity Bridge health.
2. Read Unity status.
3. Check compile status.
4. Read console logs.
5. Inspect hierarchy.
6. Probe required scene/assets/objects/components/UI.
7. Export evidence.

Possible outcomes:

| outcome | meaning |
| --- | --- |
| `Passed` | All readiness checks passed. |
| `Failed` | Required artifacts exist partially but some checks fail. |
| `Blocked` | Unity Bridge, compile, or prerequisite state prevents validation. |

Probe mode can reach `Compile Verified` or `Unity Inspection`, but not full `Runtime Tested`.

### 5.2 Apply Mode

Apply mode performs Play Mode validation.

Pipeline:

1. Run probe prechecks.
2. Create or select `AInvilInputTestBridge`.
3. Clear previous input trace.
4. Enter Play Mode.
5. Wait for bridge reconnect and scene readiness.
6. Invoke setup hook if needed.
7. Capture `Before` state.
8. Perform documented player input or debug action.
9. Wait for deterministic result window.
10. Capture `After` state.
11. Read console logs.
12. Exit Play Mode.
13. Classify result.
14. Export validation evidence.

Apply mode can reach `Play Mode Verified` or `Runtime Tested`.

## 6. Observation Strategy

AInvil should not rely only on visual inspection. It needs machine-readable state.

Preferred observation methods, in order:

1. Public debug method returning JSON state, for example `GetDebugState()`.
2. Component field/property inspection through `unity_get_game_object`.
3. UI text/state inspection when available.
4. Console logs only when explicitly designed as validation output.
5. Screenshot or visual evidence only as supplemental evidence.

For each test, evidence should record:

| field | example |
| --- | --- |
| `before` | player position, score, coin active state |
| `action` | press W for 0.5 seconds, invoke setup hook, click button |
| `after` | player position changed, coin inactive, score increased |
| `expected` | score increases by 1 after collection |
| `actual` | score changed from 0 to 1 |
| `result` | Passed |

## 7. Debug Hook Contract

Unity gameplay components used in AInvil validation should expose small debug hooks when deterministic validation is needed.

Recommended methods:

```csharp
public void ResetRun();
public void SetPlayerPosition(Vector3 position);
public void SetCoinPosition(Vector3 position);
public void SimulateCollectCoin();
public string GetDebugStateJson();
```

Recommended debug state shape:

```json
{
  "player": {
    "position": { "x": 0, "y": 0, "z": 0 },
    "isAlive": true
  },
  "score": {
    "value": 0
  },
  "collectibles": [
    {
      "id": "Coin_001",
      "active": true,
      "collected": false
    }
  ],
  "inputTrace": []
}
```

Debug hooks should live in validation/debug components or clearly marked prototype components. Production code should not depend on AInvil-specific debug behavior unless the project intentionally keeps it.

## 8. Failure Classification

Use these failure classes:

| class | condition | next owner |
| --- | --- | --- |
| `BridgeDisconnected` | Unity Bridge health or RPC unavailable. | Unity Agent / User setup |
| `CompileError` | Project cannot compile. | Unity Agent |
| `ConsoleError` | Runtime or editor console contains blocking errors. | Unity Agent |
| `ArtifactMissing` | Required scene, object, component, UI, or asset is missing. | Unity Agent |
| `PreconditionFailed` | Scene exists but setup state is invalid. | Unity Agent / Input Agent |
| `InputNotReceived` | Input was sent but no input trace or state response occurred. | Input Agent / Unity Agent |
| `GameLogicFailed` | Input was received but expected gameplay state did not happen. | Unity Agent |
| `UIStateFailed` | Gameplay state changed but UI did not reflect it. | Unity Agent |
| `ValidationNotRun` | Play Mode or runtime portion was skipped. | Input Agent |
| `Unknown` | Evidence is insufficient. | Orchestrator |

Failures should preserve the highest validation level achieved. For example, a missing player object can still be `Compile Verified` if compile and bridge checks passed.

## 9. Evidence Contract

Each playability validation run should emit:

```text
validation/evidence/EVID-<scenario-or-acceptance>-latest.json
```

Minimum fields:

| field | description |
| --- | --- |
| `schemaVersion` | `1.0.0`. |
| `evidenceId` | Unique evidence ID. |
| `source` | `LiveHarness`, `UnityBridge`, or `ManualPlaytest`. |
| `scenarioId` | Harness scenario ID when available. |
| `featureIds` | Related `FEAT-*` IDs. |
| `requirementIds` | Related `REQ-*` IDs. |
| `taskIds` | Related `TASK-*` IDs. |
| `acceptanceIds` | Related `AC-*` IDs. |
| `inputIds` | Related `INPUT-*` IDs. |
| `validationLevel` | Highest achieved validation level. |
| `status` | `Passed`, `Failed`, `Blocked`, `Warning`, or `NotRun`. |
| `failureClass` | Failure class or `None`. |
| `unityTargets` | Scene, object, component, UI, or asset paths. |
| `checks` | Structured checks and results. |
| `beforeState` | Machine-readable state before action when available. |
| `actions` | Input/debug actions performed. |
| `afterState` | Machine-readable state after action when available. |
| `console` | Relevant console errors/warnings. |
| `remainingGaps` | Known untested areas. |
| `nextActions` | Follow-up work. |

Evidence must be honest. If player input was not tested, the evidence must say so.

## 10. Top Down Collectible Validation Plan

Scenario:

```text
scenario.top_down_collectible
```

### 10.1 Required Unity Targets

| target | requirement |
| --- | --- |
| `Assets/Scenes/TopDownCollectible.unity` | Scene exists and can open. |
| `/Player` | Player object exists. |
| `/Player/PlayerController` | Movement component exists. |
| `/Collectibles/Coin_001` | Collectible object exists. |
| `/UI/HUD/ScoreText` | Score UI exists. |
| `/Debug/AInvilInputTestBridge` | Validation bridge exists. |

### 10.2 Probe Checks

| check | expected |
| --- | --- |
| bridge health | RPC reachable. |
| compile status | No compile errors. |
| console status | No blocking errors. |
| hierarchy | Required objects exist. |
| component schema | Required components are inspectable. |
| UI object | Score UI exists and is active. |

### 10.3 Apply Checks

Preferred deterministic path:

1. Enter Play Mode.
2. Clear input trace.
3. Invoke `ResetRun`.
4. Capture state: score is 0, coin is active.
5. Move player using WASD or invoke `SetPlayerPosition` near coin.
6. Perform player movement or `SimulateCollectCoin`.
7. Capture state: score is 1, coin is collected or inactive.
8. Verify ScoreText reflects score.
9. Read console logs.
10. Export evidence.

Pass criteria:

- Compile check passed.
- Play Mode entered successfully.
- Before state captured.
- Action performed.
- After state proves score increased.
- Coin state changed to collected/inactive.
- No blocking console errors.

Partial pass criteria:

- Debug hook proves score logic, but real WASD input is not tested.
- Evidence status should be `Warning` or `Failed` depending on acceptance requirement.
- Remaining gap should say player input was not validated.

## 11. Harness Enhancements

`scripts/run-ainvil-live-harness.mjs` should support:

| option | behavior |
| --- | --- |
| `--scenario <id>` | Run one scenario. |
| `--mode probe` | Readiness checks only. |
| `--mode apply` | Play Mode validation. |
| `--evidence-out <path>` | Write validation evidence. |
| `--acceptance <id>` | Link evidence to an acceptance criterion. |
| `--requirement <id>` | Link evidence to a requirement. |
| `--timeout-ms <number>` | Bound Play Mode waits. |
| `--retry <number>` | Retry unstable runtime checks. |

Apply mode should fail safely:

- Always try to exit Play Mode after runtime checks.
- Preserve evidence even when a later cleanup step fails.
- Do not promote validation level after a failed precondition.

## 12. Graph And Sync Integration

After evidence export:

1. Add or update a `ValidationEvidence` graph node.
2. Link evidence to the related `AcceptanceCriterion` with `validates`.
3. Update traceability view.
4. Update project dashboard.
5. Update next action.

Validation status rules:

| evidence status | graph effect |
| --- | --- |
| `Passed` + sufficient level | Acceptance can move toward `Validated`. |
| `Failed` | Acceptance remains `Needs validation`; create next action for owner. |
| `Blocked` | Task or validation node remains blocked with reason. |
| `Warning` | Partial coverage; do not mark validated. |

## 13. Validation Commands

Probe:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario scenario.top_down_collectible --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
node plugins\ainvil\scripts\validate-validation-evidence.mjs
```

Apply:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode apply --scenario scenario.top_down_collectible --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
node plugins\ainvil\scripts\validate-validation-evidence.mjs
node plugins\ainvil\scripts\generate-sync-report.mjs
node plugins\ainvil\scripts\generate-traceability-view.mjs
node plugins\ainvil\scripts\generate-project-dashboard.mjs
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
```

## 14. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PLAYVAL-001 | Unity Bridge is reachable. | Probe mode runs. | Compile, console, hierarchy, and artifact checks are recorded. |
| AC-PLAYVAL-002 | Required scene targets exist. | Apply mode runs. | Play Mode is entered and setup state is captured. |
| AC-PLAYVAL-003 | Player input is sent. | Runtime observation runs. | Evidence records whether input was received. |
| AC-PLAYVAL-004 | Collectible behavior occurs. | After state is captured. | Score and coin state are compared against expected results. |
| AC-PLAYVAL-005 | Validation fails. | Evidence exports. | Failure class and next owner are clear. |
| AC-PLAYVAL-006 | Validation passes. | Sync runs. | Traceability and dashboard reflect the validation evidence. |

## 15. Definition Of Done

This playability validation plan is implemented when:

- Probe mode can classify bridge, compile, console, hierarchy, and artifact readiness.
- Apply mode can enter Play Mode, perform actions, observe state, and export evidence.
- Evidence includes before/after state for at least one scenario.
- Failures are routed to Unity Agent, Input Agent, GDD Agent, or Orchestrator.
- Traceability and dashboard update from validation evidence.
- At least one vertical-slice acceptance criterion has `Runtime Tested` evidence.
