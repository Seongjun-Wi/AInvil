# AInvil Release Level Definitions

This document prevents the current Core RC result from being overstated.

## Core Release Ready

AInvil Core is Core Release Ready when:

- Operational graph classification is maintained.
- Unity Bridge health is Passed.
- Unity compile check is Passed.
- Console error count is 0 for the operational smoke evidence.
- Hierarchy inspection and validation probe pass.
- Non-sample Operational Passed evidence exists.
- Production Core review is Approved by criteria-based evaluation.
- Release readiness gates report Release Ready.
- Productization has no release blockers.

This level proves the AInvil Core smoke and evidence pipeline.

## Product MVP Ready

Product MVP Ready requires Core Release Ready plus a verified user-facing production workflow:

- User request becomes feature, requirement, task, and acceptance criteria.
- A real Unity change can be dry-run and applied.
- Compile recovery works on a project-specific feature.
- Play Mode validation covers real gameplay acceptance criteria.
- Traceability and dashboard reflect the real project workflow.

The current RC does not claim this level.

## Public Release Ready

Public Release Ready requires Product MVP Ready plus installation and support maturity:

- Fresh workspace installation has been independently validated.
- Quickstart is sufficient for a new user.
- Error messages are actionable for common setup failures.
- Package source and install artifact boundaries are clear.
- Regression suite is part of the release checklist.
- Known limitations are documented.

The current RC does not claim this level until fresh workspace verification is executed successfully.

## Current Classification

Current status: `Core Release Ready / Release Candidate`.

Not claimed:

- `Product MVP Ready`
- `Public Release Ready`
