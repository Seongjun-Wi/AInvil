# {{GameTitle}} Technical Design

## 0. Document Authority

- GDD is the top-level source of truth for player experience and feature intent.
- System Design converts GDD feature intent into system behavior.
- Technical Design converts System Design and GDD intent into implementation structure.
- FeatureSpec defines requirements, data, Unity mapping, and validation criteria for one feature.
- Component, Prefab, Scene, and Input documents break Technical Design and FeatureSpec content into implementable units.
- Design Decision Log records past decisions. It is not implementation authority unless the current GDD or Technical Design references the decision.
- Current implementation source: This technical design reflects the latest confirmed GDD and System Design and is the implementation handoff.
- Superseded technical choices: Move old choices to the Design Decision Log or a non-authoritative appendix.
- Version:
- Status:
- Author:
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:
- Open design dependencies:
- Last Updated:

## 1. Scope

- Milestone:
- Product scope reference:
- First playable milestone:
- Target Unity version:
- Runtime platforms:
- Prototype constraints:

## 2. Feature Implementation Assessment

| feature id | system id | priority | complexity | major dependencies | technical risks | possible simplifications | Definition of Done |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | SYS-Battle | P0 | Medium | DATA-PlayerStats, COMP-PlayerAttack | Hit validation may drift from animation timing. | Start with a single attack range. | AC-Battle-001 passes and no compile errors. |

Complexity values: `Low`, `Medium`, `High`, `Very High`.

Use `Possible Scope Reduction` recommendations for `High` or `Very High` features; they require user confirmation before becoming source-of-truth scope changes.

## 3. Architecture

| system id | system | owner component | responsibilities | non-responsibilities | dependencies |
| --- | --- | --- | --- | --- | --- |
| SYS-Battle | Battle | COMP-BattleSystem | Resolve combat commands, damage, and combat events. | Does not own inventory or save serialization. | DATA-PlayerStats, EVENT-DamageApplied |

## 4. Game State Model

| state id | state | entry condition | allowed actions | transitions | exit condition | failure cases | data owner | persistence | validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STATE-Gameplay | Gameplay | SCENE-Gameplay loaded and PREFAB-Player spawned. | Move, attack, pause | STATE-Pause, STATE-GameOver, STATE-Clear | Stage ends or player dies. | Player spawned without COMP-PlayerController. | COMP-GameStateController | Runtime only; save checkpoint state separately. | Scene validation and Play Mode state test. |

## 5. Data Models

| data id | category | model | field | type | nullable | default | validation | description | storage | authoring source | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DATA-PlayerStats | Authored Data | PlayerStats | maxHp | int | No | 100 | >= 1 | Maximum health value. | ScriptableObject | Designer-authored asset | Planned |

Data categories: `Authored Data`, `Runtime State`, `Save Data`, `Generated Data`, `Configuration Data`.

## 6. Scene Blueprint

```text
Scene: Assets/Scenes/{{SceneName}}.unity
Root:
  /GameSystems
  /Player
  /UI
  /Debug
```

## 7. Unity Implementation Mapping

| feature id | requirement id | Unity scene | scene id | prefab id | prefab path | component id | script | data assets | input id | tests | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | REQ-Battle-001 | Assets/Scenes/Gameplay.unity | SCENE-Gameplay | PREFAB-Player | Assets/Prefabs/Player.prefab | COMP-PlayerAttack | PlayerAttack.cs | DATA-PlayerStats | INPUT-Attack | AC-Battle-001 | Planned |

## 7.1 Traceability Matrix Links

| trace id | GDD section | requirement id | feature spec | task id | Unity target | input id | acceptance id | validation evidence | validation level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRACE-Battle-001 | GDD section 3 Core Loop | REQ-Battle-001 | FS_Battle.md | TASK-Battle-001 | COMP-PlayerAttack | INPUT-Attack | AC-Battle-001 | Pending | Not Checked |

## 8. Component Contracts

| component id | class | path | owns | public API | validation |
| --- | --- | --- | --- | --- | --- |
| COMP-PlayerAttack | PlayerAttack | Assets/Scripts/Gameplay/PlayerAttack.cs | Player attack execution. | TryAttack() | Compile, serialized refs assigned, AC-Battle-001. |

