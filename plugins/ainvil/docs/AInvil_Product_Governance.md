# AInvil Product Governance

## 1. Purpose

Product governance defines how AInvil evolves as a long-lived platform.

It protects compatibility, migration clarity, architectural traceability, and user trust as AInvil grows beyond an experimental plugin.

## 2. Breaking Architectural Changes

A change is breaking when it can invalidate existing projects, documents, state, reviews, prompts, schemas, validation evidence, or user expectations.

Breaking changes include:

- Removing or renaming Production State Graph node or edge types.
- Changing validation confidence semantics.
- Changing review lifecycle states or decision meanings.
- Changing agent authority boundaries.
- Changing Director Layer responsibility or execution authority.
- Making previously optional project state mandatory without migration.
- Replacing a source-of-truth contract.
- Changing benchmark scoring in a way that prevents version comparison.
- Removing templates, schemas, tools, or documents expected by existing workflows.
- Changing prompt hierarchy in a way that alters creative ownership, review, or validation policy.

## 3. Compatibility Expectations

AInvil should favor additive evolution.

Existing projects should continue to load, validate, and remain understandable unless a migration is explicitly provided.

Compatibility expectations:

- Add fields before renaming fields.
- Deprecate before removing.
- Preserve historical decision records.
- Keep old benchmark reports comparable when possible.
- Maintain validation confidence meaning across versions.
- Keep user creative ownership policy stable.
- Keep Unity Bridge as an implementation transport, not the product identity.

## 4. Deprecation Policy

Deprecated capabilities, fields, templates, or workflows should include:

- Deprecation reason.
- Replacement path.
- First version where deprecation applies.
- Earliest removal version.
- Migration instructions.
- Compatibility risk.

Deprecation should be visible in documentation before removal.

## 5. Migration Policy

Every breaking change requires a migration plan.

A migration plan should define:

- Affected files, schemas, prompts, reports, state, and workflows.
- Whether migration is automatic, manual, or mixed.
- Backward compatibility window.
- Validation checks after migration.
- Benchmark comparison requirements.
- Rollback strategy when possible.

Migrations should preserve meaning, not just file shape.

## 6. Versioning Strategy

AInvil should use semantic versioning for product releases:

| version part | meaning |
| --- | --- |
| Major | Breaking architectural or compatibility change. |
| Minor | Additive capability, non-breaking architecture, new benchmark suites, or new workflows. |
| Patch | Bug fix, clarification, validation fix, or non-behavioral documentation update. |

For internal contracts:

- Schemas should carry `schemaVersion`.
- Benchmark datasets should carry `version`.
- RFCs should carry status and decision date.
- Review records should preserve original decision state.
- Migration docs should identify source and target versions.

## 7. Release Expectations

Before a major or minor architectural release:

- Static plugin validation should pass.
- Harness validation should pass.
- Benchmark datasets should validate.
- Capability Benchmark reports should be produced or updated.
- Relevant RFCs should be accepted.
- Breaking changes should include migration guidance.
- Governance-impacting changes should update foundational docs.

Patch releases may skip full RFC review when they do not affect behavior, compatibility, or policy.

## 8. Governance Boundaries

Governance should make AInvil safer to evolve, not slower by default.

Use lightweight decisions for small changes. Use RFCs for changes that affect long-term architecture, compatibility, authority, state, validation, or product identity.

When uncertain, prefer a short RFC over an undocumented architectural change.
