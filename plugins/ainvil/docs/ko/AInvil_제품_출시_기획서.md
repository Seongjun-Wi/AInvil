# AInvil 제품 출시 기획서

작성일: 2026-07-03
상태: Proposed
대상 제품: AInvil, 작은 아이디어라도 실현시켜주는 AI 게임 제작 회사/플랫폼

## 1. 목표 정의

AInvil의 출시 목표는 사용자가 짧은 아이디어, 불완전한 기획서, 또는 막연한 게임 콘셉트를 제공했을 때 이를 실제로 플레이 가능한 Unity 게임 프로젝트까지 끌고 가는 AI 게임 제작 플랫폼이 되는 것이다.

핵심 약속:

- 사용자의 창작 의도를 보존한다.
- 약한 기획을 비판적으로 보완한다.
- GDD, 시스템 기획, 기술 기획, 구현 작업, 검증 증거를 하나의 흐름으로 연결한다.
- Unity 프로젝트에 실제 변경을 만들고, 컴파일/플레이/입력 검증까지 수행한다.
- 다음에 다시 열었을 때 이어서 작업할 수 있는 제작 기억을 남긴다.

현재 AInvil은 `Foundation-stage AI game production agent with early Production Core workflow artifacts`에 가깝다. 제품 출시를 위해서는 "문서를 잘 쓰는 도구"에서 "반복적으로 플레이 가능한 결과물을 만드는 제품"으로 증명되어야 한다.

## 2. 현재 강점

| 영역 | 현재 확보된 강점 |
| --- | --- |
| 제품 정체성 | AInvil Manifesto, Product Architecture, Maturity Model, Studio Playbook이 존재한다. |
| 에이전트 구조 | Director Layer, Orchestrator, GDD Agent, Unity Agent, Input Agent 역할이 정의되어 있다. |
| 기획 워크플로우 | GDD, System Design, Technical Design, Feature Spec, Traceability 템플릿이 있다. |
| Unity 연동 | Unity Bridge MCP 서버와 Unity Editor 패키지가 있다. |
| 검증 철학 | Validation Level, Evidence, Acceptance Criteria를 구분한다. |
| 상태 관리 | Production State Graph, Production Intelligence Report, Project Dashboard, Traceability View가 있다. |
| 실행 기록 | Workflow Runtime, Transition Approval, Execution Record 기반이 있다. |
| 품질 게이트 | Review & Governance, Capability Benchmark, KPI Framework가 정의되어 있다. |

## 3. 출시까지 부족한 부분

| 부족한 부분 | 현재 문제 | 출시 전 보완 방향 | 우선순위 |
| --- | --- | --- | --- |
| 실제 성공 사례 | 예시 그래프와 실패/부분 증거는 있으나 반복 성공한 Unity vertical slice가 부족하다. | 공식 샘플 프로젝트 1개와 실제 사용자형 게임 1개를 끝까지 완주한다. | P0 |
| 사용자 온보딩 | Unity Bridge 설치, 프로젝트 연결, 첫 작업 시작이 제품 경험으로 정리되지 않았다. | 설치 마법사, 상태 점검, 샘플 프로젝트 생성, 첫 결과 생성 플로우를 만든다. | P0 |
| 제품 UI | Codex 플러그인 중심이라 일반 사용자가 현재 상태, 다음 작업, 증거를 보기 어렵다. | Desktop MVP 또는 Web/Local Dashboard를 제공한다. | P0 |
| 자동 문서 동기화 | 원칙과 일부 리포트는 있으나 Unity 변경이 항상 요구사항/증거/대시보드로 반영되지는 않는다. | Unity ChangeSet -> Graph Patch -> Traceability -> Dashboard 자동 동기화 파이프라인을 만든다. | P0 |
| 검증 반복성 | Play Mode, input validation, compile validation이 제품 데모로 통과했다는 증거가 부족하다. | 공식 harness scenario를 Passed 상태로 만들고 릴리스 게이트에 포함한다. | P0 |
| 출시 패키징 | 플러그인, Unity 패키지, CLI, 문서가 제품 설치물로 묶여 있지 않다. | Codex 플러그인 배포본, Unity 패키지, CLI/desktop installer, 샘플 프로젝트를 버전 단위로 묶는다. | P1 |
| 계정/결제 | 회사 제품으로 판매하기 위한 사용자, 구독, 사용량, 라이선스 모델이 없다. | 로컬 우선 MVP 후 계정/결제/라이선스 서버를 추가한다. | P1 |
| 보안/프라이버시 | 프로젝트 파일, 코드, 에셋, 프롬프트가 어떻게 보호되는지 사용자에게 설명되지 않는다. | 로컬 처리 정책, 외부 모델 전송 범위, 로그 보존 정책, 민감정보 마스킹을 정의한다. | P1 |
| 에셋/라이선스 | 생성/사용 에셋의 출처, 상업 사용 가능 여부, placeholder 교체 조건 관리가 부족하다. | Asset Registry와 License Metadata를 추가한다. | P1 |
| 운영 지표 | KPI 프레임워크는 있으나 제품 운영 지표와 결제/활성/완주율이 연결되지 않았다. | Activation, first playable completion, validation pass rate, retention 지표를 수집한다. | P1 |
| 협업 기능 | 개인 제작 중심이며 팀 권한, 리뷰, 승인, 변경 이력이 제품화되지 않았다. | 팀 기능은 v1.5 이후로 미루되 데이터 모델은 확장 가능하게 둔다. | P2 |
| 엔진 확장 | Unity 중심이다. 다른 엔진은 장기 방향만 존재한다. | 출시 v1은 Unity 전용으로 명확히 선언한다. | P2 |

