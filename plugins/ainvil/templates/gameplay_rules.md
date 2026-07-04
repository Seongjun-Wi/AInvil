# {{GameTitle}} Gameplay Rules

## Document Authority

- Gameplay Rules supports System Design and FeatureSpecs by listing precise rules and validations.
- Rules do not override GDD intent, System Design ownership, or Technical Design implementation mapping.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Decision Log entries:

## Rule Index

| rule id | system id | feature id | requirement id | rule | priority | validation | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-Battle-001 | SYS-Battle | FEAT-Battle-001 | REQ-Battle-001 | Attack only damages enemies inside active range at resolve time. | P0 | AC-Battle-001 | Planned |

## Rule Details

| rule id | preconditions | trigger | resolution | edge cases | failure handling |
| --- | --- | --- | --- | --- | --- |
| RULE-Battle-001 | Player alive; enemy target valid. | INPUT-Attack | Apply damage through SYS-Battle. | Enemy exits range before resolve. | Attack misses and feedback shows miss if required. |

## Revision Notes

| version | date | changed rule | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | RULE-Battle-001 | Initial draft | Validate in FeatureSpec. |
