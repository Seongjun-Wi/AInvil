# Design Decision Log

This log preserves design history. These records are historical only and must never replace the current source of truth. A row is implementation guidance only when its status is `Accepted` and the current GDD or Technical Design still references it.

## Document Authority

- GDD is the top-level source of truth for player experience and feature intent.
- System Design converts GDD feature intent into system behavior.
- Technical Design converts System Design and GDD intent into implementation structure.
- FeatureSpec defines requirements, data, Unity mapping, and validation criteria for one feature.
- Component, Prefab, Scene, and Input documents break Technical Design and FeatureSpec content into implementable units.
- Design Decision Log records past decisions. It is not implementation authority unless the current GDD or Technical Design references the decision.

## Metadata

- Version:
- Last Updated:
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

| decision id | date | decision | reason | alternatives considered | impacted feature ids | impacted system ids | impacted requirement ids | status | source-of-truth link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DDL-001 | YYYY-MM-DD | Use ScriptableObject for player stats. | Designer-editable tuning is needed. | JSON, hardcoded values | FEAT-Battle-001 | SYS-Battle | REQ-Battle-001 | Proposed | GDD section 6 |
