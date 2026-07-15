# AInvil Core RC Baseline Manifest

- RC: AInvil Core RC
- Version: core-rc-2026-07-06
- Generated at: 2026-07-06T11:28:09.769Z
- Release level: Core Release Ready / Product MVP Ready Candidate
- Production Core review: Changes Requested
- Release readiness: Not Release Ready
- Productization: Release Candidate
- Fresh workspace verification: Core RC Reproducibility Verified
- Canonical Unity Bridge package verified: Yes
- Product MVP E2E: Passed
- Human Playability Review: Passed
- Build Verification: Passed
- Product MVP Ready Candidate: Yes
- Procedural Recovery Job: Passed
- Procedural Generation Verified: Yes
- Visual Validation: Passed
- Procedural Space Quality: Passed
- Screenshot Evidence Available: Yes
- Camera Framing Check: Passed
- Missing Shader Suspected: No
- Public Release Ready: No

## Evidence

- Production Core review: reviews/production_core_readiness_review.json
- Production Core review evaluation: reports/production_core_review_evaluation.json
- Release readiness: reports/release_readiness_report.json
- Productization status: reports/productization_status_report.json
- Onboarding doctor: reports/onboarding_doctor_report.json
- Project dashboard: reports/project_dashboard.json
- Live harness report: harness/reports/latest-live-harness-report.json
- Operational validation evidence: validation/evidence/EVID-dungeon-recovery-procedural-space-quality-latest-passed.json

## Operational Scenarios

- ainvil_bridge_smoke_operational: harness/scenarios/ainvil_bridge_smoke_operational.json
- ainvil_compile_gate_blocks_playmode_on_compile_error: harness/scenarios/ainvil_compile_gate_blocks_playmode_on_compile_error.json
- dungeon_recovery_first_playable_e2e: harness/scenarios/dungeon_recovery_first_playable_e2e.json
- dungeon_recovery_procedural_recovery_job_e2e: harness/scenarios/dungeon_recovery_procedural_recovery_job_e2e.json
- dungeon_recovery_procedural_space_quality_validation: harness/scenarios/dungeon_recovery_procedural_space_quality_validation.json
- dungeon_recovery_procedural_visual_validation: harness/scenarios/dungeon_recovery_procedural_visual_validation.json

## Known Limitations

- This baseline proves one generated DungeonRecoveryCompany Product MVP vertical slice through deterministic Play Mode hooks; it does not prove broad game production coverage.
- Fresh workspace smoke reproducibility has passed for the recorded Unity project, but this still does not prove full public installation support across arbitrary machines.
- Unity Bridge server listens on the package default local port 17777; clients can override UNITY_BRIDGE_URL when needed.
- Workspace manifest and generated reports contain machine-local paths and must be regenerated per workspace.
- The Product MVP E2E used deterministic validation hooks; manual player-input feel, balance, UX, save/load, build, and public install validation remain open.

## Recommended Verification

```powershell
node plugins/ainvil/cli/ainvil-cli.mjs doctor
node plugins/ainvil/scripts/run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins/ainvil/cli/ainvil-cli.mjs review
node plugins/ainvil/cli/ainvil-cli.mjs productization
node plugins/ainvil/cli/ainvil-cli.mjs release
node plugins/ainvil/scripts/run-ainvil-regression-suite.mjs
node plugins/ainvil/scripts/run-ainvil-regression-suite.mjs --live-smoke
```
