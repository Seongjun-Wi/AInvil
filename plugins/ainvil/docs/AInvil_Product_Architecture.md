# AInvil Product Architecture

## 1. Product Identity

AInvil is a Unity-based AI game production agent.

It collaborates with the user from game idea and GDD creation to technical design, Unity implementation, playability validation, long-term project memory, and documentation synchronization.

AInvil is not a simple Unity MCP plugin. Unity operations are implementation tools inside a larger game production workflow.

Core roles:

- AI game design partner.
- Technical design assistant.
- Unity implementation agent.
- Playability validation agent.
- Long-term project memory and synchronization system.

The user owns the creative vision. AInvil challenges weak points, proposes options, structures decisions, implements confirmed intent, validates behavior, and maintains continuity.

## 1.1 Product Foundation

AInvil's long-term product identity is governed by foundational documents:

- `AInvil_Manifesto.md` defines why AInvil exists, what it will never become, and the relationship between the human creator and AInvil.
- `AInvil_Architectural_Principles.md` defines immutable architectural principles used to evaluate future changes.
- `AInvil_RFC_Process.md` defines how significant architectural changes are proposed, reviewed, accepted, implemented, and validated.
- `AInvil_Product_Governance.md` defines breaking changes, compatibility expectations, deprecation policy, migration policy, and versioning strategy.
- `AInvil_Maturity_Model.md` defines objective product maturity stages and exit criteria.
- `AInvil_Dogfooding_Initiative.md` defines how AInvil uses its own production workflow to develop AInvil.
- `AInvil_Platform_Architecture.md` defines how AInvil evolves beyond the Codex plugin into a multi-client platform.
- `AInvil_Platform_Migration_Plan.md` defines the staged migration path from plugin foundation to platform packages.
- `AInvil_Package_Boundaries.md` defines future package responsibilities.
- `AInvil_Workflow_Runtime_Platform_Plan.md` defines Workflow Runtime placement in platform core.
- `Studio_KPI_Framework.md` defines how AInvil measures whether it is becoming a better AI Game Production Operating System.

Future architecture should be evaluated against these documents before adding new production capabilities.

## 1.2 Platform Direction

AInvil should evolve into an AI-native Game Development Platform.

The current Codex plugin is one client of AInvil, not the owner of the core architecture. Long-term AInvil should support:

- CLI.
- Codex plugin.
- Desktop app.
- IDE integrations.
- Web dashboard.
- Unity integration.
- Future engine integrations.

Platform-level systems should become reusable core packages. Client-specific logic should adapt platform outputs to a surface. Engine integrations should connect platform plans and validation needs to real tools.

The immediate migration rule is conservative: do not move files or break the plugin until stable package boundaries and compatibility paths exist.

The first non-Codex proof is the read-only AInvil CLI prototype. It consumes existing plugin files in place and demonstrates that graph, intelligence, review, benchmark, and KPI concepts can be inspected without Codex or Unity.

## 1.3 Studio Playbook

The Studio Playbook is AInvil's operating constitution.

It is not another agent, graph, or intelligence engine. It defines the shared production principles used by every layer:

- Creative Ownership.
- Evidence-Based Decisions.
- Incremental Production.
- Review Before Commitment.
- Validation Before Completion.
- Scope Discipline.
- Design Quality.
- Technical Quality.
- Knowledge Evolution.

Every recommendation, review, production decision, implementation plan, and validation claim should reflect these principles.

## 1.4 Director Layer

AInvil includes a Director Layer above the existing Orchestrator.

The Director Layer is not another implementation agent and does not replace the existing architecture. It is a supervisory intelligence layer that protects and strengthens the user's intended game across the full production cycle.

```text
User
  -> Director Layer
    -> Orchestrator
      -> GDD Agent
      -> Unity Agent
      -> Input Agent
```

The Director Layer never directly modifies Unity, generates scripts, edits scenes, or creates prefabs. It provides direction, critique, milestone approval guidance, and production health assessment to the Orchestrator. The Orchestrator remains responsible for coordinating specialist work.

The user always owns the creative vision. The Director Layer challenges, clarifies, and warns, but it does not silently override user decisions.

## 2. Differentiation from Unity MCP Tools

| Unity MCP | AInvil |
| --- | --- |
| Exposes Unity tools. | Understands game design intent. |
| Manipulates scenes, assets, scripts, and prefabs. | Improves weak game designs without replacing the user's creativity. |
| Helps an LLM operate Unity. | Converts GDDs into implementation plans and validation workflows. |
| Focuses on editor operations. | Maps requirements to Unity objects, input, acceptance criteria, and evidence. |
| Usually has limited project memory. | Maintains project state across long development cycles. |

