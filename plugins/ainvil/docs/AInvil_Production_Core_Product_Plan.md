# AInvil Production Core Product Plan

## 1. Purpose

This document defines the concrete product plan for moving AInvil from `Stage 3: Foundation` to `Stage 4: Production Core`.

The goal is not to add more isolated systems. The goal is to prove that AInvil can repeatedly move a scoped Unity game idea through design, planning, implementation, validation, evidence capture, synchronization, and resume state.

## 2. Target Outcome

AInvil reaches Production Core when it can support a real solo or small-team Unity project through a scoped vertical slice and leave inspectable evidence behind.

Target proof:

```text
User idea or incomplete GDD
  -> Director review
  -> GDD completion
  -> Requirements and BDD acceptance criteria
  -> Unity implementation plan
  -> Unity Bridge execution
  -> Compile check
  -> Play Mode and input validation
  -> Validation evidence
  -> Production State Graph update
  -> Traceability and dashboard update
  -> Resume-ready next action
```

This proof must run on at least one sample Unity project and one AInvil dogfooding workflow before Production Core is claimed.

## 3. Current Baseline

Status: `Foundation with early Production Core artifacts, PC2 execution records, PC3 classified evidence export, PC4 sync/resume views, and PC5 gate review`.

Confirmed strengths:

- Product identity and maturity model exist.
- Production State Graph exists.
- Production Intelligence exists.
- Workflow Runtime Report, Transition Plan, and Approval Model exist.
- Benchmark datasets and baseline benchmark report generation exist.
- Unity Bridge MCP server and Unity package exist.
- Input validation bridge exists.
- CLI can inspect current platform artifacts.
- Static plugin, CLI, and harness validation pass.

Confirmed gaps:

- The main production graph is still an example graph.
- Workflow Runtime can execute the low-risk `RunBenchmark` refresh transition and records dry-run, succeeded, and blocked transition attempts.
- Benchmark scores are `NotRun` because live agent outputs are not evaluated.
- Live Unity harness exports validation evidence. The latest top-down collectible probe is classified as actionable failure evidence because required Unity scene artifacts are missing.
- KPI dashboard values now exist for current generated evidence, but Stage 4 KPI confidence remains limited by missing passed live Unity validation.
- Platform artifact synchronization now produces traceability, dashboard, and sync reports; automatic Unity change set synchronization remains planned.
- Director direction packets and milestone decisions are not yet durable records from real workflows.

## 4. Product Pillars

### 4.1 Playable Proof Over Documentation Volume

AInvil should be judged by whether it can produce and verify a playable slice, not by how many documents it can generate.

### 4.2 Evidence Before Confidence

AInvil must not promote validation levels, task completion, or milestone confidence without evidence.

### 4.3 Human Creative Ownership

The user owns product direction. AInvil can challenge, narrow, and propose, but player-facing scope changes require confirmation.

### 4.4 Production Memory

Every major decision, requirement, task, Unity target, validation result, and next action should be resumable across sessions.

### 4.5 Traceable Automation

Automation is valuable only when users can inspect what was done, why it was done, what evidence supports it, and what remains unknown.

## 5. Production Core Features

### FEAT-PCORE-001: First Vertical Slice Workflow

Objective: Prove one end-to-end workflow from idea to validated Unity evidence.

Requirements:

| requirement id | requirement | owner | status |
| --- | --- | --- | --- |
| REQ-PCORE-001 | AInvil can start from a simple game idea or incomplete GDD and produce a Director review. | Director Layer | Planned |
| REQ-PCORE-002 | AInvil can create or update GDD, feature spec, requirements, tasks, and BDD acceptance criteria. | GDD Agent | Planned |
| REQ-PCORE-003 | AInvil can map accepted requirements to Unity targets and implementation tasks. | Orchestrator / Unity Agent | Planned |
| REQ-PCORE-004 | AInvil can verify compile and Play Mode behavior through Unity Bridge. | Unity Agent / Input Agent | Planned |
| REQ-PCORE-005 | AInvil can create validation evidence linked to acceptance criteria. | Input Agent | Planned |
| REQ-PCORE-006 | AInvil can update graph, traceability, dashboard, and next action after validation. | Orchestrator | Planned |

