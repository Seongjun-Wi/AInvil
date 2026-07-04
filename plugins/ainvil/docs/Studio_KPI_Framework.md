# Studio KPI Framework

## 1. Purpose

The Studio KPI Framework defines how AInvil measures whether it is becoming a better AI Game Production Operating System.

It is not a new production capability. It is the measurement system for AInvil's product evolution.

AInvil should not mature by feature count alone. It should mature when operational evidence shows that it improves design quality, production reliability, intelligence accuracy, user collaboration, and architectural stability.

## 2. KPI Principles

- Measure outcomes, not activity volume.
- Prefer trends over isolated snapshots.
- Separate useful friction from wasteful friction.
- Treat unknown values as valid data gaps.
- Connect KPI changes to RFCs, reviews, benchmarks, validation, and retrospectives.
- Avoid optimizing a single KPI at the expense of creative ownership or validation honesty.
- Use dogfooding evidence before claiming product maturity.

## 3. KPI Categories

### 3.1 Design KPIs

| KPI | definition | preferred direction |
| --- | --- | --- |
| Time to complete a GDD | Time from initial idea or incomplete GDD to review-ready GDD. | Down, without reducing quality. |
| Number of design revisions | Count of meaningful revisions before design approval. | Contextual. |
| Review acceptance rate | Percentage of design review recommendations accepted or modified. | Up, if recommendations remain high quality. |
| Design issue detection rate | Percentage of known design issues detected before implementation. | Up. |
| Missing design decision count | Count of unresolved design decisions at implementation start. | Down. |
| First playable scope clarity | Percentage of first playable requirements with clear acceptance criteria. | Up. |

### 3.2 Production KPIs

| KPI | definition | preferred direction |
| --- | --- | --- |
| Time to first playable | Time from approved concept or feature scope to playable validated increment. | Down, without reducing validation quality. |
| Resume time | Time required to recover current state, open decisions, blockers, and next action after a pause. | Down. |
| Traceability coverage | Percentage of requirements linked to feature specs, tasks, implementation targets, acceptance criteria, and evidence. | Up. |
| Validation coverage | Percentage of implemented features with required validation evidence. | Up. |
| Milestone completion reliability | Percentage of milestones completed with planned scope and required validation. | Up. |
| Documentation drift count | Count of detected mismatches between documents, graph, reviews, and implementation state. | Down. |

### 3.3 Intelligence KPIs

| KPI | definition | preferred direction |
| --- | --- | --- |
| Recommendation acceptance rate | Percentage of recommendations accepted or modified by the user/reviewer. | Up, with low false-positive rate. |
| False recommendation rate | Percentage of recommendations later judged unnecessary, misleading, or harmful. | Down. |
| Unknown handling rate | Percentage of unsupported claims correctly marked as unknown, not checked, or needing confirmation. | Up. |
| Review precision | Percentage of review findings that are actionable and relevant. | Up. |
| Risk detection accuracy | Percentage of material risks detected before they cause rework or failure. | Up. |
| Unsupported confidence count | Count of confident claims without evidence. | Down. |

### 3.4 User Experience KPIs

| KPI | definition | preferred direction |
| --- | --- | --- |
| User override rate | Percentage of AInvil decisions or recommendations overridden by the user. | Contextual. |
| User correction rate | Percentage of outputs requiring factual, intent, or scope correction. | Down. |
| Creative ownership preservation | Percentage of major changes that explicitly preserve or ask about user intent. | Up. |
| Conversation efficiency | Number of turns or minutes needed to reach a validated next action. | Down, without skipping confirmation. |
| Confirmation quality | Percentage of major creative or architectural decisions that ask the right confirmation question. | Up. |
| Friction report count | Count of user or retrospective complaints about process overhead. | Down, unless tied to valuable risk reduction. |

### 3.5 Product KPIs

| KPI | definition | preferred direction |
| --- | --- | --- |
| Benchmark progression | Capability Benchmark score trend across releases. | Up or stable with rationale. |
| Regression count | Count of benchmark, validation, or workflow regressions per release. | Down. |
| RFC throughput | Number of RFCs accepted, implemented, and validated per milestone. | Contextual. |
| Governance compliance | Percentage of significant changes that followed required RFC, review, migration, and validation rules. | Up. |
| Architectural stability | Frequency of breaking architectural changes or contract churn. | Down after Foundation. |
| Migration completeness | Percentage of breaking changes with complete migration guidance. | Up. |

## 4. KPI Interpretation Rules

KPIs should not be read mechanically.

- Lower design revisions may mean clarity, or it may mean insufficient critique.
- Lower time to first playable is valuable only if validation honesty remains high.
- High user override rate may indicate poor recommendations, or strong user taste correctly steering the product.
- High governance compliance is not useful if governance produces unnecessary friction.
- Benchmark progression matters most when benchmark cases reflect real production failures.

KPI review should always include qualitative evidence from reviews, retrospectives, and dogfooding notes.

## 5. Release Governance

Major architectural changes should declare:

- Which KPIs they are expected to improve.
- Which KPIs may temporarily worsen.
- What evidence will prove improvement.
- Which benchmark cases should detect regression.
- Which retrospective questions should evaluate the change.

Architectural releases should demonstrate measurable KPI impact or provide a clear rationale for why the change is foundational, preventive, or required for compatibility.

## 6. Dogfooding Integration

During `AInvil Builds AInvil`, KPI data should be collected from:

- RFC lifecycle records.
- Review records.
- Production State Graph coverage.
- Validation evidence.
- Benchmark reports.
- Architecture Retrospectives.
- User corrections and overrides.
- Time spent resuming, planning, implementing, validating, and syncing.

Every dogfooding milestone should update a KPI Dashboard and discuss KPI movement in the Architecture Retrospective.

## 7. Success Criteria

The Studio KPI Framework succeeds when:

- Future AInvil work is justified by measurable impact, not feature count.
- Retrospectives identify which KPIs improved or regressed.
- Benchmarks and KPIs together guide release confidence.
- Governance rules can be revised using operational evidence.
- AInvil's maturity stage can be defended with data.
