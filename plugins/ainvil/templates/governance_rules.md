# Governance Rules: {{GameTitle}}

## 1. Purpose

Governance rules define when AInvil should request review, block progression, or ask for user confirmation.

## 2. Rules

| rule id | rule | trigger | required review | enforcement | status |
| --- | --- | --- | --- | --- | --- |
| GOV-Validation-001 | A feature should not be marked Validated without ValidationEvidence. | Feature status becomes Validated. | Validation Review | Block status change until evidence exists. | Active |
| GOV-Production-001 | High-complexity features should receive Production Review before implementation. | Feature complexity is High or Very High. | Production Review | Request review before Unity implementation. | Active |
| GOV-Vision-001 | Major gameplay changes should receive Vision Review. | Core loop, fantasy, genre, or player-facing rule changes. | Vision Review | Ask user for confirmation before implementation. | Active |
| GOV-Technical-001 | Risky architecture changes should receive Technical Review. | New architecture, package, system split, persistence, networking, or large refactor. | Technical Review | Request review before implementation. | Active |
| GOV-Milestone-001 | Milestones should receive Validation Review before closure. | Milestone status moves toward Closed. | Validation Review | Block closure if validation evidence is missing. | Active |

## 3. Governance Outcomes

Allowed outcomes:

- Proceed.
- Changes Requested.
- Blocked.
- Needs user decision.
- Deferred.

## 4. Notes

Governance does not override the user. It creates structured decision points and evidence trails.
