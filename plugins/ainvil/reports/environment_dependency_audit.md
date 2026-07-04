# AInvil Environment Dependency Audit

- Generated at: 2026-07-04T14:50:51.891Z

## Configuration Surface

- unityBridgeUrl: UNITY_BRIDGE_URL, default http://127.0.0.1:17777/rpc
- unityHealthUrl: UNITY_HEALTH_URL or derived from UNITY_BRIDGE_URL
- unityProjectPath: ainvil doctor --unity-project <path>, AINVIL_UNITY_PROJECT, UNITY_PROJECT_PATH, or Bridge status detection
- workspaceManifest: plugins/ainvil/state/workspace_manifest.json is generated per workspace
- canonicalPackage: plugins/ainvil/unity-package/Packages/com.codex.unity-bridge

## Finding Counts

- BridgePort: 33
- SourceHardcoding: 3
- GeneratedLocalState: 25

## Findings

| Category | Severity | Path | Summary | Next action |
| --- | --- | --- | --- | --- |
| BridgePort | KnownLimitation | .mcp.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| BridgePort | Info | core/rc-baseline.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | core/workspace-manager.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| SourceHardcoding | Needs Review | docs/AInvil_Core_RC_Quickstart.md | 1 local path marker(s) detected. | Replace hardcoded local path with a manifest/env/config value. |
| BridgePort | Info | docs/AInvil_Core_RC_Quickstart.md | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| SourceHardcoding | Needs Review | docs/AInvil_Fresh_Workspace_Verification.md | 3 local path marker(s) detected. | Replace hardcoded local path with a manifest/env/config value. |
| BridgePort | Info | docs/AInvil_Production_Core_Technical_Spec.md | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | docs/AInvil_Technical_Design.md | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | docs/Plugin_Integration_Guide.md | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | docs/production-core/PC3_Live_Unity_Proof_Technical_Spec.md | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| GeneratedLocalState | Info | harness/reports/fresh-workspace-live-harness-report.json | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | Info | harness/reports/fresh-workspace-live-harness-report.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| GeneratedLocalState | Info | harness/reports/latest-live-harness-report.json | 8 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | Info | harness/reports/latest-live-harness-report.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | harness/scenarios/ainvil_bridge_smoke_operational.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | harness/scenarios/dungeon_recovery_first_playable_e2e.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | mcp-server/server.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| SourceHardcoding | Needs Review | README.md | 1 local path marker(s) detected. | Replace hardcoded local path with a manifest/env/config value. |
| BridgePort | KnownLimitation | README.md | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/builds/dungeon_recovery_first_playable/DungeonRecoveryCompany_BurstDebugInformation_DoNotShip/Data/Plugins/x86_64/lib_burst_generated.txt | 20 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/builds/dungeon_recovery_first_playable/DungeonRecoveryFirstPlayable_Data/Managed/Assembly-CSharp.pdb | 1 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/builds/dungeon_recovery_first_playable/DungeonRecoveryFirstPlayable_Data/Managed/Newtonsoft.Json.pdb | 1 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/builds/dungeon_recovery_first_playable/DungeonRecoveryFirstPlayable_Data/Plugins/x86_64/lib_burst_generated.pdb | 601 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_build_verification.json | 6 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/dungeon_recovery_first_playable_build_verification.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_build_verification.md | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_dry_run.json | 4 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_dry_run.md | 4 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_validation_report.json | 4 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/dungeon_recovery_first_playable_validation_report.md | 4 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/environment_dependency_audit.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| BridgePort | KnownLimitation | reports/environment_dependency_audit.md | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/fresh_workspace_verification_report.json | 25 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/fresh_workspace_verification_report.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/fresh_workspace_verification_report.md | 7 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/fresh_workspace_verification_report.md | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/onboarding_doctor_report.json | 25 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/onboarding_doctor_report.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/productization_status_report.json | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/project_dashboard.json | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/rc_baseline_manifest.json | 5 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/rc_baseline_manifest.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| BridgePort | KnownLimitation | reports/rc_baseline_manifest.md | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/regression_suite_latest.json | 6 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | reports/regression_suite_latest.json | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | reports/regression_suite_latest.md | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | reports/release_readiness_report.json | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | Info | scripts/run-ainvil-live-harness.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | scripts/validate-mcp-server.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | scripts/verify-dungeon-recovery-first-playable-build.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | scripts/verify-fresh-workspace.mjs | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| GeneratedLocalState | Info | state/workspace_manifest.json | 16 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | KnownLimitation | unity-package/Packages/com.codex.unity-bridge/Editor/CodexUnityBridgeServer.cs | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| BridgePort | KnownLimitation | unity-package/Packages/com.codex.unity-bridge/README.md | Unity Bridge default localhost port 17777 is referenced. | For Unity-side server port changes, update the Unity Bridge package or document the fixed package default. |
| GeneratedLocalState | Info | validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json | 13 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | Info | validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| GeneratedLocalState | Info | validation/evidence/EVID-dungeon-recovery-first-playable-build-latest.json | 4 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| GeneratedLocalState | Info | validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json | 2 local path marker(s) detected. | Regenerate this artifact in the target workspace. |
| BridgePort | Info | validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
| BridgePort | Info | validation/evidence/EVID-top-down-collectible-latest.json | Unity Bridge default localhost port 17777 is referenced. | Use UNITY_BRIDGE_URL/UNITY_HEALTH_URL when a non-default client URL is required. |