## 3. Production Workflow

```text
Idea / Incomplete GDD
  -> Director Vision Review
  -> Director Design Review
  -> User Confirmation
  -> Orchestrator Production Planning
  -> GDD Completeness Checker
  -> GDD / System Design / Technical Design
  -> Feature Specs
  -> Traceability Matrix
  -> Unity Implementation Plan
  -> Unity Scene / Prefab / Script / Data Work
  -> Compile / Play Mode / Runtime Validation
  -> Milestone Review
  -> Project Dashboard / Resume State
  -> Documentation Synchronization
```

## 4. Immediate Priority

Before adding more raw Unity APIs, prioritize:

1. Design Critic / Design Review.
2. GDD Completeness Checker.
3. Traceability Matrix.
4. Project Dashboard / Resume State.
5. Unity Validation Pipeline.

## 5. Design Critic Capability

Design review is supervised by the Director Layer and executed through the Orchestrator and GDD Agent when document changes are needed.

The Director evaluates:

- Core loop strength.
- Player motivation.
- Game feel.
- UX clarity.
- Progression.
- Retention.
- Replayability.
- Difficulty curve.
- Economy and balance risks.
- Onboarding.
- Scope feasibility.
- One-person development feasibility.

Design review should challenge weak points and propose options. It must not silently overwrite the user's intended game.

## 5.1 Director Production Review

The Director continuously asks:

- Is the project still moving toward the intended game?
- Do current features support the core fantasy and player experience?
- Is unnecessary scope appearing?
- Are systems becoming inconsistent?
- Is design drift happening?
- Are technical decisions weakening the player experience?

When a risk appears, the Director warns the user and gives the Orchestrator a clear direction packet. The user decides whether to accept, reject, defer, or modify the recommendation.

## 5.2 Design Pattern Knowledge

AInvil should maintain structured design pattern knowledge rather than merely searching for existing games.

Pattern families include:

- Core Loop Patterns.
- Progression Patterns.
- Economy Patterns.
- Deckbuilding Patterns.
- Roguelike Patterns.
- Puzzle Patterns.
- Combat Patterns.
- UI Patterns.
- Retention Patterns.

When referencing existing games, AInvil should extract reusable design principles rather than copying mechanics.

## 6. Project State Capability

Project state supports "continue where we left off" by tracking:

- Current milestone.
- Current active feature.
- Latest confirmed user intent.
- Open design questions.
- Open technical decisions.
- Implemented features.
- Validated features.
- Blocked tasks.
- Next recommended action.

## 6.1 Production State Graph

The Production State Graph is AInvil's operational backbone.

It connects:

```text
Vision
  -> Design Decisions
  -> Requirements
  -> Feature Specs
  -> Implementation Tasks
  -> Unity Targets
  -> Input Specs
  -> Acceptance Criteria
  -> Validation Evidence
  -> Project Health
  -> Next Recommended Actions
```

Markdown documents remain readable and useful. The graph does not immediately replace the GDD, Technical Design, Feature Specs, Project Structure, Input Spec, or validation reports. Instead:

- The graph is the operational index and state backbone.
- Markdown documents are human-facing views and detailed source documents.
- Traceability Matrix and Project Dashboard are derived or synchronized views of the graph.
- Future orchestration, conflict detection, dashboard generation, and resume workflow should use the graph.

## 6.2 Production Intelligence Engine

The Production Intelligence Engine is the read-only operational reasoning layer above the Production State Graph.

```text
Production State Graph
  -> Production Intelligence Engine
    -> Review & Governance System
      -> Studio Playbook policy check
      -> Production Intelligence Report
        -> Director Layer
          -> Orchestrator
```

The graph remembers project state. The intelligence engine understands and evaluates that state.

It reports:

- Vision Health.
- Design Health.
- Technical Health.
- Documentation Health.
- Validation Health.
- Production Health.
- Coverage gaps.
- Production risks.
- Graph-backed recommendations.

The engine must not mutate the graph, Unity project, or Markdown source documents. Specialist agents update the graph; the intelligence engine reads it and produces evidence-backed reports.

## 6.3 Review & Governance System

The Review & Governance System turns important decisions into structured records.

It supports:

- Vision Review.
- Design Review.
- Technical Review.
- Production Review.
- Validation Review.