Acceptance criteria:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-PCORE-001 | REQ-PCORE-001 | A user provides a scoped prototype idea. | AInvil starts the workflow. | A Director review is recorded with concerns, recommendations, and confirmation status. | Not tested |
| AC-PCORE-002 | REQ-PCORE-002 | Director review is available. | AInvil prepares implementation readiness. | Requirements, tasks, and BDD acceptance criteria are created with stable IDs. | Not tested |
| AC-PCORE-003 | REQ-PCORE-003 | Requirements and tasks exist. | AInvil plans Unity work. | At least one UnityTarget is linked to a task and requirement. | Not tested |
| AC-PCORE-004 | REQ-PCORE-004 | Unity Bridge is reachable. | AInvil runs the sample workflow. | Compile status and Play Mode status are captured. | Not tested |
| AC-PCORE-005 | REQ-PCORE-005 | Play Mode validation runs. | Input validation succeeds or fails. | ValidationEvidence records the result, level, timestamp, and linked acceptance criterion. | Not tested |
| AC-PCORE-006 | REQ-PCORE-006 | Validation evidence exists. | AInvil syncs project state. | Graph, traceability view, dashboard, and next action reflect the evidence. | Not tested |

### FEAT-PCORE-002: Guarded Workflow Runtime Execution

Objective: Move from read-only workflow recommendations to guarded execution of approved transitions.

Requirements:

| requirement id | requirement | owner | status |
| --- | --- | --- | --- |
| REQ-PCORE-010 | Runtime can execute only transitions classified as ready and allowed. | Orchestrator | Implemented for `RunBenchmark` |
| REQ-PCORE-011 | Runtime writes execution records for every attempted transition. | Orchestrator | Implemented |
| REQ-PCORE-012 | Runtime blocks transitions that need evidence, review, or user approval. | Orchestrator | Implemented |
| REQ-PCORE-013 | Runtime can update graph state through explicit patch operations. | Orchestrator | Planned |
| REQ-PCORE-014 | Runtime can recover from failed transitions without corrupting artifacts. | Orchestrator | Planned |

Acceptance criteria:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-PCORE-010 | REQ-PCORE-010 | A transition approval report contains one `AutoEligible` transition. | Runtime executes approved transitions. | Only ready and allowed transitions execute. | Passed for `TRANS-RunBenchmark-Refresh` |
| AC-PCORE-011 | REQ-PCORE-011 | Runtime attempts a transition. | The attempt finishes or fails. | An execution record is written with input, output, status, evidence, and errors. | Passed |
| AC-PCORE-012 | REQ-PCORE-012 | A transition is `EvidenceRequired` or `UserApprovalRequired`. | Runtime evaluates execution. | The transition is blocked and no state mutation is performed. | Passed for `TRANS-ResolveValidationGap-1` |
| AC-PCORE-013 | REQ-PCORE-013 | A transition emits graph patch operations. | Runtime applies the transition. | Graph updates validate before being committed. | Not tested |
| AC-PCORE-014 | REQ-PCORE-014 | A transition fails halfway. | Runtime records failure. | Existing source artifacts remain valid and a blocked next action is recorded. | Not tested |

### FEAT-PCORE-003: Live Unity Validation Proof

Objective: Turn at least one live harness scenario from `Blocked` into `Passed`.

Requirements:

| requirement id | requirement | owner | status |
| --- | --- | --- | --- |
| REQ-PCORE-020 | Harness can detect Unity Bridge health and classify unavailable bridge as blocked. | Input Agent | Implemented |
| REQ-PCORE-021 | Harness can run one sample scenario against a reachable Unity Bridge. | Input Agent | Implemented with classified failure evidence |
| REQ-PCORE-022 | Harness can capture compile, console, Play Mode, input, and artifact checks. | Input Agent / Unity Agent | Implemented for probe/apply checks |
| REQ-PCORE-023 | Harness can emit validation evidence suitable for graph synchronization. | Input Agent | Implemented |