## 4. 제품 포지셔닝

제품 한 줄 설명:

> AInvil은 작은 게임 아이디어를 기획, 구현, 검증 증거가 연결된 Unity 플레이어블 빌드로 발전시키는 AI 게임 제작 파트너다.

주요 고객:

| 고객 | 문제 | AInvil이 주는 가치 |
| --- | --- | --- |
| 1인 개발자 | 아이디어는 있지만 기획/구현/검증을 혼자 끝내기 어렵다. | 기획 보완, 구현 분해, Unity 자동화, 검증 루프를 제공한다. |
| 기획자 | 문서는 만들 수 있지만 실제 플레이어블 전환이 막힌다. | GDD를 요구사항, 작업, Unity 대상, 검증 기준으로 변환한다. |
| 프로토타입 팀 | 빠르게 아이디어를 검증해야 한다. | vertical slice 제작 시간을 줄이고 증거 기반으로 다음 결정을 돕는다. |
| 교육/해커톤 사용자 | Unity와 게임 제작 프로세스가 낯설다. | 샘플, 안내, 자동 점검으로 첫 플레이어블까지 안내한다. |

출시 v1 범위:

- Unity 전용.
- 싱글 플레이 프로토타입/vertical slice 중심.
- 로컬 프로젝트 우선.
- Codex 플러그인 + CLI + 간단한 Dashboard 또는 Desktop MVP.
- 실제 상용 게임 완성보다 "검증 가능한 첫 플레이어블"을 핵심 가치로 둔다.

출시 v1에서 하지 않을 것:

- MMORPG, 대규모 라이브 서비스, 실시간 멀티플레이 자동 완성.
- 완전 자동 출시/스토어 제출.
- 모든 Unity API 노출 경쟁.
- 사용자 승인 없는 대규모 리팩터링 또는 디자인 변경.

## 5. 출시 제품 기능 목록

### FEAT-LAUNCH-001 아이디어 접수와 제품형 온보딩

목표: 사용자가 첫 실행 후 15분 안에 프로젝트 연결 상태와 첫 작업 경로를 이해한다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-001 | 사용자는 새 게임 아이디어, 기존 GDD, 기존 Unity 프로젝트 중 하나로 시작할 수 있어야 한다. | Planned |
| REQ-LAUNCH-002 | Unity Bridge 설치/연결/패키지 import 상태를 자동 점검해야 한다. | Planned |
| REQ-LAUNCH-003 | 실패 시 사용자가 해결할 수 있는 정확한 next action을 보여줘야 한다. | Planned |
| REQ-LAUNCH-004 | 공식 샘플 프로젝트를 한 번의 명령으로 생성하거나 연결할 수 있어야 한다. | Planned |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-001 | REQ-LAUNCH-001 | 사용자가 AInvil을 처음 연다. | 시작 방식을 선택한다. | 선택에 맞는 첫 워크플로우가 생성된다. | Not tested |
| AC-LAUNCH-002 | REQ-LAUNCH-002 | Unity 프로젝트가 열려 있다. | 연결 점검을 실행한다. | Bridge, package, compile, play mode 준비 상태가 표시된다. | Not tested |
| AC-LAUNCH-003 | REQ-LAUNCH-003 | 연결 실패가 발생한다. | 진단이 완료된다. | 실패 원인과 해결 작업이 하나 이상의 next action으로 기록된다. | Not tested |

### FEAT-LAUNCH-002 Director 기반 기획 검토

