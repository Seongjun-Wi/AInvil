# {{GameTitle}} System Design

## Document Authority

- GDD is the top-level source of truth for player experience and feature intent.
- System Design converts GDD feature intent into system behavior.
- Technical Design converts System Design and GDD intent into implementation structure.
- FeatureSpec defines requirements, data, Unity mapping, and validation criteria for one feature.
- Component, Prefab, Scene, and Input documents break Technical Design and FeatureSpec content into implementable units.
- Design Decision Log records past decisions. It is not implementation authority unless the current GDD or Technical Design references the decision.
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
- Last Updated:

## System Overview

| system id | system | player intent | design purpose | implementation handoff |
| --- | --- | --- | --- | --- |
| SYS-Battle | Battle | Defeat enemies through readable actions. | Defines combat rules, state, events, and data ownership. | Technical Design maps to COMP-BattleSystem and COMP-PlayerAttack. |

## System List

| system id | priority | related feature ids | related GDD sections | owner | status |
| --- | --- | --- | --- | --- | --- |
| SYS-Battle | P0 | FEAT-Battle-001 | GDD section 5 | Design | Planned |

## System Responsibilities

| system id | owns | does not own | rules | data owned | events emitted |
| --- | --- | --- | --- | --- | --- |
| SYS-Battle | Combat resolution, damage, combat state. | Inventory, long-term save, enemy AI strategy. | RULE-Battle-001 | DATA-PlayerStats, DATA-SkillDefinition | EVENT-DamageApplied |

## System Interactions

| interaction id | from system | to system | trigger | payload/data | expected result |
| --- | --- | --- | --- | --- | --- |
| INT-Battle-Feedback-001 | SYS-Battle | SYS-Feedback | EVENT-DamageApplied | target id, damage, hit position | Hit feedback is shown. |

## Gameplay Rule References

| rule id | system id | related requirement | rule summary | source | validation |
| --- | --- | --- | --- | --- | --- |
| RULE-Battle-001 | SYS-Battle | REQ-Battle-001 | Attack damages enemies in active range at resolve time. | GDD section 5 | AC-Battle-001 |

## Data Ownership

| data id | system id | category | owner | readers | persistence | validation |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-PlayerStats | SYS-Battle | Authored Data | Design | COMP-PlayerAttack | Asset only; copied into runtime state. | maxHp >= 1 |

## Event Flow References

| event id | flow id | source system | target system | payload | validation |
| --- | --- | --- | --- | --- | --- |
| EVENT-DamageApplied | FLOW-Battle-001 | SYS-Battle | SYS-Feedback | target id, damage amount | AC-Battle-001 |

## State Flow

| state id | state | entry condition | allowed actions | transitions | exit condition | failure cases |
| --- | --- | --- | --- | --- | --- | --- |
| STATE-Gameplay | Gameplay | SCENE-Gameplay loaded and player spawned. | Move, attack, pause | STATE-Pause, STATE-GameOver, STATE-Clear | Stage ends or player dies. | Player spawned without controller. |

## Open Questions

| question id | related system | question | impact | owner | status |
| --- | --- | --- | --- | --- | --- |
| Q-Battle-001 | SYS-Battle | Should attacks support combos in first playable? | Affects input, animation, and data model. | Design | Open |

## Revision Notes

| version | date | changed section | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | Document created | Initial system handoff from GDD. | Review with Technical Design. |