Acceptance criteria:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-PCORE-020 | REQ-PCORE-020 | Unity Bridge is unavailable. | Live harness runs. | Scenarios are blocked with `BridgeDisconnected` and next actions. | Passed |
| AC-PCORE-021 | REQ-PCORE-021 | Unity Bridge is reachable. | `top_down_collectible` runs. | The scenario completes with `Passed` or actionable failure classification. | Passed with actionable failure classification |
| AC-PCORE-022 | REQ-PCORE-022 | A sample scene exists. | Harness probes the scenario. | Compile, console, hierarchy, Play Mode, and input checks are recorded. | Partial; artifact checks recorded, Play Mode apply still needed |
| AC-PCORE-023 | REQ-PCORE-023 | Harness finishes. | Evidence export runs. | ValidationEvidence JSON links scenario checks to acceptance criteria. | Passed for evidence export; acceptance links remain a gap |

### FEAT-PCORE-004: Production Synchronization

Objective: Make implementation and validation results update operational views without overwriting design intent.

Requirements:

| requirement id | requirement | owner | status |
| --- | --- | --- | --- |
| REQ-PCORE-030 | Sync pass can read graph, validation reports, benchmark reports, review records, and Unity change sets. | Orchestrator | Implemented for platform artifacts; Unity change sets still planned |
| REQ-PCORE-031 | Sync pass can produce traceability rows from graph paths. | Orchestrator | Implemented |
| REQ-PCORE-032 | Sync pass can update project dashboard values. | Orchestrator | Implemented |
| REQ-PCORE-033 | Sync pass can detect documented requirements without implementation or validation. | Orchestrator | Implemented |
| REQ-PCORE-034 | Sync pass can detect implementation artifacts without requirements. | Orchestrator / Unity Agent | Planned |

Acceptance criteria:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-PCORE-030 | REQ-PCORE-030 | Platform artifacts exist. | Sync pass runs. | It produces a deterministic sync report. | Passed |
| AC-PCORE-031 | REQ-PCORE-031 | Graph contains requirement-task-target-evidence paths. | Traceability generation runs. | Traceability rows show complete and missing links. | Passed |
| AC-PCORE-032 | REQ-PCORE-032 | Health and validation data exist. | Dashboard generation runs. | Dashboard shows milestone, active feature, blockers, validation coverage, and next action. | Passed |
| AC-PCORE-033 | REQ-PCORE-033 | A requirement lacks implementation or evidence. | Drift detection runs. | The missing link is reported without changing source-of-truth design. | Passed |
| AC-PCORE-034 | REQ-PCORE-034 | Unity artifacts exist without requirements. | Drift detection runs. | Orphan implementation is reported as `Needs Requirement Definition`. | Not tested |

## 6. Milestones

### Milestone PC-1: Evidence Baseline

Detailed technical spec: `production-core/PC1_Evidence_Baseline_Technical_Spec.md`.

Goal: Make current evidence gaps visible and reproducible.

Deliverables:

- Baseline benchmark report.
- Workflow report with benchmark awareness.
- Live harness blocked evidence preserved.
- Production Core product and technical specs.

Exit criteria:

- Static validation passes.
- Benchmark report validates.
- Gaps are visible in CLI output.

### Milestone PC-2: Runtime Execution Records

Detailed technical spec: `production-core/PC2_Runtime_Execution_Records_Technical_Spec.md`.

Goal: Add safe execution records before mutating important state.

Deliverables:

- Workflow execution record schema. Implemented: `schemas/workflow_execution_record.schema.json`.
- Runtime executor for auto-eligible non-mutating or low-risk transitions. Implemented: `core/workflow-executor.mjs`.
- Execution report validator. Implemented: `scripts/validate-workflow-execution-records.mjs`.
- CLI command to inspect execution history. Implemented: `ainvil-cli executions`.

Exit criteria:

- Runtime can execute `RunBenchmark` and record the result. Passed for `TRANS-RunBenchmark-Refresh`.
- Evidence-required transitions remain blocked. Passed for `TRANS-ResolveValidationGap-1`.
- Plugin validation includes execution record validation. Implemented.

### Milestone PC-3: Live Unity Proof

Detailed technical spec: `production-core/PC3_Live_Unity_Proof_Technical_Spec.md`.

Goal: Pass one real Unity harness scenario.

