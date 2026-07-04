# Fresh Workspace Verification Report

- Generated at: 2026-07-04T13:36:19.373Z
- Workspace classification: FreshWorkspace
- Requested Unity project: E:\wiseongjun\Unity\DungeonRecoveryCompany
- Bridge Unity project: E:\wiseongjun\Unity\DungeonRecoveryCompany
- Scenario: ainvil_bridge_smoke_operational
- Status: Passed
- Evidence: validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json
- Live harness report: harness/reports/fresh-workspace-live-harness-report.json
- Stale evidence reused: false
- Package dependency: file:E:/wiseongjun/ProgrammingNAssignment/GameDesigner/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
- Package dependency classification: Canonical
- Canonical package verified: true

## Evidence Summary

- Classification: Operational
- Workspace classification: FreshWorkspace
- Validation level: Compile Verified
- Bridge health: Passed
- Compile status: Passed
- Console error count: 0
- Hierarchy status: Passed
- Probe status: Passed

## Checks

| Check | Status | Message | Next action |
| --- | --- | --- | --- |
| fresh.workspace.bridge_health | Passed | Unity Bridge health endpoint is reachable. | None |
| fresh.workspace.unity_status | Passed | Unity status is readable. | None |
| fresh.workspace.project_match | Passed | Unity Bridge target matches requested fresh workspace: E:\wiseongjun\Unity\DungeonRecoveryCompany | None |
| fresh.workspace.package_install | Passed | Unity Bridge package dependency points to the canonical package. | None |
| fresh.workspace.doctor | Passed | ototype.md<br>OK Production State Graph<br>  Production state graph validation passed: state\production_state_graph.json (32 nodes, 33 edges).<br>OK Production Intelligence Report<br>  Production intelligence report validation passed: reports\production_intelligence_report.json.<br>OK Review Records<br>  Review record validation passed (2 file(s)).<br>OK Benchmark Datasets<br>  Benchmark dataset validation passed (5 file(s)).<br>OK Onboarding Doctor<br>  Onboarding doctor validation passed: reports/onboarding_doctor_report.json.<br>SKIP Full plugin validation: read-only CLI does not run validators that may regenerate reports. | None |
| fresh.workspace.live_harness | Passed | AInvil live harness (probe)<br>Unity: http://127.0.0.1:17777/rpc<br>Scenarios: 1, passed: 1, warning: 0, failed: 0, blocked: 0<br>Report: harness/reports/fresh-workspace-live-harness-report.json<br>- Passed: ainvil_bridge_smoke_operational - AInvil Unity Bridge operational smoke validation<br>  next: Record the live harness result in the playtest report and continue the next milestone. | None |

## Known Limitations

- This fresh verification uses the user-designated DungeonRecoveryCompany Unity Bridge target and does not modify game scenes, prefabs, or scripts.
- The smoke scenario is Compile Verified and read-only; it is not a full Product MVP gameplay workflow validation.
