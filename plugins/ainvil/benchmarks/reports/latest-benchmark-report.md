# AInvil Benchmark Report: BR-AInvil-Baseline-2026-07-06

## 1. Run Metadata

- Benchmark run id: BR-AInvil-Baseline-2026-07-06
- AInvil version: current plugin workspace
- Benchmark dataset: 5 case(s)
- Dataset version: 0.1.0
- Date: 2026-07-06T11:27:56.216Z
- Evaluator: AInvil static benchmark generator
- Run mode: DatasetBaseline
- Compared version: None

## 2. Overall Capability

- Overall assessment: 5 benchmark case(s) loaded; 3 expected categories are missing.
- Major strengths: 5 benchmark categories have seed data.
- Major weaknesses: 3 benchmark categories are missing seed data; runtime output scoring is not implemented in this baseline report.
- Regression summary: NoPreviousReport
- Improvement summary: Baseline report generation now produces a durable artifact for future comparison.

## 3. Scores

| dimension | score 0-5 | evidence | notes |
| --- | --- | --- | --- |
| Design Quality | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Technical Accuracy | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Production Quality | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Consistency | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Traceability | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Validation | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Risk Detection | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Creativity Preservation | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Hallucination Resistance | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Evidence Usage | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |
| Unknown Handling | NotRun | No live agent output evaluated in DatasetBaseline mode. | Attach live benchmark evaluation before using this as a capability score. |

## 4. Category Results

| benchmark category | result | notes |
| --- | --- | --- |
| Design Review | DatasetReady | Dataset exists; runtime agent output evaluation is still required. |
| GDD Completion | DatasetReady | Dataset exists; runtime agent output evaluation is still required. |
| Technical Translation | DatasetReady | Dataset exists; runtime agent output evaluation is still required. |
| Production Planning | MissingDataset | No seed dataset exists for this category yet. |
| Unity Production | MissingDataset | No seed dataset exists for this category yet. |
| Validation | DatasetReady | Dataset exists; runtime agent output evaluation is still required. |
| Project Management | MissingDataset | No seed dataset exists for this category yet. |
| Director Quality | DatasetReady | Dataset exists; runtime agent output evaluation is still required. |

## 5. Expected vs Actual

| expected observation/recommendation | actual output | pass/fail | notes |
| --- | --- | --- | --- |
| Core loop is unclear. | Not evaluated | NotRun | BENCH-DesignReview-PoorGDD-001: expected observation |
| Scope is too large for first playable. | Not evaluated | NotRun | BENCH-DesignReview-PoorGDD-001: expected observation |
| Define the core run loop before adding meta systems. | Not evaluated | NotRun | BENCH-DesignReview-PoorGDD-001: expected recommendation |
| Choose one primary fantasy and defer unrelated systems. | Not evaluated | NotRun | BENCH-DesignReview-PoorGDD-001: expected recommendation |
| Requested features do not support immediate milestone validation. | Not evaluated | NotRun | BENCH-Director-FeatureCreep-001: expected observation |
| Core loop is not validated yet. | Not evaluated | NotRun | BENCH-Director-FeatureCreep-001: expected observation |
| Defer housing, pets, and fishing unless user confirms a vision change. | Not evaluated | NotRun | BENCH-Director-FeatureCreep-001: expected recommendation |
| Validate combat loop first. | Not evaluated | NotRun | BENCH-Director-FeatureCreep-001: expected recommendation |
| Failure states are missing. | Not evaluated | NotRun | BENCH-GDDCompletion-Incomplete-001: expected observation |
| Progression structure is missing. | Not evaluated | NotRun | BENCH-GDDCompletion-Incomplete-001: expected observation |
| Ask or propose how levels unlock. | Not evaluated | NotRun | BENCH-GDDCompletion-Incomplete-001: expected recommendation |
| Define puzzle completion and reset behavior. | Not evaluated | NotRun | BENCH-GDDCompletion-Incomplete-001: expected recommendation |
| Systems should be split into player movement, enemy contact, pickup scoring, timer, run state, and HUD. | Not evaluated | NotRun | BENCH-TechTranslation-AverageGDD-001: expected observation |
| Data model should distinguish authored tuning from runtime state. | Not evaluated | NotRun | BENCH-TechTranslation-AverageGDD-001: expected observation |
| Create Technical Design with component contracts. | Not evaluated | NotRun | BENCH-TechTranslation-AverageGDD-001: expected recommendation |
| Define first playable scene structure. | Not evaluated | NotRun | BENCH-TechTranslation-AverageGDD-001: expected recommendation |
| Feature should not be marked Validated. | Not evaluated | NotRun | BENCH-Validation-MissingEvidence-001: expected observation |
| Validation evidence is missing. | Not evaluated | NotRun | BENCH-Validation-MissingEvidence-001: expected observation |
| Route Play Mode validation to Input Agent. | Not evaluated | NotRun | BENCH-Validation-MissingEvidence-001: expected recommendation |
| Create ValidationEvidence linked to AC-Dash-001. | Not evaluated | NotRun | BENCH-Validation-MissingEvidence-001: expected recommendation |

## 6. Critical Failures

| failure | severity | evidence | required fix |
| --- | --- | --- | --- |
| None detected by structural baseline | None | Dataset structure | Run live agent evaluation next |

## 7. Version Comparison

| area | previous | current | regression/improvement |
| --- | --- | --- | --- |
| Benchmark report availability | None | BR-AInvil-Baseline-2026-07-06 | Baseline artifact available |

## 8. Recommendations

- Add seed datasets for missing categories: Production Planning, Unity Production, Project Management.
- Run live agent outputs against each benchmark case and replace NotRun scores with evidence-backed scores.
- Compare this report against the previous release before claiming capability improvement.
- Feed benchmark regressions into the Production State Graph as risks or next actions.

