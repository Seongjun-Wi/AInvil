# AInvil Workflow Transition Planner

## 1. Purpose

The Workflow Transition Planner is a read-only planning layer.

It consumes the Workflow Runtime Report and produces possible workflow transition candidates. It does not execute transitions, mutate state, update documents, modify Unity, create reviews, run benchmarks, or update KPI dashboards.

## 2. Position In The Roadmap

```text
Workflow Runtime Report
  -> Workflow Transition Planner
  -> Workflow Transition Approval Model
  -> Workflow Runtime Engine
  -> Automated production lifecycle execution
```

This planner is the bridge between workflow awareness and future runtime execution.

## 3. Transition Candidate Model

Each transition candidate includes:

- `transitionId`
- `transitionType`
- `sourceState`
- `targetState`
- `targetArtifactId`
- `targetArtifactType`
- `status`
- `priority`
- `reason`
- `prerequisites`
- `missingPrerequisites`
- `evidenceRefs`
- `recommendedBy`
- `confidence`
- `safetyNotes`

Allowed statuses:

- `Available`
- `Blocked`
- `Not Applicable`
- `Needs Review`

Allowed priorities:

- `P0`
- `P1`
- `P2`
- `Future`

## 4. Initial Transition Types

- `ResolveValidationGap`
- `RequestReview`
- `AddressBlockedNode`
- `ResolveOpenQuestion`
- `ImproveTraceability`
- `RunBenchmark`
- `UpdateKpiDashboard`

## 5. Recommendation Priority

The planner prefers:

1. Resolve blockers.
2. Resolve validation gaps.
3. Request required reviews.
4. Resolve open questions.
5. Improve traceability.
6. Run benchmark.
7. Update KPI dashboard.

If no safe transition is available, the planner returns `NoSafeTransition`.

## 6. Files

```text
core/workflow-transitions.mjs
schemas/workflow_transition_plan.schema.json
reports/workflow_transition_plan.json
scripts/generate-workflow-transition-plan.mjs
scripts/validate-workflow-transition-plan.mjs
templates/workflow_transition_plan.md
```

## 7. CLI Integration

```bash
node plugins/ainvil/cli/ainvil-cli.mjs transitions
```

The command prints available transitions, blocked transitions, and the safest recommended transition.

## 8. Safety Boundary

This is not the runtime engine.

It never claims that a transition happened. It only states whether a transition is available, blocked, not applicable, or needs review based on existing evidence.

The next read-only safety layer is documented in `AInvil_Workflow_Transition_Approval_Model.md`.
