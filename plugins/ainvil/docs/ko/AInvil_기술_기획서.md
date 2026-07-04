# AInvil 기술 기획서

작성일: 2026-07-03
상태: Proposed
대상: AInvil 출시 MVP 구현

## 1. 기술 목표

이 문서는 AInvil을 "작은 아이디어를 실제 Unity 플레이어블로 만드는 제품"으로 출시하기 위해 필요한 구현 방법을 정의한다.

기술 목표:

- 아이디어에서 검증 증거까지 이어지는 end-to-end workflow를 자동화한다.
- Codex plugin에 묶인 기능을 유지하되 platform core로 분리 가능한 구조를 만든다.
- Unity 작업은 반드시 requirement, task, acceptance criteria, evidence와 연결한다.
- 위험한 변경은 dry-run, approval, execution record, rollback plan을 거친다.
- 한국어 사용자 문서와 UI를 지원하되 내부 schema/API는 영어를 유지한다.

## 2. 목표 아키텍처

```text
User / Dashboard / Codex / CLI
  -> AInvil Platform Core
    -> Project Workspace Manager
    -> Director Review Engine
    -> GDD Completion Engine
    -> Requirement Planner
    -> Workflow Runtime Executor
    -> Production State Graph
    -> Production Intelligence Engine
    -> Review & Governance
    -> Sync Engine
    -> Traceability Generator
    -> Evidence Store
  -> Engine Integrations
    -> Unity Bridge MCP Server
    -> Unity Editor Package
    -> Runtime Input Test Bridge
  -> Generated Outputs
    -> GDD / System Design / Technical Design / Feature Specs
    -> Scene / Prefab / Component Contracts
    -> Validation Evidence
    -> Project Dashboard
    -> Traceability View
```

v1에서는 Unity만 지원한다. Core는 future multi-client를 고려하지만 출시 구현은 현재 plugin 구조를 깨지 않는 방향으로 진행한다.

## 3. 주요 모듈 구현

### 3.1 Workspace Manager

역할:

- AInvil 프로젝트 루트, Unity 프로젝트 루트, 문서 폴더, evidence 폴더를 관리한다.
- 최초 실행 시 workspace manifest를 생성한다.
- sample project 생성 또는 연결을 지원한다.

신규/확장 파일:

| 파일 | 설명 |
| --- | --- |
| `plugins/ainvil/core/workspace-manager.mjs` | workspace 탐색, 생성, 상태 점검 |
| `plugins/ainvil/schemas/workspace_manifest.schema.json` | workspace manifest schema |
| `plugins/ainvil/reports/workspace_status.json` | 현재 연결 상태 |

주요 데이터:

| field | type | 설명 |
| --- | --- | --- |
| `workspaceId` | string | AInvil 작업공간 ID |
| `unityProjectPath` | string | Unity 프로젝트 경로 |
| `docsPath` | string | 문서 출력 경로 |
| `graphPath` | string | production state graph 경로 |
| `evidencePath` | string | validation evidence 경로 |
| `language` | string | 사용자 문서 기본 언어, 예: `ko` |
| `createdAt` | string | 생성 시각 |
| `lastOpenedAt` | string | 마지막 사용 시각 |

### 3.2 Onboarding Doctor

역할:

- Unity 설치 여부, Unity 프로젝트, Unity Bridge package, MCP server, port, compile 상태를 진단한다.
- 실패를 사용자가 해결 가능한 next action으로 변환한다.

구현:

- 기존 Unity Bridge health endpoint를 사용한다.
- CLI 명령 `ainvil doctor`를 추가한다.
- Dashboard 첫 화면에서 doctor 결과를 표시한다.

진단 항목:

| check id | 검사 | 실패 시 next action |
| --- | --- | --- |
| CHECK-UNITY-001 | Unity project path 존재 여부 | 프로젝트 경로 선택 |
| CHECK-UNITY-002 | Unity Bridge package 설치 여부 | package import 안내 |
| CHECK-UNITY-003 | MCP server 실행 가능 여부 | plugin reload 또는 server log 확인 |
| CHECK-UNITY-004 | Bridge health 응답 여부 | Unity Editor 열기, bridge start |
| CHECK-UNITY-005 | compile status 확인 | console error review 실행 |
| CHECK-UNITY-006 | play mode 진입 가능 여부 | blocking error 제거 |

