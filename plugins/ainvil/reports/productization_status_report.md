# AInvil Productization Status

- Generated at: 2026-07-04T14:50:46.880Z
- Decision: Release Candidate
- Graph classification: Operational
- Release blockers: 0

## Feature Status

| Feature | Status | Evidence |
| --- | --- | --- |
| Codex Plugin | Verified | plugin.json과 MCP config가 존재합니다. |
| Agent Skills | Spec-only | 역할 지침은 구현되어 있으나 런타임 검증 기능 자체는 아닙니다. |
| Director Layer | Spec-only | 제품 판단 규칙과 워크플로우 지침으로 존재합니다. |
| Platform Core | Partial | 그래프/리포트/워크플로우 코어는 실행 가능하나 E2E Unity 검증은 막혀 있습니다. |
| Production State Graph | Partial | 현재 그래프 분류: Operational |
| Production Intelligence | Partial | 보고서 생성기는 존재하지만 live validation gap이 남아 있습니다. |
| Workflow Runtime | Partial | guarded sync와 산출물 생성은 가능하지만 Unity mutation/validation promotion은 하지 않습니다. |
| Transition Planner / Approval / Executor | Partial | 전환 후보와 dry-run 실행은 가능하지만 실제 Unity 변경 경로와는 분리되어 있습니다. |
| Traceability View | Partial | 보고서는 존재하나 evidence 연결은 미완입니다. |
| Project Dashboard | Partial | 대시보드는 존재합니다. |
| Onboarding Doctor | Partial | releaseReadiness=Ready For Next Gate |
| Release Readiness | Partial | decision=Release Ready |
| CLI | Partial | 상태 조회와 guarded sync 명령이 존재합니다. productization 리포트 명령으로 E2E 상태를 보강합니다. |
| MCP Unity Server | Partial | Unity Bridge health endpoint is reachable. |
| Unity Editor Bridge | Partial | Unity Bridge health endpoint is reachable. |
| Input Test Bridge | Partial | Use AInvilRuntimeInputTestBridge for production validation; keep AInvilInputTestBridge only for compatibility/sample scenes. |
| Benchmark System | Partial | 벤치마크 데이터와 리포트는 존재하지만 제품 E2E 검증과는 분리된 평가 체계입니다. |
| Sample Harness Fixtures | Deprecated/Sample | top_down_collectible 등은 제품 운영 시나리오가 아니라 예제/fixture로 분류해야 합니다. |
| Root UnityPackage Mirror | Deprecated/Sample | 루트 UnityPackage는 설치 편의 mirror/deprecated artifact로만 취급합니다. |

## Minimum E2E Happy Path

| Step | Owner | Status | Evidence | Next action |
| --- | --- | --- | --- | --- |
| User request intake | Codex Plugin / Orchestrator | Spec-only | Defined by interactive agent instructions; not yet stored as a standalone runtime event. | Add request IDs to run logs when product telemetry is introduced. |
| Feature/Requirement/Task/Acceptance registration | Production State Graph | Partial | Current graph classification: Operational | Continue adding real project requirements. |
| Unity change dry-run | Workflow Transition / Executor | Partial | Guarded transition dry-run exists, but project-specific Unity change-set dry-run is not generalized yet. | Connect project-specific Unity change sets to transition candidates. |
| Unity Bridge apply/read path | MCP Unity Server / Unity Editor Bridge | Partial | Unity Bridge health endpoint is reachable. | Open Unity, install the canonical package, and run Tools > Codex Unity Bridge > Start Server. |
| Compile check | Onboarding Doctor / unity_compile_status | Verified | unity_compile_status succeeded. | Rerun doctor after Unity Bridge connectivity is restored. |
| Operational validation scenario registration | Live Harness | Verified | 2 operational scenario(s) detected. | Keep at least one classification=Operational scenario for release gates. |
| Play Mode or Unity inspection validation | Live Harness / Input Agent | Verified | Latest operational evidence status: Passed | Run the operational bridge smoke scenario after Unity Bridge and compile checks pass. |
| Evidence export | validation/evidence | Verified | 6 evidence file(s) detected; non-sample Passed evidence=true. | Keep sample evidence separate and link operational evidence to acceptance IDs. |
| Traceability refresh | Traceability View | Partial | Traceability view exists; operational evidence linkage still depends on a Passed run. | Regenerate traceability after operational evidence is captured. |
| Dashboard refresh | Project Dashboard | Partial | Dashboard exists and can show productization status. | Run generate-project-dashboard after productization report updates. |

## Release Blockers

| Blocker | Evidence | Next action |
| --- | --- | --- |
| None | None | None |

## Unity Bridge Package

- Canonical source: plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
- Root mirror role: Deprecated/Mirror install artifact; do not treat as source of truth.

## Input Bridge Role

- Preferred: Codex.UnityBridge.AInvilRuntimeInputTestBridge
- Compatibility: Codex.UnityBridge.AInvilInputTestBridge

## Product MVP Workflow

- Scenario: dungeon_recovery_first_playable_e2e
- Status: Passed
- Human Playability Review: Needs Improvement
- Build Verification: Passed
- Product MVP Ready Candidate: Yes
- Latest evidence: validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json
- Public Release Ready: No