## 9. Prefab Contracts

| prefab id | prefab | purpose | required children | required components | validation |
| --- | --- | --- | --- | --- | --- |
| PREFAB-Player | Assets/Prefabs/Player.prefab | Runtime player avatar. | Model, Collider, FeedbackAnchor | COMP-PlayerController, COMP-PlayerAttack | No missing scripts; required refs assigned. |

## 10. Input Implementation

| input id | related requirement | implementation target | tool validation | acceptance criteria |
| --- | --- | --- | --- | --- |
| INPUT-PauseToggle | REQ-Pause-001 | COMP-PauseController | unity_send_key_event Escape | AC-Pause-001 |

## 11. Prototype Behavior

| feature id | prototype behavior | placeholder/default | implementation location | replacement condition | status |
| --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | Fixed damage and simple overlap range. | Hardcoded damage value. | COMP-PlayerAttack | DATA-SkillDefinition integrated. | Prototype default |

## 12. Production Behavior

| feature id | production behavior | required systems | required data | required validation | status |
| --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | Authored skill data drives damage, cooldown, range, feedback, and animation windows. | SYS-Battle, SYS-Feedback | DATA-SkillDefinition | AC-Battle-001, profiler pass | Planned |

## 13. Non-Functional Requirements

| nfr id | category | requirement | target | validation method | status |
| --- | --- | --- | --- | --- | --- |
| NFR-Performance-001 | Performance | Gameplay should remain stable during normal combat. | 60 FPS target | Unity Profiler | Not tested |
| NFR-Memory-001 | Memory | Runtime systems should avoid repeated frame allocations. | 0 B/frame after warm-up | Unity Profiler allocation view | Not tested |
| NFR-Loading-001 | Loading | Scene activation should create required managers before gameplay begins. | No missing required scene objects | Scene validation tool | Not tested |
| NFR-Save-001 | Save size | Save payloads should include only persistent game state. | Project-specific budget | Save file inspection | Planned |
| NFR-Networking-001 | Networking | Network authority must be specified before multiplayer implementation. | Offline by default | Architecture review | Planned |
| NFR-Localization-001 | Localization | Production UI text should use localizable string references. | No hardcoded production strings | UI audit | Planned |
| NFR-Accessibility-001 | Accessibility | Critical combat feedback should have redundant cues. | Visual plus audio or text cue | Accessibility review | Not tested |
| NFR-Platform-001 | Platform constraints | Runtime behavior should match target platform input and performance constraints. | Platform checklist pass | Platform test | Planned |

## 14. Error Handling

| case | expected behavior | user feedback | logs |
| --- | --- | --- | --- |
| Missing DATA-PlayerStats | Use safe defaults in prototype; block production build. | None in prototype; validation error in editor. | Error with data id and owner component. |

## 15. Live-Service Technical Plan

Only include this section when live-service scope is confirmed or strongly implied.

- Season structure:
- Balance pipeline:
- Content pipeline:
- Patch strategy:
- Live configuration:
- Content scalability:
- Future extensibility:

## 16. Implementation Tasks

| task id | feature id | requirement id | owner agent | description | creates/updates | dependencies | verification | Definition of Done | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-Battle-001 | FEAT-Battle-001 | REQ-Battle-001 | Unity Agent | Implement player attack. | COMP-PlayerAttack | DATA-PlayerStats, INPUT-Attack | AC-Battle-001 | Attack works and tests pass. | Planned |

## 16.1 Validation Pipeline

| task id | static analysis | Unity inspection | compile | play mode | runtime test | user confirmation | current validation level |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-Battle-001 | Planned | Planned | Not tested | Not tested | Not tested | Not confirmed | Not Checked |

## 17. Acceptance Criteria

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-Battle-001 | REQ-Battle-001 | Player is alive and enemy is in range. | Player presses attack input. | Enemy takes damage and feedback is shown. | Not tested |

## 18. Source-of-Truth Revisions

| version | date | section | replaced or removed content | reason | status |
| --- | --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | Document created |  | Initial draft | Proposed |
