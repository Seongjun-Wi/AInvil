# Case Study: DungeonRecoveryCompany

[Back to README](../../README.md)

## Scope

`DungeonRecoveryCompany` is AInvil's current single-project Product MVP case study. It proves an evidence-grounded Unity workflow on one validated project. It does not prove public release readiness or universal support across all Unity projects.

## What Was Built

AInvil generated a playable recovery-job vertical slice, then expanded it into a procedural recovery job.

Implemented and verified:

- first playable recovery job
- player movement and interaction
- recovery targets
- progress UI and job completion state
- human playability review
- procedural room/corridor generation
- random startup seed
- fixed-seed deterministic validation
- first-person camera and mouse look
- primitive props
- target reachability validation
- Windows development build verification

Generated Unity work is scoped under:

```text
Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/
```

## Validation Highlights

| Area | Result |
| --- | --- |
| First Playable E2E | Passed |
| Human Playability Review | Passed |
| Procedural Recovery Job | Passed |
| Procedural Space Quality | Passed |
| Visual Validation | Passed |
| Build Verification | Passed |
| Public Release Ready | No |

## Procedural Space Metrics

| Seed | Rooms | Average Room Area | Corridor Width | Wall Height | Props | Reachable Targets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1001 | 5 | 77 | 3 | 3.2 | 10 | 3 |
| 2026 | 4 | 79 | 3 | 3.2 | 10 | 3 |
| 7777 | 5 | 93 | 3 | 3.2 | 14 | 3 |

Common checks:

- blocked doorways: 0
- blocked targets: 0
- console errors: 0
- target interaction clearance: Passed
- target reachability: Passed
- stale evidence reused: false

## Evidence

```text
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-first-playable-human-playability-latest.json
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-procedural-space-quality-latest.json
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-procedural-visual-validation-latest.json
plugins/ainvil/validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-build-latest.json
```

## What This Proves

AInvil can take a game request, generate a playable Unity slice, validate it through Play Mode, capture visual evidence, build a Windows development build, and update productization/release reports.

## What This Does Not Prove

- It is not a finished commercial game.
- It is not Public Release Ready.
- It is not a multi-project benchmark.
- It does not remove the need for human playability review.
