# AInvil Production Intelligence Engine

## 1. Purpose

The Production Intelligence Engine is AInvil's first operational reasoning layer.

The Production State Graph is the project's memory. The Production Intelligence Engine reads that graph and produces evidence-backed operational insight.

It does not modify Unity, generate gameplay code, edit documents, or mutate the graph. It is read-only in Phase 1.

```text
Production State Graph
  -> Production Intelligence Engine
    -> Production Intelligence Report
      -> Director Layer
        -> Orchestrator
          -> GDD Agent / Unity Agent / Input Agent
```

## 2. Inputs

- `state/production_state_graph.json`.
- `schemas/production_state_graph.schema.json`.

Future inputs may include graph snapshots, validation logs, playtest reports, and CI reports, but Phase 1 uses only the graph.

## 3. Outputs

- `reports/production_intelligence_report.json`.
- Human-facing Production Health Report generated from the report model.
- Recommendations that reference real graph nodes.
- Coverage findings that reference real graph nodes.
- Risks supported by evidence from graph nodes and edges.

## 4. Responsibilities

The engine calculates and reports:

- Production Health.
- Coverage Analysis.
- Risk Analysis.
- Project Health Summary.
- Next Recommended Action.
- Director-ready operational summary.

## 5. Boundaries

The engine must not:

- Modify the Production State Graph.
- Modify Unity.
- Generate scripts.
- Edit scenes, prefabs, or assets.
- Invent evidence.
- Recommend arbitrary work without graph references.

If evidence is insufficient, report `Unknown`.

## 6. Health Model

Health is categorical and evidence-backed. Do not fabricate numeric scores.

Allowed health values:

- `Green`: graph evidence shows the area is healthy.
- `Yellow`: graph evidence shows known gaps or partial coverage.
- `Red`: graph evidence shows blocking or severe risk.
- `Unknown`: graph evidence is insufficient.

Health categories:

| category | evidence |
| --- | --- |
| Vision Health | Vision node exists, current vision is referenced by milestone/features, no vision conflict risk. |
| Design Health | Requirements, features, acceptance criteria, open questions, design decisions. |
| Technical Health | Implementation tasks, Unity targets, technical risks, blocked implementation. |
| Documentation Health | FeatureSpec nodes, document refs, traceability paths. |
| Validation Health | ValidationEvidence nodes and validation levels. |
| Production Health | Milestone, blocked tasks, risks, next actions, ownership. |

## 7. Coverage Model

Coverage analysis checks graph links:

- Requirement -> FeatureSpec.
- Requirement -> ImplementationTask.
- Feature -> UnityTarget.
- Task -> ValidationEvidence.
- AcceptanceCriterion -> ValidationEvidence.
- UnityTarget -> Requirement.

Missing links are reported as findings, not guessed.

## 8. Risk Model

Every risk must include:

- Reason.
- Impact.
- Suggested mitigation.
- Evidence node IDs.

Initial risk rules:

- Blocked nodes create production risk.
- Requirements without implementation tasks create implementation risk.
- Acceptance criteria without validation evidence create validation risk.
- Unity targets without requirement paths create traceability risk.
- Many open questions create design risk.
- Missing milestone ownership creates production risk.

## 9. Recommendation Model

Recommendations must reference real graph nodes. Examples:

- Complete missing requirement.
- Create or update Feature Spec.
- Implement task for requirement.
- Validate acceptance criterion.
- Resolve open question.
- Review blocked task.

The engine should prefer the highest-impact missing link or blocker over arbitrary work.

## 10. Director Integration

The Director Layer should consume the Production Intelligence Report instead of directly reasoning from raw graph nodes whenever possible.

Director uses the report to:

- Protect vision.
- Review production health.
- Warn about design drift or validation gaps.
- Decide whether milestone review should proceed.
- Provide direction to the Orchestrator.

The Orchestrator consumes recommendations and turns them into routed work for existing specialist agents.

## 11. Future Evolution

Future phases can add:

- Historical graph snapshots.
- Trend detection.
- Stale/conflict detection.
- Graph-to-dashboard generation.
- Graph-to-traceability generation.
- CI and Unity validation ingestion.
- Milestone readiness checks.
- Production risk forecasting.
