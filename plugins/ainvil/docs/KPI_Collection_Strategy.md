# KPI Collection Strategy

## 1. Purpose

The KPI Collection Strategy defines how AInvil gathers KPI evidence without adding unnecessary process overhead.

KPI collection should support better product decisions. It should not become a separate bureaucracy.

## 2. Collection Sources

| source | KPI evidence |
| --- | --- |
| Production State Graph | Traceability coverage, validation coverage, open decisions, blockers, resume state. |
| RFC records | RFC throughput, decision latency, expected KPI impact, migration completeness. |
| Review records | Review usefulness, review precision, recommendation acceptance, false recommendations, missed risks. |
| Validation evidence | Validation coverage, unsupported confidence count, regression count. |
| Benchmark reports | Benchmark progression, regression count, capability deltas. |
| Architecture Retrospectives | Friction, ignored documents, missing recommendations, governance value, lessons learned. |
| Conversation logs or summaries | User correction rate, user override rate, conversation efficiency, confirmation quality. |
| Implementation history | Time to implementation, documentation maintenance cost, traceability maintenance cost. |

## 3. Collection Cadence

| cadence | activity |
| --- | --- |
| Per significant change | Record expected KPI impact in RFC or implementation plan. |
| Per review | Mark useful findings, false positives, missing recommendations, and accepted recommendations. |
| Per validation run | Record validation level and evidence links. |
| Per benchmark run | Update benchmark progression and regression count. |
| Per milestone | Produce KPI Dashboard and Architecture Retrospective. |
| Per major release | Compare KPI trends against previous release and note accepted regressions. |

## 4. Manual First, Automated Later

At Foundation stage, KPI collection may be manual and file-based.

Manual collection should focus on:

- A small set of high-signal KPIs.
- Clear evidence links.
- Honest unknown values.
- Trend notes rather than false precision.

Automation should be introduced only after the team knows which KPIs are actually useful.

## 5. Minimum KPI Set

Every milestone should track at least:

- Traceability coverage.
- Validation coverage.
- Recommendation acceptance rate.
- False recommendation rate.
- Unknown handling rate.
- User correction rate.
- Benchmark progression.
- Regression count.
- Governance compliance.
- Resume time.

## 6. Unknown And Partial Data

Missing KPI data should be recorded as `Unknown`, not guessed.

Use:

- `Unknown`: no usable data exists.
- `Not Collected`: collection was intentionally skipped.
- `Not Applicable`: KPI does not apply to the milestone.
- `Partial`: data exists but is incomplete.

Unknown KPI values should become retrospective findings when they block release confidence.

## 7. Cost Control

KPI collection should itself be measured.

If documentation maintenance cost or traceability maintenance cost becomes too high, AInvil should either simplify the process or prioritize automation.

The framework should make AInvil more evidence-driven without making normal development feel ceremonial.
