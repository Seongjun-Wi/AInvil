# Component Contract: {{ClassName}}

## Document Authority

- Component contracts decompose Technical Design and FeatureSpec requirements into implementable Unity component responsibilities.
- A component contract does not override the current GDD, System Design, Technical Design, or FeatureSpec.

## Identity

- Component id: COMP-PlayerAttack
- Path:
- Namespace:
- Owner system: SYS-Battle
- Related feature id: FEAT-Battle-001
- Related requirement ids: REQ-Battle-001
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:
- Runtime role:

## Responsibilities

- Execute player attack requests for REQ-Battle-001.
- Validate target range and apply combat events through SYS-Battle.

## Non-Responsibilities

- Does not own inventory, save serialization, or enemy AI decisions.

## Serialized Fields

| field | type | nullable | default | validation | description |
| --- | --- | --- | --- | --- | --- |
| attackRange | float | No | 1.5 | > 0 | Maximum attack range for prototype targeting. |

## Public API

| method/event | related requirement | purpose | caller | validation |
| --- | --- | --- | --- | --- |
| TryAttack() | REQ-Battle-001 | Attempt to resolve one player attack. | COMP-PlayerController | AC-Battle-001 |

## Lifecycle

| Unity method | behavior | edge cases |
| --- | --- | --- |
| Awake | Cache required references and validate serialized fields. | Missing data should log component id and data id. |

## Validation

| check id | related requirement | check | expected | status |
| --- | --- | --- | --- | --- |
| CHECK-PlayerAttack-001 | REQ-Battle-001 | compile | no errors | Not tested |