### 3.3 Director Review Engine

역할:

- 사용자의 아이디어를 제품형 질문으로 구조화한다.
- 핵심 판타지, 코어 루프, 진행, UX, 범위, 위험을 평가한다.
- 사용자 확인이 필요한 제안을 명시한다.

출력 파일:

| 파일 | 설명 |
| --- | --- |
| `Docs/Director_Review.md` | 사람이 읽는 review |
| `reviews/director_review_*.json` | 구조화된 review record |

Review record 필드:

| field | type | 설명 |
| --- | --- | --- |
| `reviewId` | string | Review ID |
| `reviewType` | string | `VisionReview` 또는 `DesignReview` |
| `visionSummary` | string | 게임 의도 요약 |
| `concerns` | array | 문제와 위험 |
| `recommendations` | array | 제안 |
| `confirmationStatus` | string | Confirmed, Proposed, NeedsDesignConfirmation 등 |
| `affectedFeatureIds` | array | 영향 feature |
| `createdAt` | string | 생성 시각 |

### 3.4 GDD Completion Engine

역할:

- 누락된 GDD 항목을 검사한다.
- Proposed default를 만들되 사용자 의도와 충돌하지 않게 표시한다.
- 구현 가능한 feature spec과 requirement를 생성한다.

출력:

| 출력 | 위치 |
| --- | --- |
| GDD | `Docs/01_GDD.md` |
| System Design | `Docs/02_System_Design.md` |
| Technical Design | `Docs/03_Technical_Design.md` |
| Feature Spec | `Docs/Features/FS_*.md` |
| Completeness Report | `reports/gdd_completeness_report.json` 또는 `Docs/GDD_Completeness_Report.md` |

검사 규칙:

- feature에 requirement가 없으면 `Needs Requirement Definition`.
- requirement에 acceptance criteria가 없으면 `Needs Acceptance Criteria`.
- prototype behavior가 production behavior를 대체하면 `Design Drift Risk`.
- missing user decision은 technical implementation으로 넘기지 않는다.

### 3.5 Requirement Planner

역할:

- Feature -> Requirement -> Task -> Acceptance Criteria 체인을 만든다.
- ID를 안정적으로 생성하고 재사용한다.

ID 규칙:

| type | 예시 |
| --- | --- |
| Feature | `FEAT-CORE-001` |
| Requirement | `REQ-CORE-001` |
| Task | `TASK-UNITY-001` |
| Acceptance | `AC-CORE-001` |
| Unity Target | `UNITY-SCENE-001` |
| Evidence | `EVID-CORE-001` |

Planner 출력:

| 파일 | 설명 |
| --- | --- |
| `reports/implementation_plan.json` | 구현 후보 task와 dependency |
| `reports/acceptance_plan.json` | BDD acceptance criteria |
| `reports/handoff_packet.json` | Unity/Input Agent 전달 패킷 |

### 3.6 Workflow Runtime Executor

역할:

- 승인된 transition만 실행한다.
- dry-run을 기본값으로 사용한다.
- 실행 기록을 남긴다.

기존 파일:

- `plugins/ainvil/core/workflow-executor.mjs`
- `plugins/ainvil/workflow/runs/*.json`

확장 정책:

| transition | dry-run | apply | 조건 |
| --- | --- | --- | --- |
| `RunBenchmark` | 허용 | 허용 | low risk |
| `GenerateDocs` | 허용 | 허용 | graph mutation 없음 |
| `PrepareSampleProject` | 허용 | 허용 | workspace 내부만 수정 |
| `ApplyUnityChangeSet` | 허용 | 제한 허용 | 사용자 승인, backup, Unity reachable 필요 |
| `PromoteValidationLevel` | 허용 | 제한 허용 | evidence refs 필수 |
| `ApplyGraphPatch` | 허용 | 제한 허용 | schema validation, backup 필수 |

