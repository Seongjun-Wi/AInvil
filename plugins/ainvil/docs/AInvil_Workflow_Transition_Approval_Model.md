# AInvil Workflow Transition Approval Model

## 1. Purpose

The Workflow Transition Approval Model is the safety layer before any future Workflow Runtime Engine.

It consumes the Workflow Transition Plan and classifies each transition by approval requirement, evidence requirement, review requirement, safety level, and execution readiness.

It does not execute transitions. It does not mutate files, project state, Unity, reviews, benchmark reports, KPI dashboards, or Markdown documents.

## 2. Approval Classes

- `AutoEligible`
- `UserApprovalRequired`
- `ReviewRequired`
- `EvidenceRequired`
- `Blocked`
- `Forbidden`

## 3. Execution Readiness

- `Ready`
- `NotReady`
- `NotApplicable`

## 4. Safety Levels

- `LowRisk`
- `MediumRisk`
- `HighRisk`
- `Destructive`
- `Unknown`

## 5. Conservative Approval Rules

### AutoEligible

Only read-only or deterministic report/validation transitions can be auto-eligible later.

Examples:

- Generate workflow report.
- Generate transition plan.
- Run benchmark validation.
- Refresh deterministic reports when no project state is mutated.

### UserApprovalRequired

Required when a transition changes creative intent, scope, priority, milestone meaning, or design direction.

### ReviewRequired

Required when governance calls for Vision, Design, Technical, Production, or Validation Review.

### EvidenceRequired

Required before claiming implementation, completion, validation, acceptance closure, or validation-level promotion.

### Blocked

Used when prerequisites are missing.

### Forbidden

Used for transitions that must never be automated:

- Silently overriding user creative intent.
- Deleting source-of-truth documents.
- Marking validation complete without evidence.
- Claiming Unity Play Mode verification without evidence.
- Replacing production vision without explicit user confirmation.

## 6. Preconditions Policy

- Validation transitions require validation evidence before confidence changes.
- Implementation transitions require required reviews before production commitment.
- Design authority transitions require user approval.
- Traceability transitions require graph references.
- Release-quality claims require benchmark evidence.
- KPI dashboard updates require real KPI evidence.

## 7. Files

```text
core/workflow-approvals.mjs
schemas/workflow_transition_approval.schema.json
reports/workflow_transition_approval.json
scripts/generate-workflow-transition-approval.mjs
scripts/validate-workflow-transition-approval.mjs
templates/workflow_transition_approval.md
```

## 8. CLI Integration

```bash
node plugins/ainvil/cli/ainvil-cli.mjs approvals
```

The command shows approval classes, readiness, blocked/forbidden transitions, and safest next approved action if one exists.

## 9. Future Path

```text
Workflow Runtime Report
  -> Workflow Transition Planner
  -> Workflow Transition Approval Model
  -> Workflow Runtime Engine
  -> Automated production lifecycle execution
```

The approval model prepares AInvil for safe automation without introducing execution.
