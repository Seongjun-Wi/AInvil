# Prefab Contract: {{PrefabName}}

## Document Authority

- Prefab contracts decompose Technical Design and FeatureSpec requirements into required Unity prefab structure.
- A prefab contract does not override the current GDD, System Design, Technical Design, or FeatureSpec.

## Identity

- Prefab id: PREFAB-Player
- Path:
- Owner system: SYS-Battle
- Related feature id: FEAT-Battle-001
- Related requirement ids: REQ-Battle-001
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Input Spec:
- Related Decision Log entries:
- Runtime role:
- Instantiated by:

## Required Hierarchy

```text
PREFAB-Player
  /Model
  /Collider
  /FeedbackAnchor
```

## Required Components

| path | component id | component | related requirement | purpose | required refs |
| --- | --- | --- | --- | --- | --- |
| / | COMP-PlayerAttack | PlayerAttack | REQ-Battle-001 | Resolve attack input. | DATA-PlayerStats |

## Assets

| asset id | asset | purpose | required |
| --- | --- | --- | --- |
| DATA-PlayerStats | PlayerStats.asset | Player stat tuning. | Yes |

## Validation

| check id | related requirement | check | expected | status |
| --- | --- | --- | --- | --- |
| CHECK-PlayerPrefab-001 | REQ-Battle-001 | prefab loads | no missing scripts | Not tested |
