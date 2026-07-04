# {{GameTitle}} Save Spec

## Document Authority

- Save Spec defines persistent data contracts derived from GDD, System Design, Technical Design, and FeatureSpecs.
- Save Spec does not make gameplay state authoritative unless the current Technical Design references it.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Data Models:
- Related Decision Log entries:

## Save Overview

| save id | purpose | format | versioning | owner system | validation |
| --- | --- | --- | --- | --- | --- |
| SAVE-PlayerProfile | Store long-term player progress. | JSON or Unity serialization | Semantic save version field | SYS-Progression | Load/save roundtrip test |

## Save Data Fields

| data id | field | type | nullable | default | validation | description |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-SaveProfile | playerLevel | int | No | 1 | >= 1 | Player progression level. |

## Persistence Rules

| rule id | related requirement | when saved | when loaded | migration behavior | failure handling |
| --- | --- | --- | --- | --- | --- |
| RULE-Save-001 | REQ-Save-001 | On checkpoint or explicit save. | Before STATE-Gameplay starts. | Apply versioned migration. | Use backup or start new profile after confirmation. |

## Revision Notes

| version | date | changed contract | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | SAVE-PlayerProfile | Initial draft | Confirm platform save constraints. |
