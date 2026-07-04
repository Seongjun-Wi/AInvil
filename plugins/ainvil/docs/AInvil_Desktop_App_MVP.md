# AInvil Desktop App MVP

## Purpose

Define the minimum standalone GUI app that can use the same AInvil documents, schemas, Unity Bridge, and provider-neutral core used by the Codex plugin.

## Recommended Stack

Initial recommendation: Tauri.

Reason:

- Small desktop footprint.
- Web UI is fast to iterate.
- Rust side can manage filesystem, process lifecycle, and local SQLite later.
- Existing MCP/Node bridge can be launched as a child process when needed.

Alternatives:

- Electron: fastest if Node integration is preferred.
- .NET/WPF: strong Windows-native path, slower for cross-platform UI.

## MVP Screens

### Project Dashboard

- Project name, goal, milestone.
- Unity project path.
- Unity Bridge status.
- Last validation summary.
- Open questions count.

### Agent Console

- Active agent.
- Current task.
- Recent tool calls.
- Files changed.
- Blocked reason.

### Document Workspace

- GDD.
- Technical design.
- Project structure registry.
- Input spec.
- Playtest report.

### Unity Inspector Bridge

- Active scene.
- Hierarchy read-only tree.
- Selected object details.
- Console errors.
- Compile status.

### Task Board

- Planned, In progress, Blocked, Done.
- Agent owner.
- Dependencies.
- Validation state.

### Validation Center

- InputValidationResult list.
- Play Mode smoke test checklist.
- Console error snapshot.

### Settings

- LLM provider.
- Model.
- API key storage reference.
- Unity Bridge URL.
- Workspace paths.

## Local Storage

MVP can start with files:

- `ProjectState`: `schemas/project_state.schema.json`
- `TaskGraph`: `schemas/task_graph.schema.json`
- `AgentRunLog`: `schemas/agent_run_log.schema.json`
- `InputValidationResult`: `schemas/input_validation_result.schema.json`

Later migration:

- SQLite for run history and task board.
- Markdown files remain user-editable source documents.

## Internal API

| endpoint | method | purpose |
| --- | --- | --- |
| `/project/state` | GET/PUT | Read/update ProjectState |
| `/tasks` | GET/PUT | Read/update TaskGraph |
| `/agent/run` | POST | Start an agent run |
| `/unity/status` | GET | Proxy Unity Bridge status |
| `/validation/input` | POST | Run or record input validation |
| `/documents/:kind` | GET/PUT | Read/update Markdown documents |

## MVP Acceptance Criteria

- User can open a workspace and see ProjectState.
- User can view Unity Bridge status.
- User can view/edit GDD and technical design markdown.
- User can see TaskGraph grouped by status.
- User can trigger `unity_get_status` through the bridge.
- User can load prior AgentRunLog entries.

## Non-MVP

- Visual scene editing.
- Full LLM chat orchestration.
- Multi-user collaboration.
- Cloud sync.
- Asset generation.
