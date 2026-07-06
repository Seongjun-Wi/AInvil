# AInvil Regression Suite

- Started at: 2026-07-06T06:14:16.252Z
- Finished at: 2026-07-06T06:16:54.088Z
- Mode: offline-plus-live
- Status: Passed
- Workspace type: Fresh
- Workspace path: E:\wiseongjun\Unity\DungeonRecoveryCompany
- Evidence file used: validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json
- Stale evidence reused: false

| Step | Status | Optional | Next action |
| --- | --- | --- | --- |
| compile-gate | Passed | no | None |
| unity-edit-mode-before-product-build | Passed | no | None |
| product-mvp-build-verification | Passed | no | None |
| procedural-live-harness | Passed | no | None |
| unity-edit-mode-before-procedural-build | Passed | no | None |
| procedural-build-verification | Passed | no | None |
| procedural-visual-validation | Passed | no | None |
| procedural-space-quality-validation | Passed | no | None |
| review | Passed | no | None |
| productization | Passed | no | None |
| release | Passed | no | None |
| productization-final | Passed | no | None |
| dashboard | Passed | no | None |
| rc-baseline | Passed | no | None |
| validate-review-records | Passed | no | None |
| validate-release-readiness-report | Passed | no | None |
| validate-project-dashboard | Passed | no | None |
| validate-validation-evidence | Passed | no | None |
| validate-ainvil-harness | Passed | no | None |
| validate-validation-design | Passed | no | None |
| validate-ainvil-cli-offline | Passed | no | None |

## Live Smoke

- Requested: false
- Required: false
- Status: NotRun

## Product MVP

- Requested: false
- Status: NotRun
- Evidence file used: validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json
- Playability requested: false
- Playability status: NotRun
- Build requested: true
- Build status: Passed

## Procedural Recovery Job

- Requested: true
- Status: Passed
- Evidence file used: validation/evidence/EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json
- Build requested: true
- Build status: Passed

## Visual Validation

- Requested: true
- Status: Passed
- Evidence file used: validation/evidence/EVID-dungeon-recovery-procedural-visual-validation-latest.json
- Report: reports/dungeon_recovery_procedural_visual_review.json
- Screenshot directory: reports/visual_review/screenshots
- Human review required: true

## Compile Gate

- Requested: true
- Status: Passed
- Blocker type: None
- Can enter Play Mode: true
- Compile error count: 0
- Report: reports/unity_compile_gate_report.json

## Compile Gate Safety

- Requested: false
- Status: NotRun
- Evidence file used: validation/evidence/EVID-ainvil-compile-gate-blocks-playmode-latest.json
- Report: reports/ainvil_compile_gate_safety_regression_report.json

## Procedural Space Quality

- Requested: true
- Status: Passed
- Evidence file used: validation/evidence/EVID-dungeon-recovery-procedural-space-quality-latest.json
- Report: reports/dungeon_recovery_procedural_space_quality_review.json
- Dry-run report: reports/dungeon_recovery_procedural_space_quality_dry_run.json