목표: 작은 아이디어를 바로 구현하지 않고, 성공 가능성과 제작 위험을 먼저 확인한다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-010 | Director는 핵심 판타지, 코어 루프, 동기, 진행, UX, 범위를 평가해야 한다. | Partially implemented |
| REQ-LAUNCH-011 | 비판은 대안과 tradeoff를 포함해야 하며 사용자 창작 의도를 덮어쓰면 안 된다. | Partially implemented |
| REQ-LAUNCH-012 | 제품 범위 변경이 필요한 제안은 `Needs design confirmation`으로 표시해야 한다. | Partially implemented |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-010 | REQ-LAUNCH-010 | 사용자가 한 문장 아이디어를 제공한다. | Director Review를 실행한다. | 강점, 약점, 위험, 2-4개 개선 옵션이 기록된다. | Document Review |
| AC-LAUNCH-011 | REQ-LAUNCH-012 | 추천안이 게임 정체성을 바꾼다. | Review가 생성된다. | 추천안은 사용자 확인 필요 상태로 남는다. | Document Review |

### FEAT-LAUNCH-003 GDD 완성 및 요구사항 분해

목표: 구현 전에 기획 누락을 드러내고 Feature -> Requirement -> Task -> Acceptance Criteria 체인을 만든다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-020 | GDD Completeness Checker는 fantasy, loop, controls, rules, progression, rewards, failure, UI, content, technical risk를 검사해야 한다. | Partially implemented |
| REQ-LAUNCH-021 | 누락 항목은 `Missing`, `Weak`, `Needs user decision`, `Proposed`로 구분해야 한다. | Partially implemented |
| REQ-LAUNCH-022 | 모든 구현 대상 feature는 requirement, task, BDD acceptance criteria를 가져야 한다. | Planned |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-020 | REQ-LAUNCH-020 | 불완전한 GDD가 있다. | Completeness Check를 실행한다. | 누락/약한 항목과 보완 제안이 기록된다. | Document Review |
| AC-LAUNCH-021 | REQ-LAUNCH-022 | feature가 구현 후보가 된다. | Implementation readiness를 검사한다. | requirement/task/acceptance가 없으면 구현 준비 불가로 표시된다. | Not tested |

### FEAT-LAUNCH-004 플레이어블 vertical slice 제작

목표: 첫 출시 제품의 핵심 증거로, 한 개 이상의 작은 게임을 끝까지 만든다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-030 | 공식 sample vertical slice는 아이디어, 기획, 요구사항, Unity 구현, 검증 증거를 모두 포함해야 한다. | Planned |
| REQ-LAUNCH-031 | Unity Agent는 기존 에셋을 먼저 검색하고 없으면 placeholder를 명확히 기록해야 한다. | Partially implemented |
| REQ-LAUNCH-032 | 생성된 scene, prefab, script, data asset은 requirement/task와 연결되어야 한다. | Planned |
| REQ-LAUNCH-033 | compile, console, Play Mode, input validation 결과가 evidence로 저장되어야 한다. | Partially implemented |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-030 | REQ-LAUNCH-030 | 공식 샘플 프로젝트가 준비되어 있다. | vertical slice workflow를 실행한다. | 플레이어 이동, 목표, 피드백, 실패/성공 조건이 동작한다. | Not tested |
| AC-LAUNCH-031 | REQ-LAUNCH-033 | Play Mode validation이 실행된다. | 입력 검증이 완료된다. | ValidationEvidence가 acceptance id와 Unity target을 포함한다. | Partial |

### FEAT-LAUNCH-005 검증 센터

목표: "작동한다고 말하는" 것이 아니라 어떤 수준으로 검증됐는지 보여준다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-040 | 검증 수준은 Not Checked, Document Review, Static Analysis, Unity Inspection, Compile Verified, Play Mode Verified, Runtime Tested, User Confirmed로 표시해야 한다. | Implemented as policy |
| REQ-LAUNCH-041 | 검증 증거가 없으면 Validated로 승격할 수 없어야 한다. | Partially implemented |
| REQ-LAUNCH-042 | 실패는 BridgeDisconnected, ConsoleError, PreconditionFailed, InputNotReceived, GameLogicFailed, Unknown 등으로 분류해야 한다. | Partially implemented |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-040 | REQ-LAUNCH-041 | acceptance criterion에 evidence가 없다. | dashboard가 생성된다. | 해당 항목은 Needs Validation으로 표시된다. | Partial |
| AC-LAUNCH-041 | REQ-LAUNCH-042 | input validation이 실패한다. | failure classifier가 실행된다. | 실패 원인, 영향 requirement, next action이 기록된다. | Partial |

