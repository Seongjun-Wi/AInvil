# Unity Bridge Validation Probe RPC Technical Spec

## 1. Purpose

This spec defines the Unity Bridge RPCs needed for AInvil Validation Design execution.

The goal is not to expose every Unity API. The goal is to let AInvil prove requirement-backed behavior with machine-readable evidence:

```text
Validation Design
  -> action RPC
  -> observation probe RPC
  -> passCriteria assertion
  -> ValidationEvidence
  -> traceability/dashboard status
```

This spec extends the current bridge around four missing or incomplete Validation Design surfaces:

- `click`
- `invoke`
- `textValue`
- `DebugStateProbe`

## 2. Current State

Already available in `CodexUnityBridgeServer.cs` and `mcp-server/server.mjs`:

| Validation Design concept | Existing RPC | Status |
| --- | --- | --- |
| `click` action | `unity_click_ui_button` | Exists, but needs richer result and validation-safe failure classes. |
| `invoke` action | `unity_invoke_component_method` | Exists, but should be constrained for debug/validation use. |
| input bridge debug state | `unity_input_test_bridge` with `getState` | Exists for `AInvilInputTestBridge` only. |
| component observation | `unity_get_game_object` | Exists and returns component list/serialized fields. |
| log observation | `unity_get_console_logs` | Exists. |

Gaps:

- `unity_get_ui_text` is implemented for `textValue` observations.
- `unity_get_debug_state` is implemented for `DebugStateProbe`.
- `unity_probe_validation_observation` is implemented as a normalized observation dispatcher.
- `unity_click_ui_button` records active/interactable/listener preflight state.
- `unity_invoke_component_method` supports validation-oriented `requirePlaying`, `debugOnly`, and `allowedMethodPrefixes`.
- Remaining gap: pointer-accurate EventSystem click simulation is not implemented; current button click invokes `Button.onClick`.

## 3. Design Principles

1. Validation probe RPCs must be evidence-first.
2. Observation RPCs should be read-only unless explicitly named as an action.
3. Actions can execute, but they must not be treated as validation success without assertions.
4. Runtime debug hooks must be explicit and project-owned.
5. Missing probes should produce structured failures, not silent `Passed` results.
6. Existing low-level RPCs remain available for compatibility.

## 4. Validation Design Mapping

### 4.1 Actions

| Validation Design action | Primary RPC | Notes |
| --- | --- | --- |
| `openScene` | `unity_open_scene` | Existing. Editor-only. |
| `enterPlayMode` | `unity_enter_play_mode` | Existing. Harness must wait for bridge reconnect. |
| `exitPlayMode` | `unity_exit_play_mode` | Existing. Cleanup should run best-effort. |
| `click` | `unity_click_ui_button` | Existing RPC, enrich result. |
| `pressKey` | `unity_send_key_event` or `unity_input_test_bridge` | Existing. Prefer input bridge for deterministic trace. |
| `wait` | Harness-side sleep | Existing in harness MVP. |
| `invoke` | `unity_invoke_component_method` | Existing RPC, constrain via debug method policy. |

### 4.2 Observations

| Validation Design observation | Primary RPC | Implementation status |
| --- | --- | --- |
| `activeScene` | `unity_get_status` | Existing. |
| `objectExists` | `unity_get_game_object` | Existing. |
| `objectActive` | `unity_get_game_object` | Existing. |
| `componentExists` | `unity_get_game_object` | Existing. |
| `textValue` | `unity_get_ui_text` | New RPC recommended. |
| `debugStateJson` | `unity_get_debug_state` | New RPC recommended. |
| `editorLogErrors` | `unity_get_console_logs` | Existing. |

## 5. RPC Specifications

### 5.1 `unity_click_ui_button`

Existing RPC. Keep name and input compatibility.

Input:

```json
{
  "targetPath": "/Canvas/MainMenu/StartButton",
  "requireActive": true,
  "requireInteractable": true,
  "includePreflight": true
}
```

Required fields:

- `targetPath`

Optional fields:

- `requireActive`: default `true`.
- `requireInteractable`: default `true`.
- `includePreflight`: default `true`.

Output:

```json
{
  "ok": true,
  "targetPath": "/Canvas/MainMenu/StartButton",
  "componentType": "UnityEngine.UI.Button",
  "isPlaying": true,
  "activeSelf": true,
  "activeInHierarchy": true,
  "interactable": true,
  "listenerCountKnown": true,
  "persistentListenerCount": 1,
  "clicked": true
}
```

