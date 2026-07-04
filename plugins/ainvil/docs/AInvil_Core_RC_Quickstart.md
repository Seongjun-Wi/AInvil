# AInvil Core RC Quickstart

This quickstart verifies the AInvil Core Release Candidate smoke path. It proves the core Unity Bridge and evidence pipeline, not a full game-feature MVP.

## Prerequisites

- Node.js is available as `node`.
- Unity Editor is installed.
- The Unity project has the canonical package installed from:
  `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json`
- The recommended Unity `Packages/manifest.json` dependency is:
  `file:E:/wiseongjun/ProgrammingNAssignment/GameDesigner/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge`
- The root `UnityPackage/` folder is a deprecated mirror/install artifact. A project pointing there may pass smoke validation, but canonical package verification should remain false until the dependency is changed.
- The Unity Bridge server is started from Unity:
  `Tools > Codex Unity Bridge > Start Server`
- The default bridge endpoint is `http://127.0.0.1:17777/rpc`.
  Use `UNITY_BRIDGE_URL` and `UNITY_HEALTH_URL` when a non-default client URL is required.

## Minimum Verification Flow

Run from the repository root:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins\ainvil\cli\ainvil-cli.mjs review
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

Expected core RC result:

- `doctor`: Unity Bridge health and compile checks pass.
- `run-ainvil-live-harness`: `ainvil_bridge_smoke_operational` passes.
- `review`: Production Core review has no remaining changes.
- `productization`: no release blockers; current productization level is Release Candidate.
- `release`: Release Ready for AInvil Core.

## Common Failure Interpretation

### Unity Editor is closed

`doctor` or the live harness will report Unity Bridge health as blocked or unreachable.

Next action:

1. Open the target Unity project.
2. Confirm the canonical package is installed.
3. Start `Tools > Codex Unity Bridge > Start Server`.
4. Rerun `doctor`.

### Bridge server is not started

The health URL usually fails while the Unity project path may still be configured in the workspace manifest.

Next action:

1. In Unity, start `Tools > Codex Unity Bridge > Start Server`.
2. If using a non-default port, set `UNITY_BRIDGE_URL`.
3. Rerun the live harness.

### Compile errors exist

`doctor` or operational evidence will not pass the compile criterion.

Next action:

1. Open the Unity Console.
2. Resolve compile errors.
3. Wait until Unity is not compiling.
4. Rerun `doctor` and the operational smoke harness.

## Offline Regression

Offline regression does not require Unity to be open:

```powershell
node plugins\ainvil\scripts\run-ainvil-regression-suite.mjs
```

Live smoke regression requires Unity Bridge:

```powershell
node plugins\ainvil\scripts\run-ainvil-regression-suite.mjs --live-smoke
```

Fresh workspace live smoke should include the target Unity project explicitly:

```powershell
node plugins\ainvil\scripts\verify-fresh-workspace.mjs --unity-project <UnityProjectPath>
node plugins\ainvil\scripts\run-ainvil-regression-suite.mjs --live-smoke --unity-project <UnityProjectPath>
```

Use `--require-live-smoke` when live smoke failure should fail the whole regression suite.
