# AInvil Maturity Model

## 1. Purpose

The maturity model defines objective stages for AInvil's evolution.

It prevents the product from being judged only by feature count. AInvil matures when it becomes more reliable, traceable, validated, governable, and useful over long development cycles.

## 2. Stage 1: Concept

### Definition

AInvil exists as a product idea and philosophical direction.

### Exit Criteria

- Product identity is defined.
- Human creative ownership is explicit.
- Differentiation from generic Unity automation is clear.
- Initial agent roles are described.
- Initial design-to-Unity workflow is plausible.

## 3. Stage 2: Prototype

### Definition

AInvil can demonstrate the game-production loop in limited scenarios, but the architecture is still unstable.

### Exit Criteria

- Plugin loads in the target host.
- Specialist prompts exist.
- Unity Bridge can perform basic editor operations.
- Initial GDD, technical design, and Unity workflow templates exist.
- Basic validation scripts exist.
- Known limitations are documented.

## 4. Stage 3: Foundation

### Definition

AInvil has stable product identity, governance, source-of-truth structures, and evaluation foundations.

### Exit Criteria

- AInvil Manifesto exists.
- Architectural Principles exist.
- RFC Process exists.
- Product Governance exists.
- Studio Playbook exists.
- Production State Graph exists.
- Production Intelligence Engine exists.
- Review & Governance System exists.
- Capability Benchmark exists.
- Static plugin validation passes.
- Architecture documentation references the foundation docs.

## 5. Stage 4: Production Core

### Definition

AInvil can reliably support real solo or small-team game production for scoped projects.

### Exit Criteria

- Project state can be resumed across sessions.
- Traceability is maintained from design to validation evidence.
- Review records are produced for major decisions.
- Unity compile and Play Mode validation workflows are repeatable.
- Documentation drift can be detected.
- Capability Benchmark reports are used before releases.
- Migrations exist for breaking state or schema changes.
- Core workflows are stable enough for repeated use.

### Entry Focus From Foundation

To move from Foundation to Production Core, AInvil should prioritize proof of repeatable production over additional framework breadth.

Detailed Stage 4 planning is tracked in:

- `AInvil_Production_Core_Product_Plan.md`.
- `AInvil_Production_Core_Technical_Spec.md`.

Required transition work:

- Complete one vertical slice from idea to validated Unity playability evidence.
- Promote Workflow Runtime from read-only reporting to guarded transition execution with run records, graph updates, approval checks, and failure recovery.
- Replace example-only product proof with real dogfooding and sample-game production graphs.
- Capture successful live Unity evidence for bridge health, compile status, Play Mode behavior, input validation, and validation report generation.
- Synchronize implementation results back to Production State Graph, traceability views, project dashboard, validation evidence, and drift reports.
- Persist Director direction packets, review outcomes, milestone decisions, and user confirmations from real workflows.
- Generate benchmark reports and compare them across releases before claiming capability improvement.

Stage 4 should not be considered reached when the architecture can describe the workflow. It is reached when the workflow can be repeated on real scoped projects and leaves inspectable evidence behind.

## 6. Stage 5: Production OS

### Definition

AInvil behaves as an operating system for game production across long-running projects.

### Exit Criteria

- Persistent memory supports multi-month project continuity.
- Task graph execution is reliable and inspectable.
- Rollback or replay exists for production actions.
- CI or automated validation integration exists.
- Production dashboards show health, risk, validation coverage, and next actions.
- Benchmark trends are tracked across versions.
- Team workflows are supported without losing creative ownership.
- Large documentation and asset sets remain searchable, synchronized, and governable.

## 7. Stage 6: AI Game Studio

### Definition

AInvil operates like a coherent AI-assisted game studio.

It does not merely automate tasks. It supports creative direction, design critique, production planning, implementation coordination, validation, review culture, organizational memory, and continuous improvement.

### Exit Criteria

- Multiple project roles can participate through governed workflows.
- Review, validation, benchmarks, RFCs, and production state form a coherent operating culture.
- AInvil can support long-running commercial indie production without becoming the creative owner.
- Architectural evolution is traceable through RFCs and benchmark outcomes.
- Project health, design health, technical health, validation coverage, and production risk are continuously visible.
- Reusable organizational knowledge improves future decisions.

## 8. Current Maturity Assessment

Current target stage: Foundation.

AInvil has moved beyond pure Prototype because the product now has production state, intelligence, review governance, benchmark foundations, and a Studio Playbook. It should not be considered Production Core until live Unity validation, resume workflows, traceability maintenance, migration handling, and benchmark reporting are repeatable in real projects.