Deliverables:

- Unity sample project setup instructions.
- Live harness scenario result with reachable bridge.
- ValidationEvidence export from harness result. Implemented: `validation/evidence/EVID-top-down-collectible-latest.json`.
- Graph update linking evidence to acceptance criteria.

Exit criteria:

- At least one scenario is `Passed`. Not yet passed; latest run is classified actionable failure evidence.
- Compile and Play Mode evidence exists. Partial; probe evidence exists, apply Play Mode evidence still needed.
- Validation evidence is linked in graph. Planned for graph patch phase.

### Milestone PC-4: Sync and Resume

Detailed technical spec: `production-core/PC4_Sync_And_Resume_Technical_Spec.md`.

Goal: Make the project resumable after implementation and validation.

Deliverables:

- Traceability generation. Implemented: `reports/traceability_view.json`.
- Project dashboard generation. Implemented: `reports/project_dashboard.json`.
- Drift report generation. Implemented: `reports/sync_report.json`.
- Resume summary based on graph, reviews, validation, benchmark, and KPI data. Implemented through CLI `dashboard`, `sync`, and `gate`.

Exit criteria:

- CLI shows dashboard and traceability availability. Passed.
- Missing links are actionable. Passed.
- Next action is evidence-backed. Passed for current example graph; current action remains validation evidence work.

### Milestone PC-5: Production Core Gate

Detailed technical spec: `production-core/PC5_Production_Core_Gate_Technical_Spec.md`.

Goal: Decide whether AInvil qualifies for Stage 4.

Deliverables:

- Production Core readiness review. Implemented with decision `Changes Requested`.
- Benchmark report with live scored dimensions. Implemented as partial live-scored report with remaining validation gaps.
- KPI dashboard. Implemented: `reports/kpi_dashboard.json`.
- Architecture retrospective. Implemented: `reports/production_core_architecture_retrospective.md`.

Exit criteria:

- Vertical slice is repeatable. Not yet; latest live scenario has classified failures.
- Evidence exists for design, implementation, validation, sync, and resume. Partial; validation evidence is failed/classified, not passed.
- Stage 4 gaps are explicitly accepted, deferred, or resolved. Passed through readiness review decision `Changes Requested`.

## 7. Non-Goals

- Do not build a full standalone desktop app before Production Core proof.
- Do not extract packages before runtime, evidence, and sync responsibilities are stable.
- Do not add broad Unity API coverage unless required by the vertical slice.
- Do not claim benchmark scores without live evaluated outputs.
- Do not mark features `Validated` from static analysis alone.

## 8. Risks

| risk | impact | mitigation |
| --- | --- | --- |
| Unity Bridge setup friction blocks proof. | AInvil remains document-heavy. | Use one documented sample project and one smoke-test scene. |
| Runtime mutates state without enough evidence. | Trust is lost. | Require approval classifications, dry-run mode, validation before commit, and execution records. |
| Benchmark reports become vanity artifacts. | Capability claims become misleading. | Keep `NotRun` explicit until live outputs are scored. |
| Sync overwrites user-approved design. | Creative ownership is violated. | Sync implementation findings as evidence, drift, or proposed updates; never as silent design replacement. |
| Scope expands into platform extraction too early. | Production proof slips. | Keep plugin paths stable until vertical slice is proven. |

## 9. Success Metrics

| metric | target for Production Core |
| --- | --- |
| First vertical slice completion | At least 1 repeated successful run |
| Live harness pass count | At least 1 scenario passed |
| Validation evidence coverage | 100% for implemented vertical-slice acceptance criteria |
| Traceability completeness | All vertical-slice requirements linked to task, Unity target, input, acceptance, and evidence |
| Resume readiness | CLI can report current milestone, active feature, blockers, validation gaps, and next action |
| Benchmark status | Baseline plus at least one live scored report |
| KPI dashboard | Current values exist for validation coverage, drift count, resume readiness, and benchmark trend |

## 10. Product Decision

Production Core should be claimed only after AInvil demonstrates repeatable production behavior on real scoped work.

Until then, AInvil should describe itself as:

```text
Foundation-stage AI game production agent with early Production Core workflow artifacts.
```
