# AInvil RFC Process

## 1. Purpose

The RFC process makes significant AInvil architectural evolution traceable.

It should be used when a change affects product identity, long-term architecture, operational state, agent boundaries, governance, validation, compatibility, or user-facing production workflow.

## 2. When An RFC Is Required

Create an RFC for:

- New architectural layers.
- Changes to the Director Layer, Orchestrator, specialist agent responsibilities, or authority boundaries.
- Production State Graph schema changes.
- Review & Governance lifecycle changes.
- Validation confidence model changes.
- Studio Playbook principle changes.
- Capability Benchmark scoring or release-gate changes.
- Breaking prompt hierarchy changes.
- Breaking template, schema, state, or report format changes.
- New persistent memory systems.
- New task execution, rollback, migration, or CI systems.

Small copy edits, non-breaking documentation clarification, seed benchmark additions, and bug fixes do not require an RFC unless they alter behavior or policy.

## 3. RFC Lifecycle

```text
Draft
  -> Review Requested
  -> Under Review
  -> Changes Requested
  -> Accepted
  -> Implemented
  -> Validated
  -> Superseded / Rejected / Withdrawn
```

### Draft

The proposal is being written. It may be incomplete.

### Review Requested

The author believes the proposal is ready for structured review.

### Under Review

The proposal is evaluated against the Manifesto, Architectural Principles, Product Governance, Studio Playbook, benchmark impact, and compatibility expectations.

### Changes Requested

Reviewers require revisions before acceptance.

### Accepted

The change is approved in principle but not necessarily implemented.

### Implemented

The accepted change has been applied.

### Validated

The change has passed required static validation, benchmark comparison, migration checks, and any applicable Unity or harness checks.

### Superseded

The RFC is replaced by a newer RFC.

### Rejected

The proposal should not proceed.

### Withdrawn

The proposal is intentionally abandoned by its author.

## 4. Required RFC Sections

Each RFC should include:

- RFC ID.
- Title.
- Status.
- Author.
- Date.
- Summary.
- Motivation.
- Non-goals.
- Affected systems.
- Design proposal.
- Alternatives considered.
- Compatibility impact.
- Migration plan.
- Validation plan.
- Benchmark impact.
- Risks.
- Open questions.
- Decision.
- Decision date.
- Decision rationale.
- Follow-up work.

## 5. Review Process

RFC review should evaluate:

- Alignment with the AInvil Manifesto.
- Alignment with Architectural Principles.
- Compatibility with existing project state and documents.
- Effect on human creative ownership.
- Effect on traceability and validation honesty.
- Effect on prompt stability and hallucination risk.
- Effect on long-running projects.
- Migration complexity.
- Benchmark impact.

If the RFC changes high-impact architecture, it should receive Vision, Technical, Production, and Validation Review records where appropriate.

## 6. Approval States

| state | meaning |
| --- | --- |
| `Draft` | Not ready for decision. |
| `Review Requested` | Ready for structured review. |
| `Changes Requested` | Must be revised. |
| `Accepted` | Approved for implementation. |
| `Implemented` | Applied to the product. |
| `Validated` | Proven through required checks. |
| `Rejected` | Should not proceed. |
| `Withdrawn` | Abandoned by author. |
| `Superseded` | Replaced by another RFC. |

## 7. Decision History

Accepted, rejected, superseded, and withdrawn RFCs should remain available.

Decision history is part of AInvil's product memory. It prevents the same architectural debates from repeating without context and helps future maintainers understand why the product evolved in a particular direction.

## 8. RFC Storage

RFCs should be stored in a future `rfcs/` directory using stable IDs such as:

```text
RFC-0001-production-state-graph.md
RFC-0002-director-layer.md
```

Until that directory exists, this process document defines the required lifecycle and content contract.
