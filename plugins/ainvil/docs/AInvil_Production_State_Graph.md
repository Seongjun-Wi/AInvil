# AInvil Production State Graph

## 1. Purpose

The Production State Graph is AInvil's operational backbone.

Markdown documents remain the human-facing source-of-truth views. The graph does not replace the GDD, Technical Design, Feature Specs, Project Structure, Input Spec, or validation reports. Instead, it connects their production facts into a versioned, inspectable JSON graph that AInvil can use to resume work, sequence tasks, detect missing links, report health, and recommend next actions.

The graph answers:

- What is the current vision?
- What has been decided?
- What is still open?
- What requirements exist?
- Which tasks implement which requirements?
- Which Unity targets are tied to each feature?
- Which features are implemented?
- Which features are validated?
- What evidence exists?
- What is stale, blocked, or conflicting?
- What should be done next?

## 2. Graph Model

```text
Vision
  -> DesignDecision
  -> Requirement
  -> Feature / FeatureSpec
  -> ImplementationTask
  -> UnityTarget
  -> InputSpec
  -> AcceptanceCriterion
  -> ValidationEvidence
  -> ProjectHealth
  -> NextAction
```

## 3. Node Types

| node type | purpose | typical owner |
| --- | --- | --- |
| Vision | Long-term identity, player fantasy, intended experience. | Director Layer |
| Milestone | Production milestone or playable target. | Director Layer / Orchestrator |
| DesignDecision | Confirmed, proposed, superseded, or deferred design decision. | GDD Agent |
| Requirement | Requirement derived from vision, GDD, or feature specs. | GDD Agent |
| Feature | Player-facing feature or production feature grouping. | GDD Agent |
| FeatureSpec | Human-facing feature spec document or section. | GDD Agent |
| TechnicalSystem | Technical system from System/Technical Design. | GDD Agent / Unity Agent |
| ImplementationTask | Work item implementing requirements. | Orchestrator / Unity Agent |
| UnityTarget | Scene, prefab, script, component, material, ScriptableObject, or data asset. | Unity Agent |
| InputSpec | Input row, binding, context, or validation target. | Input Agent |
| AcceptanceCriterion | BDD or equivalent acceptance criterion. | GDD Agent |
| ValidationEvidence | Compile, inspection, Play Mode, runtime, or user confirmation evidence. | Input Agent / Unity Agent |
| Risk | Design, technical, validation, production, or scope risk. | Director Layer / Orchestrator |
| OpenQuestion | User/design/technical decision still unresolved. | Director Layer / GDD Agent |
| ProjectHealth | Health snapshot for design, implementation, documentation, validation, debt, and risk. | Director Layer |
| NextAction | Recommended next action tied to a real task, question, risk, or validation gap. | Director Layer / Orchestrator |

## 4. Edge Types

| edge type | meaning |
| --- | --- |
| derives_from | Child node derives from a higher-level source. |
| confirms | A decision confirms a requirement, feature, or direction. |
| supersedes | New node replaces an older node. |
| depends_on | Work depends on another node. |
| implements | Task or Unity target implements a requirement or feature. |
| maps_to | Document or requirement maps to Unity/input/data target. |
| validates | Evidence validates acceptance criteria, requirements, or features. |
| blocked_by | Node is blocked by a question, risk, missing task, or failed validation. |
| affects | Risk, decision, or change affects another node. |
| owned_by | Node is owned by an agent/layer. |
| next_step_for | Next action is the next step for another node. |

## 5. IDs and Versioning

- Graph files use `schemaVersion`.
- Each graph uses `graphId`, `projectId`, `version`, `createdAt`, and `updatedAt`.
- Node IDs should be stable and human-readable, for example `VISION-Core`, `FEAT-Battle-001`, `REQ-Battle-001`, `TASK-Battle-001`, `UNITY-PlayerPrefab`, `AC-Battle-001`.
- Edge IDs should be stable enough for diff review, for example `EDGE-REQ-Battle-001-IMPLEMENTS-TASK-Battle-001`.
- Superseded facts are not deleted immediately. Prefer `status: Superseded` plus a `supersedes` edge.

## 6. Status Values

Allowed node statuses:

- Proposed.
- Confirmed.
- Planned.
- In Progress.
- Implemented.
- Validated.
- Blocked.
- Deferred.
- Cut.
- Superseded.
- Needs design confirmation.
- Needs technical confirmation.
- Needs Requirement Definition.
- Needs Acceptance Criteria.
- Needs validation.
- Stale.
- Conflict.

## 7. Validation Levels

Validation level and confidence remain separate. Allowed validation levels:

- Not Checked.
- Document Review.
- Static Analysis.
- Unity Inspection.
- Compile Verified.
- Play Mode Verified.
- Runtime Tested.
- User Confirmed.

Never claim a feature works unless the corresponding validation evidence exists in the graph or a linked validation report.

## 8. Ownership Boundaries

| owner | graph responsibility |
| --- | --- |
| Director Layer | Vision, ProjectHealth, Risk, high-level NextAction, design drift and scope concerns. |
| Orchestrator | Milestone, sequencing, dependency edges, next-step routing, graph consistency. |
| GDD Agent | DesignDecision, Requirement, Feature, FeatureSpec, TechnicalSystem, AcceptanceCriterion, OpenQuestion. |
| Unity Agent | ImplementationTask status, UnityTarget nodes, implementation edges, compile/inspection evidence. |
| Input Agent | InputSpec nodes, ValidationEvidence nodes, playability status, runtime validation edges. |

Do not make every agent edit everything. Each agent updates the nodes and edges it owns, then the Orchestrator checks graph consistency.

## 9. Sync With Existing Documents

The graph is the operational backbone. Human-facing documents are views or detailed source documents.

- GDD and System Design provide Vision, Feature, Requirement, OpenQuestion, and DesignDecision nodes.
- Technical Design provides TechnicalSystem, ImplementationTask, and AcceptanceCriterion nodes.
- Feature Specs provide Feature, Requirement, AcceptanceCriterion, and traceability details.
- Project Structure, Scene Blueprint, Component Contract, and Prefab Contract provide UnityTarget nodes.
- Input Spec provides InputSpec nodes.
- Playtest reports and input validation results provide ValidationEvidence nodes.
- Project Dashboard and Traceability Matrix are derived views from the graph.

When documents and graph disagree, use the normal source-of-truth order for design meaning, then update the graph as the operational index.

## 10. Phase 1 Limits

Phase 1 is intentionally file-based:

- No database.
- No separate app.
- No runtime orchestration.
- No automatic document parser.
- Minimal validator checks uniqueness, edge references, statuses, validation levels, and next-action references.

Future phases can add document importers, graph diffing, conflict detection, dashboard generation, and task graph execution.
