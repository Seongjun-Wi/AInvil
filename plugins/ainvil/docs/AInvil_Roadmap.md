# AInvil Roadmap

## 현재 위치

AInvil은 현재 `Core Release Ready / Release Candidate` 및 `Product MVP Ready Candidate` 상태이다. `DungeonRecoveryCompany` 단일 프로젝트 사례에서 Unity Bridge, Compile Gate, Play Mode validation, Visual Validation, Build Verification, Productization, Release Readiness까지 evidence 기반 흐름을 검증했다.

`Public Release Ready`는 아직 주장하지 않는다.

## Completed

- Core Release Candidate
- Fresh Workspace Verification
- Canonical Unity Bridge Package Verification
- Unity Bridge operational smoke validation
- Production Core Review Approved
- Productization Release Candidate
- Release Readiness Release Ready
- Product MVP E2E
- Human Playability Review Passed
- Human Playable First Build Candidate
- Procedural Recovery Job
- Random Startup Seed
- Fixed Seed Determinism for validation
- First Person Control / Mouse Look
- Procedural Space Quality
- Visual Validation
- Compile Gate Safety
- Build Verification
- Full Regression: 21 passed, 0 failed, 0 blocked

## Next

- Extraction / Return-to-Company loop
- Reward / company funds loop
- Save/load
- Longer playability test
- Better install experience
- Bridge watchdog / auto-recovery
- Public release packaging
- Richer tutorial and onboarding flow
- Improved art, sound, and recovery feedback
- Multi-project benchmark expansion

## Not Yet

- Public Release Ready
- Multi-project benchmark completion
- User-facing installer
- Robust UI/UX onboarding
- Long-session stability
- Production-quality art direction
- Production-quality sound and effects
- Full reward, economy, and company management loop
- Claim that all Unity projects are supported
- Claim that human review is unnecessary

## Release Level Policy

Use these terms precisely:

- `Core Release Ready / Release Candidate`: AInvil Core, Unity Bridge smoke, evidence pipeline, review, productization, and release reports are verified.
- `Product MVP Ready Candidate`: AInvil produced and validated a playable Product MVP slice in `DungeonRecoveryCompany`.
- `Public Release Ready`: Not claimed. Requires public installation, broader docs, error handling, multi-environment confidence, and stronger onboarding.

## Safety Work Still Needed

- Keep Compile Gate before Play Mode validation.
- Keep Visual Validation Gate for camera, shader, and UI visibility problems.
- Keep `EnvironmentBlocked` separate from product failure.
- Keep Example/Sample harnesses out of operational release gates.
- Keep public release claims separate from case-study evidence.
