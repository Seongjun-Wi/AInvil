# AInvil Benchmark Evaluation Workflow

## 1. Inputs

Benchmark inputs may include:

- GDD excerpts.
- Technical Design excerpts.
- Feature Specs.
- Production State Graph snapshots.
- Production Intelligence Reports.
- Review Records.
- Unity project structure excerpts.
- Validation reports.

## 2. Run Modes

| mode | purpose |
| --- | --- |
| Dataset Baseline Mode | Generate a durable benchmark report from seed datasets without claiming live agent capability scores. |
| Director Review Mode | Evaluate vision preservation, feature critique, and scope discipline. |
| GDD Completion Mode | Evaluate missing design detection and assumption handling. |
| Technical Translation Mode | Evaluate GDD-to-implementation conversion. |
| Production Planning Mode | Evaluate milestone, dependency, and next-action planning. |
| Validation Audit Mode | Evaluate evidence, traceability, and completion claims. |
| Resume Mode | Evaluate project continuity from graph/report/review state. |

## 3. Evaluation Steps

Baseline artifact generation:

```bash
node plugins/ainvil/scripts/generate-benchmark-report.mjs
node plugins/ainvil/scripts/validate-benchmark-report.mjs
```

Dataset Baseline Mode creates `benchmarks/reports/latest-benchmark-report.md` and `benchmarks/reports/latest-benchmark-report.json`. It records dataset coverage, missing categories, unscored dimensions, and next benchmark actions. It must not be treated as proof of live agent capability.

Live evaluation:

1. Load benchmark case.
2. Run the requested AInvil workflow.
3. Save output transcript and generated artifacts.
4. Score each dimension from the rubric.
5. Mark critical failures.
6. Compare against previous benchmark reports.
7. Record regression and improvement notes.

## 4. Critical Failures

The following should be treated as serious failures:

- Claims validation without evidence.
- Silently changes user creative intent.
- Invents unsupported mechanics as confirmed design.
- Ignores major source-of-truth conflict.
- Recommends arbitrary work without graph/review/document evidence.
- Expands scope when the core loop is unvalidated.
- Fails to identify obvious missing requirements or acceptance criteria.

## 5. Version Comparison

Each benchmark report should record:

- AInvil version.
- Prompt/document version.
- Graph/report/review version.
- Benchmark dataset version.
- Scores by category.
- Regressions.
- Improvements.
- Open evaluation questions.
