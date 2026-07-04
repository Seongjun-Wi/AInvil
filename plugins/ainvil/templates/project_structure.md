# {{GameTitle}} Project Structure

## Document Authority

- GDD is the top-level source of truth for player experience and feature intent.
- System Design converts GDD feature intent into system behavior.
- Technical Design converts System Design and GDD intent into implementation structure.
- FeatureSpec defines requirements, data, Unity mapping, and validation criteria for one feature.
- Component, Prefab, Scene, and Input documents break Technical Design and FeatureSpec content into implementable units.
- Design Decision Log records past decisions. It is not implementation authority unless the current GDD or Technical Design references the decision.

## Source Documents

- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:

## Unity Project

- Unity project path:
- Active scene:
- Last validation:

## Entries

| path | type | system id | feature id | requirement id | owner system | purpose | main class/component | dependencies | runtime role | status | validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Assets/Scenes/Gameplay.unity | Scene | SYS-Battle | FEAT-Battle-001 | REQ-Battle-001 | Gameplay | Primary gameplay scene. | SCENE-Gameplay | PREFAB-Player, COMP-PlayerAttack | Production | Planned | Scene opens with no missing refs. |

## Feature Implementation Mapping

| feature id | requirement id | Unity scene | scene id | prefab id | component id | script | data assets | input id | tests | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FEAT-Battle-001 | REQ-Battle-001 | Assets/Scenes/Gameplay.unity | SCENE-Gameplay | PREFAB-Player | COMP-PlayerAttack | PlayerAttack.cs | DATA-PlayerStats | INPUT-Attack | AC-Battle-001 | Planned |

## Traceability Matrix Links

| trace id | GDD section | requirement id | task id | Unity path | input id | acceptance id | validation evidence | validation level | sync status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRACE-Battle-001 | GDD section 3 Core Loop | REQ-Battle-001 | TASK-Battle-001 | Assets/Scripts/Gameplay/PlayerAttack.cs | INPUT-Attack | AC-Battle-001 | Pending | Not Checked | In sync |

## Scene Blueprints

| scene id | path | related feature | related requirements | owner | status |
| --- | --- | --- | --- | --- | --- |
| SCENE-Gameplay | templates/scene_blueprint.md | FEAT-Battle-001 | REQ-Battle-001 | Unity Agent | Planned |

## Component Contracts

| component id | path | related feature | related requirements | owner | status |
| --- | --- | --- | --- | --- | --- |
| COMP-PlayerAttack | templates/component_contract.md | FEAT-Battle-001 | REQ-Battle-001 | Unity Agent | Planned |

## Prefab Contracts

| prefab id | path | related feature | related requirements | owner | status |
| --- | --- | --- | --- | --- | --- |
| PREFAB-Player | templates/prefab_contract.md | FEAT-Battle-001 | REQ-Battle-001 | Unity Agent | Planned |

## Scene/Registry Diff

| diff id | kind | documented | actual | decision | status |
| --- | --- | --- | --- | --- | --- |
| DIFF-Registry-001 | Missing in Registry | COMP-PlayerAttack |  | Add or confirm contract. | Open |