Failure rules:

| condition | error code | failure class |
| --- | --- | --- |
| object missing | `GameObjectNotFound` | `ArtifactMissing` |
| Button missing | `ComponentNotFound` | `ArtifactMissing` |
| inactive and `requireActive` | `InactiveTarget` | `PreconditionFailed` |
| not interactable and `requireInteractable` | `ButtonNotInteractable` | `PreconditionFailed` |
| onClick cannot invoke | `ButtonInvokeFailed` | `UIStateFailed` |

Implementation notes:

- Continue using reflection to avoid hard dependency on `UnityEngine.UI` in schema, but the package already references Unity UI types through runtime use.
- If using direct type references, guard with compile availability.
- Record preflight state before invoking.
- Do not mark Validation Design passed from this action alone.

### 5.2 `unity_invoke_component_method`

Existing RPC. Keep name and input compatibility.

Input:

```json
{
  "targetPath": "/Debug/GameValidationHooks",
  "componentType": "Game.Validation.GameValidationHooks",
  "methodName": "ResetRun",
  "args": [],
  "requirePlaying": true,
  "debugOnly": true
}
```

Required fields:

- `targetPath`
- `componentType`
- `methodName`

Optional fields:

- `args`: default `[]`.
- `requirePlaying`: default `false`.
- `debugOnly`: default `true` when called from Validation Design.
- `allowedMethodPrefixes`: default `["Get", "Reset", "Set", "Simulate", "Validate", "Debug"]`.

Output:

```json
{
  "ok": true,
  "targetPath": "/Debug/GameValidationHooks",
  "componentType": "Game.Validation.GameValidationHooks",
  "methodName": "ResetRun",
  "isPlaying": true,
  "result": null,
  "returnType": "System.Void"
}
```

Failure rules:

| condition | error code | failure class |
| --- | --- | --- |
| component missing | `ComponentNotFound` | `ArtifactMissing` |
| method missing | `MethodNotFound` | `PreconditionFailed` |
| args cannot convert | `ArgumentConversionFailed` | `PreconditionFailed` |
| method throws | `MethodInvocationFailed` | `GameLogicFailed` |
| blocked by `requirePlaying` | `PlayModeRequired` | `PreconditionFailed` |
| method not allowed by debug policy | `UnsafeMethodBlocked` | `PreconditionFailed` |

Implementation notes:

- For backward compatibility, only enforce `debugOnly` policy when the parameter is present or when a future high-level Validation Design executor calls it.
- Public instance methods remain the only invocable method kind.
- Do not allow private method invocation.
- Do not catch and hide `TargetInvocationException`; return inner exception message and type.

### 5.3 `unity_get_ui_text`

New RPC for `textValue` observations.

Input:

```json
{
  "targetPath": "/Canvas/HUD/ScoreText",
  "componentType": "auto",
  "includeInactive": true
}
```

Required fields:

- `targetPath`

Optional fields:

- `componentType`: `auto`, `UnityEngine.UI.Text`, `TMPro.TMP_Text`, or a project-specific text component type.
- `includeInactive`: default `true`.

Output:

```json
{
  "ok": true,
  "targetPath": "/Canvas/HUD/ScoreText",
  "componentType": "UnityEngine.UI.Text",
  "text": "Score: 1",
  "activeSelf": true,
  "activeInHierarchy": true,
  "isPlaying": true
}
```

Resolution order:

1. Exact `componentType` if provided and not `auto`.
2. `UnityEngine.UI.Text`.
3. `TMPro.TMP_Text` by reflection.
4. Public `text` property on any component.

Failure rules:

| condition | error code | failure class |
| --- | --- | --- |
| object missing | `GameObjectNotFound` | `ArtifactMissing` |
| no readable text component | `TextComponentNotFound` | `ArtifactMissing` |
| text property unreadable | `TextReadFailed` | `UIStateFailed` |

Validation Design mapping:

```json
{
  "name": "scoreText",
  "type": "textValue",
  "target": "/Canvas/HUD/ScoreText"
}
```

### 5.4 `unity_get_debug_state`

New RPC for `DebugStateProbe`.

Input:

```json
{
  "targetPath": "/Debug/GameValidationHooks",
  "componentType": "Game.Validation.GameValidationHooks",
  "methodName": "GetDebugStateJson",
  "format": "json"
}
```

