# AInvil Validation Summary

[Back to README](../../README.md)

## Current Status

| Validation Area | Status | Evidence / Report |
| --- | --- | --- |
| Unity Bridge Stability | Passed | `EVID-ainvil-bridge-smoke-operational-latest.json` |
| Compile Check | Passed | `reports/unity_compile_gate_report.json` |
| Compile Gate Safety | Passed | `EVID-ainvil-compile-gate-blocks-playmode-latest.json` |
| First Playable E2E | Passed | `EVID-dungeon-recovery-first-playable-e2e-latest.json` |
| Human Playability Review | Passed | `EVID-dungeon-recovery-first-playable-human-playability-latest.json` |
| Procedural Recovery Job | Passed | `EVID-dungeon-recovery-procedural-recovery-job-e2e-latest.json` |
| Procedural Space Quality | Passed | `EVID-dungeon-recovery-procedural-space-quality-latest.json` |
| Visual Validation | Passed | `EVID-dungeon-recovery-procedural-visual-validation-latest.json` |
| Build Verification | Passed | `reports/dungeon_recovery_procedural_recovery_job_build_verification.json` |
| Full Regression | Passed | `reports/regression_suite_latest.json` |
| Production Core Review | Approved | `reports/production_core_review_evaluation.json` |
| Productization | Release Candidate | `reports/productization_status_report.json` |
| Release Readiness | Release Ready | `reports/release_readiness_report.json` |
| Public Release Ready | No | `reports/release_readiness_report.json` |

## Latest Full Regression

```text
21 passed, 0 failed, 0 blocked
```

## Validation Gates

### Compile Gate

Compile Gate runs before Play Mode. If compile errors exist, AInvil does not enter Play Mode and records compile-blocked evidence.

It checks:

- Unity compile status
- Unity console errors
- local C# build status
- Play Mode eligibility

### Visual Validation Gate

Visual Validation catches issues that logic-only validation can miss.

It checks:

- screenshot capture
- camera framing
- first-person camera mode
- mouse look
- player movement
- UI visibility
- missing shader / magenta rendering
- console error count

### EnvironmentBlocked

Unity Bridge or Editor failures are classified separately from product failures.

Examples:

- Unity Editor not running
- Bridge server not running
- port mismatch
- package not installed
- workspace manifest mismatch

## Release Interpretation

Current claim:

```text
Core Release Ready / Release Candidate
Product MVP Ready Candidate
```

Not claimed:

```text
Public Release Ready
Commercial production game
Universal Unity-project support
Fully automatic game production
```
