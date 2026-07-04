# Scene Blueprint: {{SceneName}}

## Document Authority

- Scene blueprints decompose Technical Design and FeatureSpec requirements into required Unity scene hierarchy.
- A scene blueprint does not override the current GDD, System Design, Technical Design, or FeatureSpec.

## Scene

- Scene id: SCENE-Gameplay
- Path:
- Purpose:
- Runtime role:
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:

## Root Hierarchy

```text
/SCENE-Gameplay
  /GameSystems
  /Player
  /UI
  /Debug
```

## Required Managers

| path | component id | component | related requirement | responsibility | required references |
| --- | --- | --- | --- | --- | --- |
| /GameSystems | COMP-GameStateController | GameStateController | REQ-State-001 | Own runtime state transitions. | SCENE-Gameplay |

## Required UI

| path | screen id | component | related requirement | purpose | default state |
| --- | --- | --- | --- | --- | --- |
| /UI/GameplayHUD | UI-GameplayHUD | GameplayHudView | REQ-Battle-001 | Show combat feedback. | Visible |

## Required Prefabs

| prefab id | path | related requirement | spawn rule | validation |
| --- | --- | --- | --- | --- |
| PREFAB-Player | Assets/Prefabs/Player.prefab | REQ-Battle-001 | Spawn before STATE-Gameplay begins. | Required components assigned. |

## Validation

| check id | related requirement | check | method | expected | status |
| --- | --- | --- | --- | --- | --- |
| CHECK-Scene-001 | REQ-Battle-001 | compile | unity_compile_status | no errors | Not tested |