Required fields:

- `targetPath`

Optional fields:

- `componentType`: if omitted, find the first component with a supported debug state method.
- `methodName`: default search order below.
- `format`: `json`, `object`, or `string`; default `json`.

Default method search order:

1. `GetDebugStateJson()`
2. `GetDebugState()`
3. `GetInputDebugState()`

Output:

```json
{
  "ok": true,
  "targetPath": "/Debug/GameValidationHooks",
  "componentType": "Game.Validation.GameValidationHooks",
  "methodName": "GetDebugStateJson",
  "isPlaying": true,
  "state": {
    "score": { "value": 1 },
    "player": { "position": { "x": 0, "y": 1, "z": 2 } }
  },
  "raw": "{\"score\":{\"value\":1}}"
}
```

Failure rules:

| condition | error code | failure class |
| --- | --- | --- |
| target missing | `GameObjectNotFound` | `ArtifactMissing` |
| component missing | `ComponentNotFound` | `ArtifactMissing` |
| debug method missing | `DebugStateMethodNotFound` | `PreconditionFailed` |
| method throws | `DebugStateInvocationFailed` | `GameLogicFailed` |
| JSON parse fails when `format=json` | `DebugStateParseFailed` | `PreconditionFailed` |

Validation Design mapping:

```json
{
  "name": "runtimeState",
  "type": "debugStateJson",
  "target": "/Debug/GameValidationHooks",
  "component": "Game.Validation.GameValidationHooks",
  "methodName": "GetDebugStateJson"
}
```

### 5.5 `unity_probe_validation_observation`

Optional high-level RPC. This is not required for the first implementation, but it reduces duplicate probe code in clients.

Input:

```json
{
  "observation": {
    "name": "scoreText",
    "type": "textValue",
    "target": "/Canvas/HUD/ScoreText"
  }
}
```

Output:

```json
{
  "ok": true,
  "name": "scoreText",
  "type": "textValue",
  "value": "Score: 1",
  "probe": "UIProbe",
  "sourceRpc": "unity_get_ui_text"
}
```

Supported observation mapping:

| observation type | source RPC |
| --- | --- |
| `activeScene` | `unity_get_status` |
| `objectExists` | `unity_get_game_object` |
| `objectActive` | `unity_get_game_object` |
| `componentExists` | `unity_get_game_object` |
| `textValue` | `unity_get_ui_text` |
| `debugStateJson` | `unity_get_debug_state` |
| `editorLogErrors` | `unity_get_console_logs` |

## 6. Probe Concepts

### 6.1 `SceneProbe`

Purpose:

- Observe current scene and scene asset existence.

RPCs:

- `unity_get_status`
- `unity_find_assets` with `filter: "t:Scene <name>"`
- `unity_open_scene`

Evidence fields:

- active scene name/path.
- exact scene path match.
- scene load state.

### 6.2 `UIProbe`

Purpose:

- Observe UI text, active state, interactability, and perform button clicks.

RPCs:

- `unity_get_game_object`
- `unity_get_ui_text`
- `unity_click_ui_button`

Evidence fields:

- target path.
- component type.
- active state.
- interactable state where available.
- text value.

### 6.3 `ComponentProbe`

Purpose:

- Observe component existence and debug method availability.

RPCs:

- `unity_get_game_object`
- `unity_get_component_schema`
- `unity_invoke_component_method`

Evidence fields:

- present component type list.
- matching component.
- method name and result when invoked.

### 6.4 `LogProbe`

Purpose:

- Observe Unity console errors before and after validation action.

RPCs:

- `unity_get_console_logs`
- `unity_clear_console`

Evidence fields:

- error count.
- warning count when requested.
- log excerpts.

### 6.5 `DebugStateProbe`

Purpose:

- Read project-defined runtime state without hardcoding game rules into the harness.

RPCs:

- `unity_get_debug_state`
- fallback: `unity_input_test_bridge` with `getState` for `AInvilInputTestBridge`.

Evidence fields:

- method called.
- parsed state.
- raw state.
- parse status.

## 7. Validation Design Examples

### 7.1 Button click changes scene

