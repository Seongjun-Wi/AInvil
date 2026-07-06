# Evidence-Grounded Agentic Workflow for Unity Game Development

## Abstract

This draft describes AInvil, an evidence-grounded agentic workflow for Unity game development. Unlike a simple code-generation tool or raw Unity MCP wrapper, AInvil connects user intent, planning artifacts, Unity implementation, Play Mode validation, visual evidence, regression reporting, and release-readiness decisions. The current evaluation is a single-project case study using `DungeonRecoveryCompany`. The results show that AInvil can generate and validate a playable vertical slice, detect compile and environment blockers, and produce structured evidence and release reports. This is not a claim of public-release readiness, multi-project generalization, or fully automatic game production.

## 1. Introduction

Game development with AI agents often stops at code or asset generation. For production use, generation alone is insufficient. A Unity feature must compile, enter Play Mode, satisfy runtime behavior, remain visually playable, and produce evidence that can be reviewed later.

AInvil is built around the idea that an AI game production agent should preserve traceability from design intent to validation evidence. The workflow is intended to answer not only "what was generated?" but also "what was verified, by what scenario, with what evidence, and what release claim does that support?"

## 2. Related Motivation

The motivation comes from three recurring failure modes in AI-assisted Unity work.

First, code may be generated while compile errors remain. Second, runtime logic can pass while camera framing, UI visibility, or shader issues make the game unplayable. Third, local environment failures such as a disconnected Unity Bridge can be misinterpreted as product failures.

AInvil addresses these issues with compile gating, visual validation, evidence classification, and release-level separation.

## 3. System Design

AInvil is structured as a Codex Plugin with multiple layers.

- Codex Plugin layer registers skills and MCP configuration.
- Agent Skills layer separates Orchestrator, GDD Agent, Unity Agent, and Input Agent responsibilities.
- Platform Core generates productization, review, release, RC, dashboard, and regression reports.
- Unity Bridge connects AInvil to the Unity Editor.
- Live Harness executes operational scenarios.
- Validation Evidence stores scenario-level proof.
- Regression Suite checks whether the current release candidate remains reproducible.

## 4. Workflow Model

The workflow follows this chain:

```text
User request
  -> Feature / Requirement / Task / Acceptance
  -> Unity implementation
  -> Compile Gate
  -> Play Mode validation
  -> Visual Validation Gate
  -> Validation Evidence
  -> Dashboard / Productization / Review
  -> Release Readiness
```

The workflow is intentionally evidence-grounded. A feature should not be promoted solely because code exists. It must be connected to runtime evidence or explicitly marked as partial, blocked, spec-only, or sample.

## 5. Validation Method

Validation combines offline and live checks.

Offline checks include schema validation, report validation, dashboard validation, review validation, CLI validation, and release readiness validation.

Live checks use the Unity Bridge to inspect Unity health, compile status, console logs, hierarchy, Play Mode behavior, validation probes, screenshots, and generated evidence.

The current full regression result is:

```text
21 passed, 0 failed, 0 blocked
```

## 6. Case Study: DungeonRecoveryCompany

`DungeonRecoveryCompany` is a single-project case study used to validate AInvil's Product MVP workflow.

The first playable vertical slice included:

- player movement
- three recovery targets
- interaction through the E key
- progress UI
- job completion state
- Windows build verification
- human playability review

The procedural recovery job extended the slice with:

- random startup seed
- fixed seed determinism for validation
- first-person control
- mouse look
- generated rooms and corridors
- props and recovery targets
- procedural space quality checks
- visual validation gate

Validation seed examples:

- `1001`
- `2026`
- `7777`

## 7. Results

| Area | Result |
| --- | --- |
| Compile Check | Passed |
| Bridge Smoke | Passed |
| First Playable E2E | Passed |
| Human Playability Review | Passed |
| Procedural Recovery Job | Passed |
| Procedural Space Quality | Passed |
| Visual Validation | Passed |
| Build Verification | Passed |
| Full Regression | 21 passed, 0 failed, 0 blocked |
| Public Release Ready | No |

Procedural space metrics:

| Seed | Room Count | Average Room Area | Corridor Width | Wall Height | Prop Count | Reachable Targets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1001 | 5 | 77 | 3 | 3.2 | 10 | 3 |
| 2026 | 4 | 79 | 3 | 3.2 | 10 | 3 |
| 7777 | 5 | 93 | 3 | 3.2 | 14 | 3 |

Visual validation result:

- camera mode: FirstPerson
- screenshot count: 5
- mouse look verified: true
- console errors: 0
- missing shader suspected: false

## 8. Failure Cases and Safety Gates

### Compile errors missed before Play Mode

Failure:

- The system attempted Play Mode validation while compile errors existed.

Safety gate:

- Compile Gate checks Unity compile status and local C# build status before Play Mode.
- Compile errors produce `CompileBlocked` evidence.
- Runtime validation is not promoted when compile is broken.

### Camera and visual issues missed by logic validation

Failure:

- Logic validation passed while the player and targets were not visible in the rendered game view.

Safety gate:

- Visual Validation Gate captures screenshots and checks camera framing, UI visibility, missing shader/magenta signals, player movement, and mouse look.

### Bridge disconnect treated as product failure

Failure:

- Unity Bridge disconnection could appear as a product validation failure.

Safety gate:

- Environment issues are classified as `EnvironmentBlocked`.
- LastKnownPassed evidence is preserved.
- Revalidation Required is separated from feature failure.

## 9. Limitations

This draft reports a single-project case study. It does not establish statistical generalization across Unity projects.

Current limitations:

- Public Release Ready is not claimed.
- The generated game is not a finished commercial product.
- Public installer and onboarding are not fully validated.
- Long-session stability is not yet established.
- Art, sound, tutorial flow, reward loop, and company management loop remain incomplete or placeholder-level.
- Human review remains necessary for creative and playability judgment.

## 10. Future Work

Future work includes:

- multi-project benchmark suite
- public installation flow
- bridge watchdog and auto-recovery
- long-session validation
- save/load validation
- reward and company funds loop
- extraction and return-to-company loop
- richer human playability rubric

## 11. Conclusion

AInvil demonstrates an evidence-grounded Unity game development workflow in a single-project case study. It can generate a playable vertical slice, validate runtime behavior through Play Mode, capture visual evidence, detect compile and environment blockers, and produce release-readiness reports. It is not yet a public-release product, but it has reached a Product MVP Ready Candidate state through the `DungeonRecoveryCompany` case study.

## Korean Summary

AInvil은 현재 evidence 기반 Unity 게임 개발 workflow를 증명한다. 플레이 가능한 vertical slice를 생성하고, Play Mode에서 runtime behavior를 검증하며, visual evidence를 캡처하고, compile 및 environment blocker를 분리하며, release-readiness report까지 생성할 수 있다. 아직 public release 제품은 아니지만, `DungeonRecoveryCompany` 사례를 통해 Product MVP Ready Candidate 상태에 도달했다.