### FEAT-LAUNCH-006 프로젝트 기억과 이어하기

목표: 사용자가 다음 세션에서 "어디까지 했고 다음에 뭘 해야 하는지" 바로 알 수 있다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-050 | 프로젝트는 current milestone, active feature, blockers, open questions, next action을 저장해야 한다. | Partially implemented |
| REQ-LAUNCH-051 | Project Dashboard는 graph/evidence에서 생성되어야 하며 별도 진실 원천이 되면 안 된다. | Partially implemented |
| REQ-LAUNCH-052 | 사용자는 dashboard에서 다음 권장 작업과 담당 agent를 볼 수 있어야 한다. | Partially implemented |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-050 | REQ-LAUNCH-050 | 이전 작업 기록이 있다. | AInvil을 다시 시작한다. | 현재 milestone, blocker, next action이 표시된다. | Partial |

### FEAT-LAUNCH-007 출시용 제품 표면

목표: Codex 내부 도구가 아니라 사용자가 이해할 수 있는 제품 경험을 제공한다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-060 | MVP Dashboard는 Project, Plan, Documents, Unity Status, Validation, Evidence, Next Actions를 보여줘야 한다. | Planned |
| REQ-LAUNCH-061 | 사용자는 위험한 실행 전에 dry-run 결과와 변경 예정 파일을 확인해야 한다. | Planned |
| REQ-LAUNCH-062 | 생성/수정 문서는 UI에서 열람 가능해야 한다. | Planned |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-060 | REQ-LAUNCH-060 | 프로젝트가 연결되어 있다. | Dashboard를 연다. | 상태, 문서, 검증, 다음 작업이 한 화면에서 보인다. | Not tested |
| AC-LAUNCH-061 | REQ-LAUNCH-061 | 실행이 파일/Unity 상태를 바꿀 수 있다. | 사용자가 apply를 누른다. | 변경 요약과 승인 단계가 표시된다. | Not tested |

### FEAT-LAUNCH-008 상용화 기반

목표: 회사 제품으로 운영 가능한 라이선스, 로그, 보안, 지원 구조를 마련한다.

요구사항:

| requirement id | 요구사항 | 상태 |
| --- | --- | --- |
| REQ-LAUNCH-070 | 로컬 프로젝트 파일과 외부 모델 전송 범위를 사용자에게 명확히 보여줘야 한다. | Planned |
| REQ-LAUNCH-071 | 사용자 설정, 모델 제공자, API key, Unity path, workspace path를 안전하게 관리해야 한다. | Planned |
| REQ-LAUNCH-072 | 라이선스 또는 구독 상태를 확인할 수 있어야 한다. | Planned |
| REQ-LAUNCH-073 | 에러 리포트는 사용자가 동의한 경우에만 외부로 전송되어야 한다. | Planned |

수용 기준:

| acceptance id | related requirement | given | when | then | status |
| --- | --- | --- | --- | --- | --- |
| AC-LAUNCH-070 | REQ-LAUNCH-070 | 사용자가 외부 모델을 선택한다. | 작업을 시작한다. | 전송될 정보 범위가 설정/정책에 표시된다. | Not tested |
| AC-LAUNCH-071 | REQ-LAUNCH-073 | 오류가 발생한다. | 리포트 생성을 요청한다. | 민감정보 제거 후 사용자 승인에 따라 저장/전송된다. | Not tested |

## 6. MVP 출시 범위

P0 MVP에 반드시 포함:

- 첫 실행 온보딩과 Unity 연결 점검.
- 아이디어 -> Director Review -> GDD Completeness -> Feature/Requirement/Task/Acceptance 생성.
- 공식 sample vertical slice 1개.
- Unity Bridge를 통한 구현, compile check, Play Mode/input validation.
- ValidationEvidence 저장.
- Traceability View, Project Dashboard, Sync Report 자동 생성.
- Dry-run/apply 구분과 실행 기록.
- 한국어 사용자 응답과 한국어 프로젝트 문서 생성.

P1 Beta에 포함:

- Desktop Dashboard 또는 local web dashboard.
- Asset Registry와 placeholder/license tracking.
- 결제/라이선스 기초.
- 에러 리포트와 사용자 동의 기반 telemetry.
- benchmark report의 live scored dimension.
- real dogfooding graph와 sample-game graph 분리.

P2 이후:

- 팀 협업.
- cloud sync.
- multi-project dashboard.
- 추가 엔진 지원.
- asset marketplace/creator 연결.