```json
{
  "validationId": "VAL-UI-START-BUTTON-001",
  "requirementId": "REQ-UI-START-BUTTON",
  "acceptanceId": "AC-UI-START-BUTTON",
  "testType": "playmode-ui",
  "scene": "Assets/Scenes/Lobby.unity",
  "actions": [
    { "type": "openScene", "scene": "Assets/Scenes/Lobby.unity" },
    { "type": "enterPlayMode" },
    { "type": "click", "target": "/Canvas/MainMenu/StartButton" },
    { "type": "wait", "durationMs": 500 }
  ],
  "observations": [
    { "name": "activeScene", "type": "activeScene", "field": "name" },
    { "name": "errors", "type": "editorLogErrors" }
  ],
  "passCriteria": [
    { "id": "ASSERT-SCENE-CHANGED", "observation": "activeScene", "operator": "equals", "expected": "BattleScene" },
    { "id": "ASSERT-NO-ERRORS", "observation": "errors", "operator": "equals", "expected": 0 }
  ],
  "evidenceToRecord": ["beforeObservations", "afterObservations", "assertions", "editorLog"],
  "requiredProbes": ["SceneProbe", "UIProbe", "LogProbe"]
}
```

### 7.2 Dialogue text advances

```json
{
  "validationId": "VAL-DIALOGUE-NEXT-001",
  "requirementId": "REQ-DIALOGUE-NEXT",
  "acceptanceId": "AC-DIALOGUE-NEXT",
  "testType": "playmode-ui",
  "scene": "Assets/Scenes/Dialogue.unity",
  "actions": [
    { "type": "click", "target": "/Canvas/Dialogue/NextButton" }
  ],
  "observations": [
    { "name": "dialogueText", "type": "textValue", "target": "/Canvas/Dialogue/Text" }
  ],
  "passCriteria": [
    { "id": "ASSERT-DIALOGUE-ADVANCED", "observation": "dialogueText", "operator": "contains", "expected": "Next line" }
  ],
  "evidenceToRecord": ["beforeObservations", "afterObservations", "assertions"],
  "requiredProbes": ["UIProbe"]
}
```

### 7.3 Runtime debug state validates score

```json
{
  "validationId": "VAL-SCORE-INCREASE-001",
  "requirementId": "REQ-SCORE-INCREASE",
  "acceptanceId": "AC-SCORE-INCREASE",
  "testType": "playmode-debug-state",
  "scene": "Assets/Scenes/Gameplay.unity",
  "actions": [
    {
      "type": "invoke",
      "target": "/Debug/GameValidationHooks",
      "component": "Game.Validation.GameValidationHooks",
      "methodName": "SimulateCollectCoin"
    }
  ],
  "observations": [
    {
      "name": "debugState",
      "type": "debugStateJson",
      "target": "/Debug/GameValidationHooks",
      "component": "Game.Validation.GameValidationHooks",
      "methodName": "GetDebugStateJson"
    }
  ],
  "passCriteria": [
    { "id": "ASSERT-SCORE-GREATER", "observation": "debugState.score.value", "operator": "greaterThan", "expected": 0 }
  ],
  "evidenceToRecord": ["beforeObservations", "afterObservations", "assertions", "debugState"],
  "requiredProbes": ["DebugStateProbe", "LogProbe"]
}
```

## 8. Harness Implementation Plan

### Phase 1: Map Validation Design to existing RPCs

Status: partially implemented in `run-ainvil-live-harness.mjs`.

- `openScene` -> `unity_open_scene`
- `pressKey` -> `unity_input_test_bridge`
- `activeScene` -> `unity_get_status`
- `objectExists` -> `unity_get_game_object`
- `objectActive` -> `unity_get_game_object`
- `componentExists` -> `unity_get_game_object`
- `editorLogErrors` -> `unity_get_console_logs`

### Phase 2: Implement bridge RPC gaps

Status: implemented in `CodexUnityBridgeServer.cs` and `mcp-server/server.mjs`.

Added:

- `unity_get_ui_text`
- `unity_get_debug_state`

Enhanced:

- `unity_click_ui_button`
- `unity_invoke_component_method`

Updated:

- `mcp-server/server.mjs` tool schemas.
- `scripts/run-ainvil-live-harness.mjs` action/observation routing.
- `scripts/validate-mcp-server.mjs` expected tool list.

### Phase 3: Optional unified observation RPC

Status: implemented as a thin dispatch layer.

Added:

- `unity_probe_validation_observation`

This should be a thin dispatch layer over lower-level RPCs. It should not embed game rules.

