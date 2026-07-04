# Production State Graph Migration Guide

## 1. Purpose

This guide explains how existing AInvil Markdown documents map into the Phase 1 Production State Graph.

The graph should be introduced gradually. Do not delete or replace readable project documents. Use the graph as the operational index that connects them.

## 2. Document Mapping

| existing document | graph node mapping | notes |
| --- | --- | --- |
| GDD Design Intent / Pillars | `Vision`, `Feature`, `Requirement` | Use `Vision` for long-term fantasy and player experience. |
| GDD Systems | `Feature`, `Requirement`, `TechnicalSystem` | Link systems to requirements with `derives_from` or `maps_to`. |
| Design Decision Log row | `DesignDecision` | Confirmed decisions can `confirms` requirements or features. Old decisions can be `Superseded`. |
| Feature Spec | `Feature`, `FeatureSpec`, `Requirement`, `AcceptanceCriterion` | Feature Spec document path should be stored in node `refs`. |
| Technical Design system | `TechnicalSystem` | Link to requirements and implementation tasks. |
| Technical Design task row | `ImplementationTask` | Link task to requirement with `implements`. |
| Project Structure entry | `UnityTarget` | Store path, target kind, and related requirement. |
| Scene Blueprint | `UnityTarget` | Scene and hierarchy expectations become Unity targets. |
| Component Contract | `UnityTarget` | Component/script contract becomes script/component target. |
| Prefab Contract | `UnityTarget` | Prefab contract becomes prefab target. |
| Input Spec row | `InputSpec` | Link input to requirement and acceptance criterion. |
| Acceptance Criteria row | `AcceptanceCriterion` | Link to requirement and validation evidence. |
| Playtest Report | `ValidationEvidence` | Link evidence to acceptance criteria or features with `validates`. |
| Input Validation Result | `ValidationEvidence` | Use tool, before/after state, console, and status in evidence details. |
| Project Health Report | `ProjectHealth`, `Risk`, `NextAction` | Health summary should be a graph snapshot. |
| Project Dashboard | derived view | Dashboard should read from graph facts and not compete with graph state. |
| Traceability Matrix | derived view | Matrix rows are graph paths from `Vision`/`Requirement` to `ValidationEvidence`. |

## 3. Minimal Migration Steps

1. Create or update `state/production_state_graph.json`.
2. Add one `Vision` node for the current confirmed game identity.
3. Add the current milestone as a `Milestone` node.
4. Add confirmed features, requirements, tasks, Unity targets, input specs, acceptance criteria, and validation evidence that are already documented.
5. Add `derives_from`, `implements`, `maps_to`, `validates`, and `next_step_for` edges.
6. Add open questions and blockers as `OpenQuestion` or `Risk` nodes.
7. Add one `NextAction` node that references a real task, question, risk, or validation gap.
8. Run `node scripts/validate-production-state-graph.mjs`.

## 4. Ownership During Migration

- Director Layer confirms the `Vision`, `ProjectHealth`, high-level `Risk`, and `NextAction` nodes.
- Orchestrator checks edge consistency and sequencing.
- GDD Agent maps design documents into `DesignDecision`, `Requirement`, `Feature`, `FeatureSpec`, `TechnicalSystem`, `AcceptanceCriterion`, and `OpenQuestion`.
- Unity Agent maps implementation documents and project state into `ImplementationTask` and `UnityTarget`.
- Input Agent maps input specs and playtest reports into `InputSpec` and `ValidationEvidence`.

## 5. Remaining Future Work

- Automatic Markdown-to-graph extraction.
- Graph-to-dashboard generation.
- Graph-to-traceability-matrix generation.
- Conflict and stale node detection.
- Versioned graph snapshots per milestone.
- Graph diff reports.
