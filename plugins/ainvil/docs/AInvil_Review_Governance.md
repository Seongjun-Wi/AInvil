# AInvil Review & Governance System

## 1. Purpose

The Review & Governance System makes AInvil behave more like a real game studio.

Real studios do not rely only on intelligent individuals. They use structured reviews, decision records, approval gates, and evidence-backed governance rules. AInvil should do the same without adding new specialist agents.

The Review & Governance System defines reusable review workflows performed by existing layers:

- Director Layer.
- Orchestrator.
- GDD Agent.
- Unity Agent.
- Input Agent.
- User as Creative Owner.

## 2. Architecture

```text
Production State Graph
  -> Production Intelligence Engine
    -> Review & Governance System
      -> Director Layer
        -> Orchestrator
          -> GDD Agent / Unity Agent / Input Agent
```

Production Intelligence explains the current operational state. Review & Governance turns important decisions into structured review records with findings, recommendations, decisions, confidence, and evidence.

## 3. Review Types

| review type | purpose | primary reviewer role |
| --- | --- | --- |
| Vision Review | Check whether an artifact supports the game's core fantasy and long-term identity. | Director Layer |
| Design Review | Evaluate core loop, motivation, progression, replayability, and UX. | Director Layer / GDD Agent |
| Technical Review | Evaluate architecture, complexity, dependencies, risks, and maintainability. | Unity Agent / Orchestrator |
| Production Review | Evaluate scope, milestone fit, capacity, cost, and priority. | Director Layer / Orchestrator |
| Validation Review | Evaluate acceptance coverage, validation evidence, test coverage, and unknown areas. | Input Agent / Orchestrator |

## 4. Review Lifecycle

Major artifacts may progress through:

```text
Draft
  -> Review Requested
  -> Review In Progress
  -> Changes Requested
  -> Approved
  -> Implemented
  -> Validated
  -> Closed
```

Allowed exceptional states:

- Rejected.
- Deferred.
- Superseded.

## 5. Review Record

Each review record contains:

- Review ID.
- Artifact ID.
- Reviewer Role.
- Date.
- Review Type.
- Lifecycle State.
- Findings.
- Strengths.
- Weaknesses.
- Risks.
- Recommendations.
- Decision.
- Confidence.
- Evidence.

Review records should reference Production State Graph node IDs when possible. This makes major decisions traceable.

## 6. Governance Rules

Initial governance rules:

1. A feature should not be marked `Validated` without `ValidationEvidence`.
2. Production Review should occur before implementation of high-complexity or high-risk features.
3. Vision Review should occur when major gameplay changes are introduced.
4. Technical Review should precede risky architectural changes.
5. Validation Review should occur before milestone closure.
6. Changes Requested should create a follow-up NextAction, OpenQuestion, Risk, or ImplementationTask in the Production State Graph.
7. Approved review decisions do not override the user's creative ownership. User confirmation is required for scope, priority, or player-facing design changes.

## 7. Director Integration

The Director Layer should synthesize:

- Production Intelligence Report.
- Review outcomes.
- Open review decisions.
- Governance violations.

The Director should not rely only on Production Intelligence. Review records provide the studio-like decision trail.

## 8. Orchestrator Integration

The Orchestrator coordinates reviews:

- Identify which review types are needed.
- Route review work to existing roles.
- Preserve Review IDs in handoffs.
- Update graph nodes and next actions through the correct owner.
- Prevent implementation or closure when governance gates are violated.

## 9. Boundaries

The Review & Governance System does not:

- Add new specialist agents.
- Replace the Production State Graph.
- Replace Production Intelligence.
- Directly modify Unity.
- Automatically approve user-facing changes.

It adds structured decision-making on top of existing intelligence and execution layers.

## 10. Future Evolution

Future phases can add:

- Review dashboards.
- Governance violation reports.
- Review-to-graph synchronization.
- Approval workflows.
- Team roles and sign-off policies.
- Release readiness gates.
