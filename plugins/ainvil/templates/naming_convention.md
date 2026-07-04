# {{GameTitle}} Naming Convention

## Document Authority

- Naming Convention defines stable IDs and asset naming used across all AInvil documents.
- Naming Convention supports traceability but does not override current GDD, System Design, Technical Design, or FeatureSpec behavior.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:

## ID Prefixes

| prefix | applies to | format | example |
| --- | --- | --- | --- |
| SYS | Game system | SYS-Name | SYS-Battle |
| FEAT | Feature | FEAT-System-Number | FEAT-Battle-001 |
| REQ | Functional requirement | REQ-System-Number | REQ-Battle-001 |
| AC | Acceptance criteria | AC-System-Number | AC-Battle-001 |
| NFR | Non-functional requirement | NFR-Category-Number | NFR-Performance-001 |
| DATA | Data model or asset | DATA-Name | DATA-PlayerStats |
| UI | Screen or UI surface | UI-Name | UI-Lobby |
| SCENE | Unity scene | SCENE-Name | SCENE-Lobby |
| PREFAB | Unity prefab | PREFAB-Name | PREFAB-Player |
| COMP | Unity component/class contract | COMP-Name | COMP-PlayerController |
| INPUT | Input action | INPUT-Name | INPUT-PauseToggle |
| TASK | Implementation task | TASK-System-Number | TASK-Battle-001 |
| DDL | Design decision log entry | DDL-Number | DDL-001 |

## Asset Naming

| asset type | naming rule | example |
| --- | --- | --- |
| Scene | PascalCase scene name with matching SCENE id | Gameplay.unity / SCENE-Gameplay |
| Prefab | PascalCase prefab name with matching PREFAB id | Player.prefab / PREFAB-Player |
| Script | PascalCase class name with matching COMP id when applicable | PlayerController.cs / COMP-PlayerController |
| ScriptableObject asset | PascalCase data model name | PlayerStats.asset / DATA-PlayerStats |

## Cross-Reference Rules

| source document | should reference | purpose |
| --- | --- | --- |
| GDD | SYS, FEAT, DATA, UI, INPUT, AC, NFR | Defines intent and player-facing scope. |
| System Design | SYS, RULE, DATA, EVENT, STATE | Converts intent into system behavior. |
| Technical Design | FEAT, REQ, SCENE, PREFAB, COMP, INPUT, DATA, TASK, AC | Maps behavior into Unity implementation. |
| FeatureSpec | REQ, RULE, DATA, SCENE, PREFAB, COMP, INPUT, AC | Defines one feature end to end. |
| Design Decision Log | DDL plus impacted IDs | Preserves history without overriding current source of truth. |

## Revision Notes

| version | date | changed rule | reason | follow-up |
| --- | --- | --- | --- | --- |
| 0.1 | YYYY-MM-DD | Initial ID prefixes | Establish cross-document traceability. | Apply to all templates. |
