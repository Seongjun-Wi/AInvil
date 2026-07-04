# AInvil Builds AInvil

## 1. Purpose

`AInvil Builds AInvil` is the dogfooding initiative for AInvil.

AInvil has reached the Foundation stage. The next priority is not adding more architecture. The next priority is proving that the existing architecture can guide real product development by using AInvil to develop AInvil itself.

AInvil should become the first project successfully developed using AInvil.

## 2. Operating Principle

Future AInvil development should flow through the same production workflow AInvil expects from game projects:

```text
Vision
  -> Production State Graph
  -> Reviews
  -> Director
  -> Planning
  -> Implementation
  -> Validation
  -> Benchmark
  -> Retrospective
  -> Organizational Knowledge
```

Dogfooding should produce evidence about whether AInvil's architecture actually improves production quality, not just whether it looks coherent on paper.

Studio KPIs define the measurement vocabulary for that evidence. Dogfooding should update the KPI Dashboard at each milestone.

## 3. Representing AInvil In The Production Graph

AInvil development should be represented as a production project inside the Production State Graph.

Recommended graph mapping:

| AInvil concept | Production graph representation |
| --- | --- |
| Product identity | `Vision` node |
| Manifesto or principle | `DesignDecision` or `Requirement` node |
| RFC | `Requirement` and `FeatureSpec` nodes |
| Governance rule | `Requirement` node |
| Architectural improvement | `FeatureSpec` node |
| Implementation work | `ImplementationTask` node |
| Documentation file | `Document` or implementation target reference |
| Validator or script | `UnityTarget` equivalent for tool/script artifact |
| Review result | `ReviewRecord` linked to graph nodes |
| Static validation | `ValidationEvidence` node |
| Benchmark report | `ValidationEvidence` and health signal |
| Retrospective finding | `DesignDecision`, `Risk`, or organizational knowledge entry |

The graph should answer:

- What product vision does this change support?
- Which RFC or decision authorized it?
- Which files, prompts, templates, schemas, or scripts changed?
- Which reviews were required?
- What validation evidence exists?
- Which benchmark results changed?
- What lesson should be reused later?

## 4. RFC To Implementation Flow

Significant AInvil changes should follow this path:

1. Create or update an RFC.
2. Link the RFC to product vision, architectural principles, and affected systems.
3. Add graph nodes for the RFC requirement and proposed feature spec.
4. Run required reviews.
5. Director synthesizes Production Intelligence, review outcomes, and benchmark risk.
6. Orchestrator converts the accepted RFC into implementation tasks.
7. Implementation changes are made.
8. Validation evidence is recorded.
9. Capability Benchmark is run when the change affects AInvil behavior.
10. Architecture Retrospective captures friction, usefulness, and missed signals.

RFCs should not be treated as isolated documents. Accepted RFCs should become traceable production work.

## 5. Review Execution

Dogfooding reviews should use the existing Review & Governance System.

Typical review routing:

| change type | required reviews |
| --- | --- |
| Product identity or philosophy | Vision Review, Production Review |
| Agent responsibility change | Vision Review, Technical Review, Production Review |
| Production State Graph change | Technical Review, Validation Review |
| Review/Governance change | Production Review, Validation Review |
| Benchmark change | Validation Review, Production Review |
| Prompt hierarchy change | Vision Review, Design Review, Technical Review |
| Unity Bridge or validation change | Technical Review, Validation Review |
| Documentation-only clarification | Document Review or lightweight Production Review |

Reviews should be judged by usefulness, not by quantity. If a review repeatedly produces no new information, that is a retrospective finding.

## 6. Director Role

The Director Layer should protect the long-term identity of AInvil during dogfooding.

It should ask:

- Does this change make AInvil more like an AI Game Production Operating System?
- Does it preserve human creative ownership?
- Does it improve evidence, traceability, validation, or continuity?
- Is this architecture necessary, or is it speculative?
- Is this feature accumulation disguised as product maturity?
- Does the benchmark or retrospective evidence support the change?

The Director should not implement changes. It should provide direction to the Orchestrator.

## 7. Planning And Implementation

The Orchestrator should convert accepted RFCs and review outcomes into implementation plans.

