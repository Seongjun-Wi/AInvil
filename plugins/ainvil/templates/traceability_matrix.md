# Traceability Matrix: {{GameTitle}}

## 1. Matrix Summary

- Matrix id:
- Project:
- Graph source: state/production_state_graph.json
- Graph version:
- Current milestone:
- Current active feature:
- Last updated:
- Validation coverage summary:

This matrix is a human-readable view of the Production State Graph. It should be derived from or synchronized with graph paths. It is not a competing source of truth.

## 2. Traceability Rows

| trace id | graph path | GDD section | requirement id | feature spec | task id | Unity scene | prefab | script/component | data asset | input id | acceptance id | validation evidence | validation level | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRACE-001 | VISION-Core -> REQ-Core-001 -> TASK-Core-001 -> UNITY-GameplayScene -> INPUT-CoreAction -> AC-CoreLoop-001 -> EVID-CoreLoop-001 | GDD section 3 Core Loop | REQ-Core-001 | FS_Core_Loop.md | TASK-Core-001 | SCENE-Gameplay | PREFAB-Player | COMP-PlayerController | DATA-PlayerStats | INPUT-Move | AC-Core-001 | EVID-CoreLoop-001 | Not Checked | Needs validation |

## 3. Missing Links

| trace id | missing link | impact | next owner | status |
| --- | --- | --- | --- | --- |
| TRACE-001 | Validation evidence | Cannot claim feature works. | Input Agent | Open |

## 4. Coverage

| category | covered | partial | missing | blocked |
| --- | --- | --- | --- | --- |
| Requirements |  |  |  |  |
| Unity implementation |  |  |  |  |
| Input mappings |  |  |  |  |
| Acceptance criteria |  |  |  |  |
| Runtime validation |  |  |  |  |
