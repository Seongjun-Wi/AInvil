# {{GameTitle}} GDD

## 0. Document Authority

- GDD is the top-level source of truth for player experience and feature intent.
- System Design converts GDD feature intent into system behavior.
- Technical Design converts System Design and GDD intent into implementation structure.
- FeatureSpec defines requirements, data, Unity mapping, and validation criteria for one feature.
- Component, Prefab, Scene, and Input documents break Technical Design and FeatureSpec content into implementable units.
- Design Decision Log records past decisions. It is not implementation authority unless the current GDD or Technical Design references the decision.
- Current source of truth: This GDD contains only the latest confirmed or explicitly proposed design for implementation.
- Superseded design: Move old decisions to the Design Decision Log or a clearly non-authoritative appendix.
- Version:
- Status:
- Author:
- Scope basis:
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:
- Last Updated:

## 1. Design Intent

- Player fantasy:
- Target platform:
- Target session length:
- Core emotion:
- Non-negotiables:
- Cuttable scope:
- First playable milestone:
- Latest confirmed user intent:
- One-person feasibility:
- Design review status:
- GDD completeness status:

## 1.1 Design Quality Snapshot

| area | current assessment | risk | next action |
| --- | --- | --- | --- |
| Core loop strength |  |  |  |
| Player motivation |  |  |  |
| Game feel |  |  |  |
| UX clarity |  |  |  |
| Progression |  |  |  |
| Retention |  |  |  |
| Replayability |  |  |  |
| Economy / balance |  |  |  |
| Scope feasibility |  |  |  |

## 2. Design Pillars

| pillar id | pillar | meaning | implementation implication |
| --- | --- | --- | --- |
| PILLAR-Core-001 | Responsive combat | Player actions should feel immediate and readable. | Combat input, animation, hit feedback, and camera feedback must prioritize clarity. |

## 3. Core Loop

```text
Start -> Decide -> Act -> Resolve -> Reward/Failure -> Upgrade/Reset -> Start
```

## 4. Game States

| state id | state | entry condition | allowed actions | transitions | exit condition | failure cases |
| --- | --- | --- | --- | --- | --- | --- |
| STATE-Gameplay | Gameplay | Scene loaded and player spawned. | Move, attack, pause | STATE-Pause, STATE-GameOver, STATE-Clear | Stage ends or player dies. | Player spawned without controller. |

## 5. Systems

| system id | feature id | priority | system | purpose | player-facing behavior | complexity | dependencies | risks | possible simplifications |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SYS-Battle | FEAT-Battle-001 | P0 | Battle | Resolve player attacks and enemy damage. | Player attacks enemies and sees clear hit feedback. | Medium | DATA-PlayerStats, INPUT-Attack | Hit timing may feel unclear. | Use single attack range before combo rules. |

## 6. Data and Content

| data id | category | model | field | type | nullable | default | validation | description | recommended storage | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DATA-PlayerStats | Authored Data | PlayerStats | maxHp | int | No | 100 | >= 1 | Maximum health value. | ScriptableObject | Planned |

Data categories: `Authored Data`, `Runtime State`, `Save Data`, `Generated Data`, `Configuration Data`.

## 7. UI/UX Flow

| screen id | screen | purpose | opened from | closes to | key information | actions | feedback | modal/blocking |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UI-Lobby | Lobby | Let the player prepare and start gameplay. | STATE-Boot | SCENE-Gameplay | Player status, selected loadout, start option. | Start, open inventory, open settings. | Button highlight, transition sound. | No |

## 8. Input

| input id | context | device | binding | action | expected behavior | related requirement | implementation target |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INPUT-PauseToggle | Global | Keyboard | Escape | Toggle Pause | Opens or closes pause UI when allowed. | REQ-Pause-001 | COMP-PauseController |

## 9. Economy and Progression

- Resources:
- Sources:
- Sinks:
- Progression gates:
- Reset rules:

## 10. Prototype Behavior

| feature id | prototype behavior | placeholder/default | validation | replacement condition | status |
| --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | Single melee attack with fixed damage. | Damage value hardcoded until DATA-SkillDefinition exists. | Manual Play Mode test. | Replace when authored skill data is implemented. | Prototype default |

## 11. Production Behavior

| feature id | production behavior | required data | required Unity mapping | validation | status |
| --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | Attacks use authored skill data, range checks, cooldowns, and feedback. | DATA-SkillDefinition | COMP-PlayerAttack, PREFAB-HitFeedback | AC-Battle-001 | Planned |

## 12. Non-Functional Requirements

| nfr id | category | requirement | target | validation method | status |
| --- | --- | --- | --- | --- | --- |
| NFR-Performance-001 | Performance | Gameplay should remain stable during normal combat. | 60 FPS target | Unity Profiler | Not tested |
| NFR-Memory-001 | Memory | Combat feature should not allocate every frame during normal play. | 0 B/frame after warm-up | Unity Profiler allocation view | Not tested |
| NFR-Loading-001 | Loading | Gameplay scene should enter an interactive state quickly. | Project-specific target | Play Mode timing capture | Not tested |
| NFR-Save-001 | Save size | Save data should remain compact and versioned. | Project-specific budget | Save file inspection | Not tested |
| NFR-Networking-001 | Networking | Network assumptions must be explicit before implementation. | Offline unless specified | Technical Design review | Planned |
| NFR-Localization-001 | Localization | Player-facing strings should be localizable when production UI is implemented. | No hardcoded production strings | UI review | Planned |
| NFR-Accessibility-001 | Accessibility | Critical feedback should not rely on color alone. | Color plus text, icon, motion, or audio cue | Accessibility review | Not tested |
| NFR-Platform-001 | Platform constraints | Input, performance, and save behavior should match target platforms. | Target platform compliance | Platform checklist | Planned |

## 13. Feature Readiness

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-Battle-001 | REQ-Battle-001 | Player is alive and enemy is in range. | Player presses attack input. | Enemy takes damage and feedback is shown. | Not tested |

## 13.1 Traceability Summary

| GDD section | requirement id | feature spec | Unity mapping | input id | acceptance id | validation evidence | validation level |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GDD section 3 Core Loop | REQ-Battle-001 | FS_Battle.md | COMP-PlayerAttack | INPUT-Attack | AC-Battle-001 | Pending | Not Checked |

## 14. Open Questions

| question id | related system | question | impact | owner | status |
| --- | --- | --- | --- | --- | --- |
| Q-Battle-001 | SYS-Battle | Should attacks support combos in first playable? | Affects animation and input scope. | Design | Open |

## 15. Live-Service Planning

Only include this section when the project is live-service or the user requests seasonal updates, content expansion, events, balance operations, PvP, rankings, progression, gacha, remote configuration, or server-driven content.

- Season structure:
- Balance pipeline:
- Content pipeline:
- Patch strategy:
- Live configuration:
- Content scalability:
- Future extensibility:

## 16. Placeholder Tracking

| placeholder id | related feature | type | production target | current placeholder/default | replacement condition | owner |
| --- | --- | --- | --- | --- | --- | --- |
| PLACEHOLDER-Battle-001 | FEAT-Battle-001 | Prototype default | DATA-SkillDefinition-driven attack values. | Fixed damage value. | Skill data implemented and validated. | Unity Agent |

Types: `Prototype default`, `Temporary Placeholder`, `Implementation Stub`.

## 17. Revision Notes

| version | date | changed source-of-truth section | replaced or removed content | reason | follow-up |
| --- | --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | Document created |  | Initial draft | Review open questions |
