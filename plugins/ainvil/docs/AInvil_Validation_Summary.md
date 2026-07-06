# AInvil Validation Summary

## 현재 검증 범위

이 문서는 AInvil의 최신 검증 결과를 요약한다. 기준 프로젝트는 `DungeonRecoveryCompany`이며, 현재 결과는 single-project case study이다. 모든 Unity 프로젝트 또는 public release 설치성을 증명하는 문서는 아니다.

## 상태 요약

| 영역 | 상태 | Evidence / Report |
| --- | --- | --- |
| Unity Bridge Stability | Passed | `validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json` |
| Bridge Smoke | Passed | `validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json` |
| Compile Check | Passed | `reports/unity_compile_gate_report.json` |
| Compile Gate Safety | Passed | `validation/evidence/EVID-ainvil-compile-gate-blocks-playmode-latest.json` |
| First Playable E2E | Passed | `validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json` |
| Human Playability Review | Passed | `validation/evidence/EVID-dungeon-recovery-first-playable-human-playability-latest.json` |
| First Playable Build Verification | Passed | `reports/dungeon_recovery_first_playable_build_verification.json` |
| Procedural Recovery Job E2E | Passed | `validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json` |
| Procedural Generation | Passed | `validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json` |
| Procedural Space Quality | Passed | `validation/evidence/EVID-dungeon-recovery-procedural-space-quality-latest.json` |
| Visual Validation | Passed | `validation/evidence/EVID-dungeon-recovery-procedural-visual-validation-latest.json` |
| Procedural Build Verification | Passed | `reports/dungeon_recovery_procedural_recovery_job_build_verification.json` |
| Full Regression | Passed | `reports/regression_suite_latest.json` |
| Production Core Review | Approved | `reports/production_core_review_evaluation.json` |
| Productization | Release Candidate | `reports/productization_status_report.json` |
| Release Readiness | Release Ready | `reports/release_readiness_report.json` |
| Product MVP Ready Candidate | Yes | `reports/productization_status_report.json` |
| Public Release Ready | No | `reports/release_readiness_report.json` |

## 최신 Regression 결과

| 항목 | 값 |
| --- | --- |
| Status | Passed |
| Total | 21 |
| Passed | 21 |
| Failed | 0 |
| Blocked | 0 |
| Workspace | `E:\wiseongjun\Unity\DungeonRecoveryCompany` |
| Evidence stale reuse | false |

## Procedural Space Quality

| Seed | Room Count | Min Room Width | Average Room Area | Corridor Width | Wall Height | Prop Count | Reachable Targets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1001 | 5 | 8 | 77 | 3 | 3.2 | 10 | 3 |
| 2026 | 4 | 7 | 79 | 3 | 3.2 | 10 | 3 |
| 7777 | 5 | 7 | 93 | 3 | 3.2 | 14 | 3 |

공통 결과:

- blocked doorway count: 0
- blocked target count: 0
- target interaction clearance: Passed
- target reachability: Passed
- navigability after props: Passed
- job complete: true

## Visual Validation

| 항목 | 결과 |
| --- | --- |
| Status | Passed |
| Validation Level | Visual Verified |
| Camera Mode | FirstPerson |
| Screenshot Count | 5 |
| Mouse Look | Verified |
| Player Movement | Verified |
| Console Errors | 0 |
| Missing Shader Suspected | false |
| Public Release Ready | false |

## Release Level 해석

현재 주장 가능한 수준:

- Core Release Ready / Release Candidate
- Core RC Reproducibility Verified
- Canonical Unity Bridge Package Verified
- Product MVP Ready Candidate
- Human Playable First Build Candidate
- Procedural Vertical Slice Verified

현재 주장하지 않는 수준:

- Public Release Ready
- 모든 Unity 프로젝트에서 검증 완료
- 완성된 상용 게임
- 완전 자동 게임 제작
- 인간 검토 불필요

## Evidence 사용 원칙

- Operational evidence만 운영 release 판단에 사용한다.
- Example/Sample scenario는 release gate를 만족시키는 evidence로 사용하지 않는다.
- compile error는 `CompileBlocked`, bridge 연결 문제는 `EnvironmentBlocked`로 분리한다.
- LastKnownPassed evidence는 참고할 수 있지만, revalidation required 상태와 구분한다.