## 7. 사용자 여정

1. 사용자가 AInvil을 설치한다.
2. AInvil이 Unity, Unity Bridge, 패키지, 프로젝트 폴더를 점검한다.
3. 사용자가 한 문장 아이디어를 입력한다.
4. Director가 의도, 강점, 약점, 위험, 개선 옵션을 제안한다.
5. 사용자가 방향을 확정하거나 수정한다.
6. GDD Agent가 한국어 GDD, System Design, Technical Design, Feature Spec을 만든다.
7. Orchestrator가 Feature -> Requirement -> Task -> Acceptance Criteria 체인을 만든다.
8. Unity Agent가 scene, prefab, script, data asset 계획을 만들고 dry-run을 보여준다.
9. 사용자가 승인하면 Unity 변경을 적용한다.
10. Compile, Console, Play Mode, Input Validation이 실행된다.
11. Evidence, Traceability, Dashboard, Next Action이 갱신된다.
12. 사용자는 플레이 가능한 결과와 남은 작업을 확인한다.

## 8. 릴리스 게이트

출시 v1을 선언하기 위한 최소 조건:

| gate | 통과 기준 |
| --- | --- |
| Product Proof | 공식 sample vertical slice 1개가 반복 실행에서 통과한다. |
| Traceability | 모든 MVP feature가 requirement, task, acceptance, Unity target, evidence와 연결된다. |
| Validation | compile, play mode, input validation 증거가 존재한다. |
| Resume | dashboard가 current milestone, blocker, next action을 정확히 표시한다. |
| Safety | 위험한 변경은 dry-run과 승인 없이 실행되지 않는다. |
| Docs | 한국어 사용자 문서와 영어 내부 원천 문서가 충돌하지 않는다. |
| Packaging | Codex plugin, Unity package, CLI/dashboard, sample project가 버전으로 묶인다. |
| Support | 설치 실패, bridge 실패, compile 실패의 해결 가이드가 존재한다. |

## 9. 성공 지표

| 지표 | MVP 목표 |
| --- | --- |
| 첫 플레이어블 도달률 | 온보딩 시작 사용자 중 50% 이상이 sample playable까지 도달 |
| 첫 플레이어블 소요 시간 | 샘플 기준 30분 이내 |
| 검증 증거 커버리지 | MVP acceptance criteria 100% evidence 연결 |
| 실패 분류율 | validation failure의 90% 이상이 분류된 원인을 가짐 |
| 이어하기 정확도 | dashboard next action이 수동 검토와 90% 이상 일치 |
| 사용자 수정 요구 | 생성된 GDD/Technical Design의 중대 수정 요청 30% 이하 |
| 재현 가능성 | clean workspace에서 sample vertical slice 3회 연속 성공 |

## 10. 핵심 위험과 대응

| 위험 | 영향 | 대응 |
| --- | --- | --- |
| Unity 환경 차이로 데모가 자주 실패 | 제품 신뢰 하락 | 지원 Unity 버전 고정, sample project 제공, bridge health doctor 강화 |
| 문서는 좋지만 실제 플레이어블이 약함 | 제품 포지셔닝 실패 | 출시 gate를 문서 수량이 아니라 playable/evidence로 둔다 |
| AI가 사용자 의도를 과도하게 바꿈 | 창작 도구로서 신뢰 하락 | `Needs design confirmation`과 decision log를 강제한다 |
| 검증 없이 성공이라고 말함 | 제품 신뢰 치명타 | evidence 없는 validation promotion 금지 |
| 기능 범위가 너무 넓어짐 | 출시 지연 | v1은 Unity single-player vertical slice로 제한 |
| 상용 에셋 라이선스 문제 | 법적/운영 리스크 | Asset Registry와 license metadata를 P1에 포함 |

## 11. 결론

AInvil의 방향은 충분히 차별적이다. 단, 출시 제품이 되려면 "AI가 게임을 만들 수 있다"는 말을 문서가 아니라 반복 가능한 플레이어블 증거로 보여줘야 한다. 따라서 다음 우선순위는 명확하다.

1. 공식 sample vertical slice를 Passed 상태로 만든다.
2. 온보딩과 Unity 연결 진단을 제품 경험으로 만든다.
3. Unity 변경, 검증 증거, 문서 동기화, dashboard를 하나의 자동 루프로 묶는다.
4. 사용자가 읽을 수 있는 한국어 문서와 제품 UI를 제공한다.
5. 상용화를 위한 라이선스, 보안, telemetry, packaging을 추가한다.
