# AInvil Architectural Principles

## 1. Purpose

These principles define the durable architectural constraints for AInvil.

Future work should be evaluated against them before adding features, agents, tools, prompts, or workflows.

## 2. Immutable Principles

### 2.1 Human Creativity Is Primary

The user is always the Creative Owner.

AInvil may critique, improve, structure, implement, and validate. It must not silently replace the user's intended game.

### 2.2 Operational State Is The Source Of Operational Truth

Markdown documents remain human-readable source material, but production status must be represented through operational state.

The Production State Graph, review records, validation evidence, benchmark reports, and decision history should make the current project truth inspectable and resumable.

### 2.3 Evidence Before Confidence

AInvil's confidence must follow the evidence.

If evidence is absent, AInvil should say `Unknown`, `Not Checked`, `Needs Review`, or `Needs Validation` instead of making unsupported claims.

### 2.4 Review Before Commitment

High-impact design, technical, production, or validation decisions should pass through the appropriate review before implementation or milestone closure.

Review is not bureaucracy. It is how AInvil protects the game from drift, conflict, weak assumptions, and avoidable risk.

### 2.5 Validation Before Completion

No feature should be considered complete only because it was documented or implemented.

Completion requires the validation evidence required by governance rules.

### 2.6 Production Systems Over Isolated Prompts

AInvil should not rely on disconnected prompts to simulate production discipline.

Important behavior should be supported by durable systems: state, review, governance, traceability, validation, benchmarks, and decision records.

### 2.7 Explicit Uncertainty Over Hallucinated Certainty

Uncertainty is a valid state.

AInvil should expose missing facts, conflicting documents, weak assumptions, and unknown validation status instead of filling gaps with false certainty.

### 2.8 Reusable Knowledge Over Repeated Prompting

Successful design patterns, failed approaches, production lessons, validation rules, and architectural decisions should become reusable knowledge.

The same reasoning should not need to be rediscovered from scratch in every conversation.

### 2.9 Traceability Over Convenience

Every major feature should be traceable from design intent to requirements, implementation tasks, Unity targets, input behavior, acceptance criteria, and validation evidence.

Convenient output that cannot be traced should be treated as incomplete.

### 2.10 Incremental Playability Over Broad Speculation

AInvil should prefer small, validated playable increments over broad, unfinished scope.

The core fantasy and core loop should be protected before optional systems expand the project.

### 2.11 Compatibility Before Reinvention

New architecture should extend existing contracts when possible.

Breaking changes require an RFC, migration plan, compatibility statement, and benchmark comparison.

### 2.12 Benchmarks Before Subjective Confidence

Major architectural improvements should be measured.

The AInvil Capability Benchmark should show whether a change improves or preserves design quality, traceability, validation honesty, evidence usage, and creative ownership.

## 3. Architectural Review Questions

Before accepting a significant architectural change, ask:

- Does this preserve human creative ownership?
- Does this strengthen operational truth?
- Does this improve evidence-backed confidence?
- Does this reduce hallucination or hidden assumptions?
- Does this improve traceability?
- Does this support review, validation, or benchmark measurement?
- Does this remain compatible with long-running projects?
- Does this make AInvil more like a durable production platform rather than a prompt collection?

If the answer is unclear, the change should enter the RFC process.
