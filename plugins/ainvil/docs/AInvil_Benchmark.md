# AInvil Capability Benchmark

## 1. Purpose

The AInvil Capability Benchmark measures whether AInvil is becoming a better AI Game Production Operating System.

It is not a production feature. It is an evaluation framework.

The benchmark should answer:

- Does AInvil improve game production quality?
- Does it preserve creative ownership?
- Does it identify design, technical, production, validation, and traceability problems?
- Does it avoid unsupported invention?
- Does it produce evidence-backed recommendations?
- Does it regress as architecture changes?

Future architectural releases should run the benchmark before being considered stable.

## 2. Benchmark Philosophy

AInvil should not be rewarded for generating more documentation.

It should be rewarded for:

- Better decisions.
- Better critique.
- Better traceability.
- Better risk detection.
- Better validation honesty.
- Better next-action selection.
- Better preservation of the user's intended game.

## 3. Benchmark Suites

### 3.1 Design Review

Evaluates whether AInvil can:

- Identify weaknesses in poor game designs.
- Preserve strong designs instead of over-editing them.
- Improve weak mechanics with options and tradeoffs.
- Explain reasoning using design principles.
- Avoid replacing the user's creative intent.

### 3.2 GDD Completion

Evaluates whether AInvil can:

- Complete incomplete GDDs.
- Detect missing player fantasy, loop, rules, UI, progression, rewards, failure states, and first playable scope.
- Avoid inventing unsupported mechanics.
- Mark assumptions and proposed defaults clearly.

### 3.3 Technical Translation

Evaluates whether AInvil can:

- Convert GDDs into implementable Technical Designs.
- Reduce ambiguity.
- Define systems, data, tasks, acceptance criteria, Unity mappings, and validation plans.
- Preserve design intent while making implementation practical.

### 3.4 Production Planning

Evaluates whether AInvil can:

- Create realistic implementation plans.
- Identify dependencies.
- Recommend milestone order.
- Detect feature creep and scope risk.
- Sequence work toward a playable increment.

### 3.5 Unity Production

Evaluates whether AInvil can:

- Produce Unity implementation plans matching intended design.
- Map requirements to scenes, prefabs, scripts, data assets, and input.
- Avoid Unity work that lacks requirements.
- Preserve prototype vs production distinctions.

### 3.6 Validation

Evaluates whether AInvil can identify:

- Missing validation.
- Missing evidence.
- Traceability gaps.
- Documentation drift.
- Unsupported completion claims.
- Acceptance criteria that are ambiguous or untestable.

### 3.7 Project Management

Evaluates whether AInvil can:

- Resume projects from graph/report/review state.
- Recommend graph-backed next actions.
- Detect risks and blockers.
- Protect scope.
- Maintain consistency across documents and implementation state.

### 3.8 Director Quality

Evaluates whether the Director Layer can:

- Protect vision.
- Reject weak features.
- Identify feature creep.
- Identify conflicting mechanics.
- Provide constructive design critique.
- Use Production Intelligence and Review Outcomes rather than raw intuition alone.

## 4. Benchmark Dataset Types

The benchmark should include:

- Excellent GDD.
- Average GDD.
- Poor GDD.
- Conflicting documents.
- Incomplete project.
- Large production project.
- Broken traceability.
- Missing validation.
- Feature creep.
- Major design pivot.

Each benchmark case defines:

- Inputs.
- Expected observations.
- Expected recommendations.
- Scoring criteria.
- Failure modes.

## 5. Scoring Dimensions

Score each dimension from 0 to 5.

| dimension | meaning |
| --- | --- |
| Design Quality | Quality of critique, improvement options, and player-experience reasoning. |
| Technical Accuracy | Correctness and implementability of technical translation. |
| Production Quality | Realism of plans, milestones, dependency handling, and scope discipline. |
| Consistency | Alignment across documents, graph, reviews, and recommendations. |
| Traceability | Clear links between vision, requirements, tasks, Unity targets, input, acceptance, and evidence. |
| Validation | Correct handling of validation levels, evidence, and unknowns. |
| Risk Detection | Ability to identify design, production, technical, validation, and scope risks. |
| Creativity Preservation | Respect for the user's vision and avoidance of silent replacement. |
| Hallucination Resistance | Avoidance of unsupported mechanics, facts, tools, assets, and validation claims. |
| Evidence Usage | Reliance on graph, reviews, validation evidence, and source documents. |
| Unknown Handling | Willingness to say `Unknown`, `Needs confirmation`, or `Not Checked`. |

## 6. Evaluation Workflow

1. Select benchmark dataset.
2. Provide AInvil the benchmark inputs.
3. Run AInvil with the appropriate layer or workflow.
4. Capture output, graph changes, review records, and generated reports.
5. Score outputs using the rubric.
6. Record regressions and improvements.
7. Compare against previous AInvil versions.

## 7. Release Recommendation

Run the benchmark before major architectural releases, especially changes to:

- Director Layer.
- Production State Graph.
- Production Intelligence Engine.
- Review & Governance System.
- Studio Playbook.
- Orchestrator routing.
- Agent prompts.
- Unity validation workflow.

Architectural changes should not be considered mature only because static validation passes. They should improve or preserve benchmark performance.

## 8. Future Automation

Phase 1 is manual and file-based.

Future phases can add:

- Automated benchmark runner.
- Model-output snapshot comparisons.
- Regression scoring.
- Human judge workflow.
- Graph/report diff evaluation.
- Unity live benchmark scenarios.
