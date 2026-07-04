# {{GameTitle}} Event Flow

## Document Authority

- Event Flow documents system-to-system runtime messages referenced by System Design and Technical Design.
- Event Flow does not override source-of-truth behavior unless referenced by current GDD, System Design, or Technical Design.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Component Contracts:
- Related Decision Log entries:

## Event Index

| event id | flow id | source system | target system | related requirement | payload | expected result | validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVENT-DamageApplied | FLOW-Battle-001 | SYS-Battle | SYS-Feedback | REQ-Battle-001 | target id, damage amount, hit position | Hit feedback appears. | AC-Battle-001 |

## Flow Steps

| flow id | step | owner | action | input | output | failure handling |
| --- | --- | --- | --- | --- | --- | --- |
| FLOW-Battle-001 | 1 | COMP-PlayerAttack | Request attack resolve. | INPUT-Attack | EVENT-AttackRequested | Ignore if player cannot act. |
| FLOW-Battle-001 | 2 | COMP-BattleSystem | Apply damage. | EVENT-AttackRequested | EVENT-DamageApplied | Emit miss or validation error when no target is valid. |

## Revision Notes

| version | date | changed flow | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | FLOW-Battle-001 | Initial draft | Validate with Play Mode. |
