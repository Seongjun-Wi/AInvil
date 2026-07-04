# AInvil Benchmark Dataset Structure

## 1. Purpose

Benchmark datasets define repeatable evaluation cases for AInvil.

They are not production project files. They are controlled test inputs used to measure whether AInvil behaves more like an AI Game Production Operating System over time.

## 2. Location

Benchmark cases live in:

```text
benchmarks/datasets/
```

Benchmark reports live in:

```text
benchmarks/reports/
```

## 3. Dataset Contract

Each dataset file is a JSON object with:

| field | required | purpose |
| --- | --- | --- |
| `schemaVersion` | yes | Dataset schema version. |
| `benchmarkId` | yes | Stable benchmark identifier. |
| `category` | yes | Benchmark suite category. |
| `title` | yes | Human-readable case name. |
| `version` | yes | Dataset case version. |
| `inputs` | yes | Source material given to AInvil. |
| `expectedObservations` | yes | Problems, strengths, or gaps AInvil should notice. |
| `expectedRecommendations` | yes | Recommendations AInvil should make or approximate. |
| `scoringCriteria` | yes | Case-specific scoring expectations. |
| `failureModes` | yes | Behaviors that should reduce score or fail the case. |

## 4. Supported Categories

- Design Review.
- GDD Completion.
- Technical Translation.
- Production Planning.
- Unity Production.
- Validation.
- Project Management.
- Director Quality.

## 5. Input Types

Inputs may include:

- `summary`: short project or scenario description.
- `documents`: GDD excerpts, technical design fragments, feature specs, review records, or conflicting notes.
- `projectState`: current milestone, active feature, open decisions, blockers, and validation state.
- `graphFacts`: simplified Production State Graph facts.
- `traceabilityRows`: simplified traceability matrix rows.
- `unityFacts`: simplified scene, prefab, script, data, or validation facts.

Datasets should avoid relying on hidden evaluator knowledge. If AInvil needs a fact, it should appear in the inputs.

## 6. Authoring Rules

- Keep each case focused on one primary capability.
- Include enough ambiguity to test reasoning, but not so much that every answer is equally valid.
- Prefer expected observations over exact expected wording.
- Mark creative alternatives as acceptable when they preserve user intent.
- Include failure modes for hallucination, unsupported implementation claims, weak evidence use, and creative overreach.
- Version datasets when expected behavior changes.

## 7. Release Use

Before a major AInvil architectural release:

1. Run every benchmark dataset.
2. Score results with `templates/scoring_rubric.md`.
3. Record results with `templates/benchmark_report.md`.
4. Compare with the previous release.
5. Treat regressions in creativity preservation, evidence usage, validation honesty, or traceability as release blockers unless explicitly accepted.