Reviews are performed by existing layers and agents. AInvil should not create new specialist agents for review.

Governance rules define when review is required. For example:

- A feature should not be marked `Validated` without validation evidence.
- Production Review should occur before implementation of high-complexity features.
- Vision Review should occur when major gameplay changes are introduced.
- Technical Review should precede risky architectural changes.
- Validation Review should occur before milestone closure.

The Director Layer should synthesize Production Intelligence and Review Outcomes before making recommendations.

## 6.4 Capability Benchmark

The AInvil Capability Benchmark measures whether AInvil is improving as an AI Game Production Operating System.

It is not a new production capability and does not add specialist agents. It evaluates existing layers against repeatable datasets for:

- Design Review.
- GDD Completion.
- Technical Translation.
- Production Planning.
- Unity Production.
- Validation.
- Project Management.
- Director Quality.

Benchmark reports should be run before major architectural releases. A release should not be considered mature only because static plugin validation passes; it should preserve or improve benchmark performance, especially in creativity preservation, evidence usage, validation honesty, traceability, and scope discipline.

## 6.5 Dogfooding: AInvil Builds AInvil

AInvil development should be managed through AInvil's own production workflow.

```text
AInvil product vision
  -> Production State Graph
  -> RFCs and Reviews
  -> Director guidance
  -> Orchestrator planning
  -> Implementation
  -> Validation evidence
  -> Capability Benchmark
  -> Architecture Retrospective
  -> Organizational knowledge
```

The dogfooding workflow treats AInvil itself as a production project. RFCs become traceable requirements, feature specs, implementation tasks, validation evidence, benchmark reports, and retrospective findings.

This is not a new architecture layer. It is the evidence loop that determines whether the existing architecture works in practice.

## 6.6 Studio KPI Framework

The Studio KPI Framework defines measurable outcomes for AInvil's evolution.

It tracks:

- Design KPIs.
- Production KPIs.
- Intelligence KPIs.
- User Experience KPIs.
- Product KPIs.

KPI dashboards should show current values, historical trends, regression warnings, and improvement opportunities. Major architectural changes should state which KPIs they are expected to improve and should be reviewed against actual KPI movement during dogfooding retrospectives.

KPI evidence complements the Capability Benchmark. Benchmarks measure controlled capability scenarios; Studio KPIs measure real operational outcomes.

## 6.7 Workflow Runtime Placement

The future Workflow Runtime Engine belongs in platform core, not in Codex-plugin-only logic.

It should operate on:

- Production State Graph.
- Review Records.
- Production Intelligence Report.
- Benchmark Reports.
- KPI Dashboard.
- RFC metadata.
- Validation Evidence.

It should emit client-neutral workflow state, next recommended actions, required reviews, required validations, blockers, evidence gaps, benchmark gates, KPI warnings, and resume summaries.

Codex, CLI, desktop, and web clients may display or act on these outputs, but the runtime itself must not depend on Codex skills or Unity Bridge.

## 7. Traceability Capability

AInvil's core production differentiator is traceability:

```text
GDD section
  -> Requirement
  -> Feature Spec
  -> Implementation Task
  -> Unity Scene / Prefab / Script / Data
  -> Input Spec
  -> Acceptance Criteria
  -> Validation Evidence
```

Missing links should be visible and actionable.

Traceability Matrix should be derived from graph paths. It should not become a separate competing source of truth.

## 8. Validation Capability

Unity work does not end at asset creation. AInvil tracks validation confidence:

- Not Checked.
- Document Review.
- Static Analysis.
- Unity Inspection.
- Compile Verified.
- Play Mode Verified.
- Runtime Tested.
- User Confirmed.

AInvil must never claim that a feature works unless the corresponding validation was actually performed.

## 9. Milestone Review

Whenever a milestone finishes, the Director performs:

- Vision Review.
- Design Quality Review.
- Production Review.
- Technical Risk Review.
- Scope Review.
- Project Health Review.

The Director may recommend proceeding, revising, cutting scope, validating more, or returning to design clarification. The Director does not approve over the user; it gives the user a structured decision point before the Orchestrator continues.

## 10. Project Health

AInvil should periodically report:

- Design Health.
- Implementation Health.
- Documentation Health.
- Validation Coverage.
- Technical Debt.
- Production Risk.

Project health reports should be concise, evidence-based, and tied to traceability rows, validation levels, open decisions, and blockers.

In Phase 1, Project Health should be derived from the Production Intelligence Report whenever possible.