실행 전 체크:

1. transition id가 plan에 존재한다.
2. approval class가 apply 가능하다.
3. required evidence가 존재한다.
4. target path가 workspace 내부다.
5. backup 또는 patch plan이 생성된다.
6. 실패 시 blocked next action을 기록한다.

### 3.7 Unity ChangeSet Pipeline

역할:

- Unity 변경을 계획, 적용, 기록, 동기화한다.

흐름:

```text
Requirement + Task
  -> Unity Implementation Plan
  -> UnityChangeSet dry-run
  -> User approval
  -> Unity Bridge apply
  -> Compile / Console check
  -> UnityChangeSet result
  -> Graph Patch Plan
  -> Traceability / Dashboard sync
```

UnityChangeSet 최소 필드:

| field | type | 설명 |
| --- | --- | --- |
| `changeSetId` | string | 변경 ID |
| `taskIds` | array | 연결 task |
| `requirementIds` | array | 연결 requirement |
| `operations` | array | scene/object/component/prefab/script 작업 |
| `dryRunSummary` | object | 적용 전 요약 |
| `createdObjects` | array | 생성된 Unity 대상 |
| `modifiedObjects` | array | 수정된 Unity 대상 |
| `placeholderRecords` | array | placeholder와 교체 조건 |
| `result` | string | Succeeded, Failed, Blocked |
| `evidenceRefs` | array | compile/inspection evidence |

필수 안전 조건:

- 기존 사용자 파일 변경 전 diff 또는 backup 생성.
- scene/prefab/script target이 requirement와 연결되어야 함.
- placeholder primitive는 registry에 `Prototype Placeholder`로 기록.
- compile error 발생 시 validation으로 승격하지 않음.

### 3.8 Validation Center

역할:

- Compile, Console, Play Mode, Input, Game Logic 검증을 하나의 evidence 모델로 저장한다.

Evidence schema:

| field | type | 설명 |
| --- | --- | --- |
| `evidenceId` | string | 증거 ID |
| `source` | string | LiveHarness, UnityBridge, Manual, StaticValidator |
| `validationLevel` | string | Compile Verified 등 |
| `status` | string | Passed, Failed, Blocked, Warning, NotRun |
| `acceptanceIds` | array | 연결 acceptance |
| `requirementIds` | array | 연결 requirement |
| `taskIds` | array | 연결 task |
| `unityTargets` | array | scene/prefab/object/script/data |
| `checks` | array | 세부 검사 |
| `failureClassification` | string | 실패 유형 |
| `remainingGaps` | array | 남은 검증 공백 |
| `createdAt` | string | 생성 시각 |

검증 단계:

1. Static validators.
2. Unity Bridge health.
3. Compile status.
4. Console error review.
5. Play Mode enter/exit.
6. Runtime input bridge setup.
7. Scenario-specific input test.
8. Acceptance criteria assertion.
9. Evidence export.
10. Dashboard/traceability sync.

### 3.9 Sync Engine

역할:

- graph, evidence, review, UnityChangeSet, benchmark, KPI를 읽어 operational view를 생성한다.
- source-of-truth 문서를 무단 변경하지 않고 drift를 보고한다.

기존/확장 파일:

| 파일 | 설명 |
| --- | --- |
| `core/sync-report.mjs` | sync report 생성 |
| `core/traceability-view.mjs` | traceability view 생성 |
| `core/project-dashboard.mjs` | dashboard 생성 |
| `reports/sync_report.json` | drift와 next action |
| `reports/traceability_view.json` | graph-derived traceability |
| `reports/project_dashboard.json` | resume state |

Drift 유형:

| drift | 의미 | 처리 |
| --- | --- | --- |
| `RequirementWithoutTask` | 요구사항은 있으나 구현 작업 없음 | task 생성 제안 |
| `TaskWithoutUnityTarget` | 작업은 있으나 Unity 대상 없음 | technical mapping 필요 |
| `AcceptanceWithoutEvidence` | 검증 기준은 있으나 증거 없음 | validation 실행 |
| `OrphanUnityArtifact` | Unity 대상은 있으나 요구사항 연결 없음 | requirement 정의 필요 |
| `EvidenceWithoutAcceptance` | 증거는 있으나 acceptance 연결 없음 | evidence link 보완 |
| `PrototypeReplacingProduction` | 임시 동작이 제품 동작처럼 취급됨 | design confirmation 필요 |

