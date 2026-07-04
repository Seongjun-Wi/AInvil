# Studio Playbook Integration Guide

## 1. Purpose

This guide explains how each AInvil layer should use the Studio Playbook without changing responsibilities.

The Playbook is shared policy. It does not replace:

- Production State Graph.
- Production Intelligence Engine.
- Review & Governance System.
- Director Layer.
- Orchestrator.
- Specialist Agents.

## 2. Integration by Layer

### Director Layer

Use the Playbook to:

- Protect creative ownership.
- Evaluate whether recommendations preserve the core fantasy.
- Require evidence before conclusions.
- Warn about scope creep.
- Decide when review is needed before commitment.
- Synthesize Production Intelligence and Review Outcomes through shared studio principles.

### Production Intelligence Engine

Use the Playbook to:

- Prefer `Unknown` over unsupported health claims.
- Keep findings evidence-backed.
- Avoid arbitrary recommendations.
- Highlight validation and traceability gaps.

The engine remains read-only.

### Review & Governance System

Use the Playbook to:

- Decide which review type is required.
- Enforce review-before-commitment.
- Enforce validation-before-completion.
- Record decisions with confidence and evidence.

### Orchestrator

Use the Playbook to:

- Route work according to evidence, review needs, and validation gaps.
- Keep recommendations scoped to the next production increment.
- Preserve Review IDs, graph node IDs, and validation expectations in handoffs.
- Ask the user before creative ownership boundaries are crossed.

### GDD Agent

Use the Playbook to:

- Preserve user intent.
- Improve design quality without silently changing the game.
- Mark unknowns and proposed defaults.
- Capture design lessons and reusable patterns.

### Unity Agent

Use the Playbook to:

- Prefer maintainability, traceability, and validation over speed.
- Keep prototype shortcuts visible.
- Avoid implementation that lacks requirements.
- Record technical debt and validation gaps.

### Input Agent

Use the Playbook to:

- Require evidence before claiming playability.
- Separate debug-hook success from player-input validation.
- Record validation gaps and unknowns.
- Feed validation lessons back into project knowledge.

## 3. Recommended Decision Flow

```text
Question / Task
  -> Check Studio Playbook principles
  -> Read graph/report/reviews/source documents as needed
  -> Identify required review or validation gate
  -> Route through existing owner
  -> Record decision, evidence, and next action
```

## 4. Anti-Patterns

Avoid:

- Making recommendations without evidence.
- Treating AI critique as user approval.
- Expanding scope before validating the core loop.
- Marking Unity-created work as complete without validation.
- Duplicating rules across prompts instead of referencing the Playbook.
- Letting technical convenience rewrite the user's game.