Plans should identify:

- Affected documents.
- Affected prompts.
- Affected templates.
- Affected schemas.
- Affected validators.
- Required migration work.
- Required benchmark updates.
- Required validation commands.
- Open decisions.

Implementation should remain incremental. AInvil should avoid broad speculative rewrites unless the RFC and reviews justify the scope.

## 8. Validation And Benchmark Release Gates

Every AInvil dogfooding milestone should define validation requirements before work begins.

Minimum validation:

- Static plugin validation.
- Relevant schema or dataset validation.
- Harness validation when workflow behavior is affected.
- JavaScript syntax checks for changed scripts.
- Review record validation when review files are added or changed.
- Capability Benchmark run when the change affects AInvil behavior.

Benchmarks become release gates when a change affects:

- Design review behavior.
- GDD completion behavior.
- Technical translation.
- Production planning.
- Unity production planning.
- Validation honesty.
- Project management.
- Director quality.
- Prompt hierarchy.
- Governance rules.

Benchmark regressions should be recorded. A regression may be accepted only with explicit rationale.

## 9. Metrics

Dogfooding should track metrics that reveal whether AInvil is actually useful in its own development.

The canonical KPI definitions live in `Studio_KPI_Framework.md`. Collection rules live in `KPI_Collection_Strategy.md`, and milestone KPI review follows `KPI_Review_Process.md`.

Core metrics:

| metric | meaning |
| --- | --- |
| Review usefulness | Percentage of reviews that produce actionable findings. |
| Recommendation usefulness | Percentage of recommendations accepted, modified, or explicitly rejected with rationale. |
| False-positive recommendations | Recommendations later judged unnecessary, misleading, or harmful. |
| Missing recommendations | Important issues discovered later that AInvil failed to flag. |
| Documentation maintenance cost | Time or edit volume required to keep docs synchronized. |
| Traceability maintenance cost | Time or edit volume required to keep graph, reviews, tasks, and evidence linked. |
| Time to resume paused project | Time required to recover current state and next action after interruption. |
| Time from idea to implementation | Time from accepted idea or RFC to validated implementation. |
| Benchmark score progression | Score changes across AInvil versions or milestones. |

Useful optional metrics:

- Number of ignored documents.
- Number of unnecessary reviews.
- Number of validation claims corrected.
- Number of governance rules invoked.
- Number of benchmark regressions.
- Number of open decisions carried across milestones.

## 10. Architecture Retrospective

After every AInvil milestone, generate an Architecture Retrospective using `templates/architecture_retrospective.md`.

The retrospective should document:

- What worked.
- What created unnecessary friction.
- Which documents were ignored.
- Which reviews were unnecessary.
- Which governance rules were valuable.
- Which production intelligence signals were useful.
- Which recommendations were repeatedly ignored.
- Which benchmark results changed.
- Which lessons should become reusable organizational knowledge.

Retrospectives should feed future RFCs, governance updates, benchmark improvements, prompt refinements, and documentation consolidation.

## 11. Organizational Knowledge Loop

Dogfooding evidence should become reusable knowledge.

Examples:

- If a review type repeatedly catches real defects, strengthen the governance rule that triggers it.
- If a document is repeatedly ignored, simplify it, merge it, or clarify its source-of-truth role.
- If a benchmark catches regressions, promote it to a release gate.
- If a recommendation is repeatedly ignored, revise the prompt, rule, or signal that produces it.
- If traceability is too expensive to maintain manually, prioritize automation.

The goal is not to prove AInvil is always right. The goal is to make AInvil better by measuring where it helps, where it adds friction, and where it misses important work.

## 12. Success Criteria

The initiative succeeds when:

- Future AInvil changes are driven by RFCs, reviews, validation, benchmarks, and retrospectives.
- Architectural decisions become traceable.
- Dogfooding metrics reveal concrete product weaknesses.
- Retrospectives change future priorities.
- Benchmark scores guide release confidence.
- AInvil development becomes easier to resume after pauses.
- AInvil's own evolution demonstrates the production workflow it promises to users.

AInvil should evolve through continuous self-application rather than architectural speculation.