### 3.10 Dashboard 또는 Desktop MVP

v1 권장 구현:

- 먼저 local web dashboard 또는 CLI dashboard를 만든다.
- 이후 Tauri desktop으로 감싼다.

화면:

| 화면 | 기능 |
| --- | --- |
| Project Home | milestone, active feature, next action |
| Idea Intake | 아이디어 입력, GDD 업로드 |
| Review | Director Review, open questions |
| Documents | GDD/System/Technical/Feature Spec 보기 |
| Unity Status | bridge, compile, play mode, package 상태 |
| Task Board | requirement/task/acceptance 상태 |
| Validation Center | evidence, failure, validation level |
| Change Preview | dry-run 결과와 apply 승인 |
| Settings | provider, model, API key, path, language |

기술 스택:

| 선택지 | 권장 |
| --- | --- |
| MVP | Node CLI + local web dashboard |
| Desktop | Tauri |
| Frontend | React 또는 Svelte |
| Backend | Node platform core 재사용 |
| Storage | 파일 기반 JSON/Markdown 우선, 이후 SQLite 옵션 |

## 4. 데이터 저장 전략

MVP는 파일 기반으로 유지한다.

| 데이터 | 저장 위치 | 이유 |
| --- | --- | --- |
| GDD/기획 문서 | `Docs/**/*.md` | 사용자가 읽고 수정하기 쉬움 |
| Graph | `state/production_state_graph.json` | 운영 상태 backbone |
| Evidence | `validation/evidence/*.json` | 검증 증거 독립 보존 |
| Workflow runs | `workflow/runs/*.json` | 실행 이력 추적 |
| Reports | `reports/*.json`, `reports/*.md` | dashboard/traceability/sync view |
| Reviews | `reviews/*.json` | 의사결정 기록 |
| Settings | user config 또는 workspace manifest | 환경별 설정 |

SQLite 도입 조건:

- 프로젝트 수가 많아져 dashboard 조회가 느려질 때.
- 팀 협업, 권한, 이력 검색이 필요할 때.
- cloud sync를 추가할 때.

## 5. 보안과 프라이버시 구현

필수 정책:

- 로컬 프로젝트 파일은 사용자 승인 없이 외부 서버로 전송하지 않는다.
- 외부 LLM 호출 시 전송되는 context pack을 로그로 확인 가능하게 한다.
- API key는 OS credential store 또는 암호화된 config에 저장한다.
- error report는 opt-in으로만 전송한다.
- 민감정보 마스킹 규칙을 적용한다.

구현 항목:

| 항목 | 구현 |
| --- | --- |
| Context Pack Preview | LLM 호출 전 포함 파일/토큰 요약 표시 |
| Secret Redaction | API key, path token, email, license key masking |
| Local Log Policy | 기본 로컬 저장, 외부 전송 off |
| Consent Dialog | 오류 보고, telemetry, benchmark 공유 전 승인 |
| Access Boundary | workspace 외부 파일 write 금지 |

## 6. 결제/라이선스 기술 방향

MVP에서는 로컬 라이선스 파일 또는 계정 없는 preview mode를 허용한다.

Beta 이후:

| 모듈 | 설명 |
| --- | --- |
| License Server | subscription, trial, seat 상태 확인 |
| Usage Meter | AI call, validation run, project count 집계 |
| Entitlement | free/pro/pro-team 기능 제한 |
| Offline Grace | 일정 기간 오프라인 사용 허용 |
| Billing Provider | Stripe 등 외부 결제 연동 |

로컬 저장 필드:

| field | 설명 |
| --- | --- |
| `licenseId` | 라이선스 ID |
| `plan` | Free, Pro, Team |
| `status` | Active, Trial, Expired |
| `expiresAt` | 만료일 |
| `lastCheckedAt` | 마지막 서버 확인 |

