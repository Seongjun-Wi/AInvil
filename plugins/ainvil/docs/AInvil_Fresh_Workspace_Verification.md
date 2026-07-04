# Fresh Workspace Verification Plan

This plan checks whether the AInvil Core RC can be reproduced outside the current development workspace.

## Scope

The fresh workspace check is read-only from AInvil's perspective. It must not modify game scenes, prefabs, or game scripts. The operational smoke scenario only inspects Unity Bridge state, compile status, console errors, hierarchy, and validation probes.

## Safe Scratch Setup

Use one of these targets:

- A newly created Unity project in a scratch directory.
- A cloned workspace with a separate Unity project.
- An existing Unity project opened read-only for smoke validation.

Do not use a production game project for destructive testing.

## Procedure

1. Install or copy the AInvil plugin workspace.
2. Install the canonical Unity Bridge package into the Unity project:
   `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json`
   The recommended Unity `Packages/manifest.json` dependency is:

```json
"com.codex.unity-bridge": "file:E:/wiseongjun/ProgrammingNAssignment/GameDesigner/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge"
```

   The repository root `UnityPackage/` folder is a deprecated mirror/install artifact. If a project still points to that mirror, fresh smoke verification may pass, but packaging should report a warning until the dependency is moved to the canonical path.
3. Open the Unity project.
4. Start `Tools > Codex Unity Bridge > Start Server`.
5. From the repository root, configure or detect the Unity project:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project <UnityProjectPath>
```

6. Run the fresh workspace verifier. This writes separate fresh evidence and does not reuse the existing workspace evidence:

```powershell
node plugins\ainvil\scripts\verify-fresh-workspace.mjs --unity-project <UnityProjectPath>
```

7. Optionally run the raw operational smoke scenario:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
```

8. Confirm evidence exists:

```powershell
node plugins\ainvil\scripts\validate-validation-evidence.mjs
```

9. Reevaluate the review and release gates:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs review
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

10. Run regression. Pass `--unity-project` to make the live smoke target explicit:

```powershell
node plugins\ainvil\scripts\run-ainvil-regression-suite.mjs
node plugins\ainvil\scripts\run-ainvil-regression-suite.mjs --live-smoke --unity-project <UnityProjectPath>
```

## Pass Criteria

- Workspace manifest is generated for the fresh workspace.
- Unity Bridge package canonical path is available.
- Unity Bridge health is Passed.
- Compile status is Passed.
- Console error count is 0.
- `ainvil_bridge_smoke_operational` is Passed.
- Evidence classification is `Operational`.
- Evidence workspace classification is `FreshWorkspace`.
- Evidence status is `Passed`.
- Stale evidence reused is `false`.
- Package dependency classification is `Canonical`.
- Canonical package verified is `true`.
- Production Core review is `Approved`.
- Release readiness is `Release Ready`.
- Productization has no release blockers.

## Expected Fresh Workspace Differences

Generated files may contain different local paths:

- `state/workspace_manifest.json`
- `reports/onboarding_doctor_report.json`
- `harness/reports/latest-live-harness-report.json`
- `validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json`
- `validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json`
- `reports/fresh_workspace_verification_report.json`

These files should be regenerated in each workspace. They are not portable installation inputs.

## Failure Reporting

If fresh workspace verification fails, keep the failed evidence and reports. Do not edit the result to pass. Classify the failure as one of:

- Unity Editor not running.
- Unity Bridge package not installed.
- Unity Bridge server not started.
- Port mismatch.
- Unity project path missing or wrong.
- Compile errors.
- Console errors.
- Operational scenario failed.
- Evidence was sample or missing.

## Latest Verification Result

The latest recorded fresh workspace verification used the user-designated Unity Bridge target:

- Unity project: `E:\wiseongjun\Unity\DungeonRecoveryCompany`
- Workspace classification: `FreshWorkspace`
- Result: `Passed`
- Evidence: `validation/evidence/EVID-ainvil-bridge-smoke-operational-fresh-workspace-latest.json`
- Report: `reports/fresh_workspace_verification_report.json`
- Stale evidence reused: `false`

Known limitation from the latest run:

- The Unity project must use the canonical `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge` source before claiming `Canonical Unity Bridge Package Verified`.

## Failure Message Interpretation

- Unity closed: Bridge health is `Blocked`; open Unity and start the Bridge server.
- Bridge server off: health URL is unreachable; run `Tools > Codex Unity Bridge > Start Server`.
- Wrong project open: project match check is `Blocked`; open the requested Unity project and restart the Bridge server there.
- Package missing: package install check is `Blocked`; install the canonical Unity Bridge package.
- Package path mismatch: package install check is `Warning`; smoke can pass, but `Canonical Unity Bridge Package Verified` remains `No` until the dependency points to the canonical package path.
- Compile errors: compile check is `Failed` or not available; fix Unity Console compile errors and rerun verification.