## 9. C# Implementation Notes

Recommended helper methods in `CodexUnityBridgeServer.cs`:

- `TryFindComponentBySimpleOrFullName(GameObject target, string componentType)`
- `ReadTextFromComponent(Component component)`
- `InvokeDebugStateMethod(Component component, string methodName, string format)`
- `ToStructuredError(string code, string message, string domain, bool retryable)`

Text reading reflection:

```csharp
var textProperty = component.GetType().GetProperty("text", BindingFlags.Instance | BindingFlags.Public);
var value = textProperty?.GetValue(component, null)?.ToString();
```

Debug state parsing:

- If method returns `string`, parse as JSON when `format == "json"`.
- If method returns a primitive, wrap it as `{ "value": <result> }`.
- If method returns an object, serialize via existing `MethodResultToJson`.

Button preflight:

- `activeSelf`
- `activeInHierarchy`
- `Behaviour.enabled`
- `Selectable.interactable` by reflection.
- persistent listener count when available.

## 10. MCP Schema Updates

Add tools:

- `unity_get_ui_text`
- `unity_get_debug_state`

Optional:

- `unity_probe_validation_observation`

Enhance existing tool schemas with optional fields while preserving compatibility:

- `unity_click_ui_button.requireActive`
- `unity_click_ui_button.requireInteractable`
- `unity_click_ui_button.includePreflight`
- `unity_invoke_component_method.requirePlaying`
- `unity_invoke_component_method.debugOnly`
- `unity_invoke_component_method.allowedMethodPrefixes`

## 11. Evidence Contract

Validation evidence must record:

- action RPCs executed.
- observation source RPCs.
- before observations.
- after observations.
- assertions evaluated.
- failed assertion message.
- source Validation Design path.
- `acceptanceIds`.

Evidence must not be `Passed` when:

- no `passCriteria` exists.
- no assertion was evaluated.
- an action succeeded but observation failed.
- `acceptanceIds` is empty.
- a required probe is unsupported.

## 12. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- |
| `AC-BRIDGE-PROBE-001` | A UI Text object exists. | `unity_get_ui_text` runs. | The text value and component type are returned. |
| `AC-BRIDGE-PROBE-002` | A Button exists but is inactive. | `unity_click_ui_button` runs with `requireActive`. | The RPC fails with `InactiveTarget`. |
| `AC-BRIDGE-PROBE-003` | A debug component exposes `GetDebugStateJson`. | `unity_get_debug_state` runs. | Parsed JSON state is returned. |
| `AC-BRIDGE-PROBE-004` | A Validation Design uses `textValue`. | Harness apply runs. | Evidence includes text observation and assertion result. |
| `AC-BRIDGE-PROBE-005` | A Validation Design uses `debugStateJson`. | Harness apply runs. | Evidence includes parsed debug state and assertion result. |
| `AC-BRIDGE-PROBE-006` | Only a click/invoke action succeeds. | No passCriteria assertion passes. | Evidence is not `Passed`. |

## 13. Risks

| risk | impact | mitigation |
| --- | --- | --- |
| Invoking arbitrary public methods mutates production state unexpectedly. | False validation or damaged scene state. | Use `debugOnly`, allowed prefixes, and Validation Design review. |
| TextMeshPro may not be installed. | `textValue` probe fails in projects using TMP-less UI. | Use reflection and fallback to `UnityEngine.UI.Text`. |
| Button click by `onClick.Invoke()` is not identical to real pointer input. | UI navigation/pointer-only behavior may be missed. | Record click method as `directInvoke`; later add EventSystem pointer simulation. |
| Debug hooks become production dependencies. | Design drift and hidden test-only behavior. | Keep hooks under `/Debug` or validation components and document them in Component Contract. |
| JSON debug state shape varies by project. | Assertions fail or become brittle. | Validation Design owns field paths and expected values. |

## 14. Definition Of Done

This RPC expansion is complete when:

- `unity_get_ui_text` and `unity_get_debug_state` exist in Unity Bridge and MCP schemas.
- Existing `unity_click_ui_button` and `unity_invoke_component_method` return richer preflight/result data.
- Harness maps `click`, `invoke`, `textValue`, and `debugStateJson` through these RPCs.
- Validation evidence records observation source and assertion results.
- Static plugin validation passes.
- At least one negative test proves action-only execution cannot produce `Passed`.