## 7. 구현 로드맵

### Milestone M0: 출시 증거 정리

목표: 현재 상태와 gap을 제품적으로 볼 수 있게 만든다.

작업:

- 이 한국어 제품/기술 기획서 추가.
- current gate decision과 validation gap을 dashboard에 명확히 표시.
- sample vertical slice 후보 확정.

완료 기준:

- docs/ko 문서가 존재한다.
- P0 gap 목록이 traceability 또는 planning issue로 전환 가능하다.

### Milestone M1: Onboarding Doctor

작업:

- `core/workspace-manager.mjs` 추가.
- `ainvil doctor` CLI 추가.
- Unity Bridge/package/compile/play mode health check 추가.
- 실패별 next action 생성.

완료 기준:

- clean workspace에서 doctor가 성공/실패를 재현 가능하게 보고한다.

### Milestone M2: 공식 Sample Vertical Slice

작업:

- sample project 준비 또는 생성.
- top-down collectible 또는 dungeon cleanup slice를 공식 시나리오로 확정.
- requirement/task/acceptance/evidence 연결.
- live harness passed 상태 확보.

완료 기준:

- 3회 연속 compile + play mode + input validation 통과.
- evidence가 acceptance criteria와 연결된다.

### Milestone M3: Unity ChangeSet Sync

작업:

- UnityChangeSet dry-run/apply 모델 구현.
- Graph Patch Plan 구현.
- Orphan artifact/drift detection 구현.
- sync report에서 Unity 변경 반영.

완료 기준:

- Unity 변경 후 dashboard와 traceability가 자동 갱신된다.

### Milestone M4: Product Dashboard

작업:

- local web dashboard 구축.
- Project Home, Unity Status, Documents, Validation Center, Change Preview 구현.
- 한국어 사용자 UI 지원.

완료 기준:

- 사용자가 CLI 로그를 읽지 않아도 현재 상태와 다음 작업을 이해한다.

### Milestone M5: Beta Packaging

작업:

- Codex plugin 배포본 정리.
- Unity package 버전 고정.
- CLI/dashboard 실행 스크립트 제공.
- install/repair/doctor 가이드 작성.
- 라이선스/보안 정책 초안 추가.

완료 기준:

- 새 PC 또는 clean workspace에서 설치 -> sample playable까지 재현된다.

## 8. 테스트 전략

Static:

- JSON schema validation.
- Node syntax check.
- plugin validator.
- benchmark dataset validator.
- generated report validator.

Integration:

- `ainvil doctor`.
- workflow transition dry-run/apply.
- Unity Bridge health.
- compile status.
- Play Mode enter/exit.
- runtime input bridge.

End-to-end:

- idea -> Director Review.
- GDD -> requirement/task/acceptance.
- UnityChangeSet dry-run -> apply.
- compile/play/input validation.
- evidence export.
- traceability/dashboard sync.

Regression:

- sample vertical slice 3회 연속 성공.
- 기존 문서가 생성 view에 의해 덮어써지지 않는지 확인.
- evidence 없는 validation promotion 차단.
- workspace 외부 write 차단.

## 9. Definition of Done

출시 MVP의 완료 조건:

- 사용자가 한국어로 아이디어를 입력하면 한국어 GDD와 기술 기획서가 생성된다.
- 공식 sample vertical slice가 반복적으로 통과한다.
- 모든 구현 feature가 requirement/task/acceptance/evidence에 연결된다.
- Unity 변경은 dry-run, approval, execution record를 가진다.
- Dashboard가 현재 상태, blocker, validation gap, next action을 보여준다.
- 실패는 분류되어 사용자에게 다음 조치를 제공한다.
- 보안/프라이버시/라이선스의 최소 정책이 문서화되어 있다.

## 10. 즉시 다음 작업

1. `ainvil doctor`와 workspace manifest를 만든다.
2. 공식 sample vertical slice를 하나로 확정한다.
3. 현재 실패 중인 live harness scenario를 Passed로 만든다.
4. UnityChangeSet과 Graph Patch Plan을 연결한다.
5. local dashboard MVP를 만든다.
