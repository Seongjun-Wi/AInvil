# {{GameTitle}} Balance Spec

## Document Authority

- Balance Spec defines tunable values referenced by System Design, FeatureSpecs, and data assets.
- Balance values do not override feature intent or implementation contracts unless referenced by current source-of-truth documents.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Data Models:
- Related Decision Log entries:

## Tuning Tables

| balance id | data id | system id | feature id | field | type | nullable | default | validation | description | owner | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BAL-Battle-001 | DATA-SkillDefinition | SYS-Battle | FEAT-Battle-001 | damage | int | No | 10 | >= 0 | Base damage for the prototype attack. | Design | Planned |

## Balance Bands

| balance id | min | target | max | rationale | validation method |
| --- | --- | --- | --- | --- | --- |
| BAL-Battle-001 | 1 | 10 | 999 | Keeps first playable combat readable while allowing tuning. | Playtest and telemetry review if available. |

## Revision Notes

| version | date | changed value | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | BAL-Battle-001 | Initial placeholder value. | Replace after playtest. |
