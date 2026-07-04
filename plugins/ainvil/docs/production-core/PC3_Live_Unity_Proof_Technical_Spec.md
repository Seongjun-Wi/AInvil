# PC-3 Live Unity Proof Technical Spec

## 1. Purpose

PC-3 proves that AInvil can validate at least one real Unity workflow through the Unity Bridge and produce reusable validation evidence.

The target is one passing or actionably classified live harness scenario. A blocked or failed run is acceptable only when the failure is classified and evidence is exported.

Detailed playability validation architecture is defined in `../AInvil_Playability_Validation_Technical_Plan.md`.

## 2. Scope

In scope:

- Run one selected live harness scenario.
- Add scenario filtering.
- Add validation evidence export.
- Preserve unavailable bridge as blocked evidence.
- Capture compile, console, hierarchy, Play Mode, input, and artifact checks.
- Link harness evidence to requirements and acceptance criteria.

Out of scope:

- Full game generation.
- Multiple engine support.
- Complex animation retargeting.
- CI runner setup.
- Automatic graph mutation from evidence.

## 3. Target Scenario

Scenario:

```text
harness/scenarios/top_down_collectible.json
```

Reason:

- It exercises movement/input.
- It exercises collectible feedback.
- It exercises score state.
- It is small enough for first vertical slice validation.
- It is easier to inspect than UI-only or animation-only scenarios.

## 4. New Or Extended Files

| file | purpose |
| --- | --- |
| `scripts/run-ainvil-live-harness.mjs` | Add `--scenario`, `--prepare-sample`, `--rpc-timeout-ms`, and `--evidence-out` options. |
| `schemas/validation_evidence.schema.json` | Schema for exported validation evidence. |
| `scripts/validate-validation-evidence.mjs` | Validate evidence files. |
| `validation/evidence/*.json` | Exported validation evidence. |
| `docs/validation/Unity_Bridge_Play_Mode_Smoke_Test.md` | Update setup and run instructions if needed. |

## 5. Validation Evidence Contract

Path pattern:

```text
validation/evidence/EVID-*.json
```

Required fields:

| field | type | notes |
| --- | --- | --- |
| `schemaVersion` | string | `1.0.0`. |
| `evidenceId` | string | Stable evidence ID. |
| `source` | string | `LiveHarness`. |
| `scenarioId` | string | Harness scenario ID. |
| `validationLevel` | string | `Not Checked`, `Unity Inspection`, `Compile Verified`, `Play Mode Verified`, or `Runtime Tested`. |
| `status` | string | `Passed`, `Failed`, `Blocked`, `Warning`, or `NotRun`. |
| `failureClass` | string | Required for failed or blocked checks. |
| `acceptanceIds` | array | Acceptance criteria linked to the scenario. |
| `requirementIds` | array | Related requirements. |
| `unityTargets` | array | Scenes, objects, prefabs, scripts, or components. |
| `checks` | array | Structured check results. |
| `startedAt` | string | ISO timestamp. |
| `finishedAt` | string | ISO timestamp. |
| `remainingGaps` | array | Known unverified items. |

Allowed `failureClass` values:

```text
BridgeDisconnected
PreconditionFailed
CompileError
ConsoleError
InputNotReceived
GameLogicFailed
ArtifactMissing
Timeout
Unknown
None
```

## 6. Harness CLI Options

Add:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario scenario.top_down_collectible --prepare-sample --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode apply --scenario scenario.top_down_collectible --prepare-sample --rpc-timeout-ms 8000 --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
```

Rules:

- `--scenario` accepts one scenario ID.
- Without `--scenario`, existing all-scenario behavior remains.
- `--evidence-out` writes a single evidence file for the selected run.
- For all-scenario runs, evidence export should either be disabled or write one file per scenario with deterministic names.

## 7. Harness Check Pipeline

Probe mode:

1. Check Unity Bridge health.
2. Check Unity status.
3. Check compile status.
4. Check console errors.
5. Check hierarchy/artifact probes.
6. Export evidence.

Apply mode:

1. Run probe prechecks.
2. Create or select `/Debug/AInvilInputTestBridge` with the runtime-safe `Codex.UnityBridge.AInvilRuntimeInputTestBridge` component.
3. Enter Play Mode.
4. Invoke setup hook if scenario defines one.
5. Send input or bridge events.
6. Check resulting state.
7. Exit Play Mode.
8. Export evidence.

## 8. Evidence Mapping

The scenario fixture should include or derive:

| scenario field | evidence field |
| --- | --- |
| `id` | `scenarioId` |
| `validationChecks[].id` | `checks[].checkId` |
| `expectedUnityArtifacts` | `unityTargets` |
| `passCriteria` | `checks[].expected` |
| linked acceptance IDs if present | `acceptanceIds` |
| linked requirement IDs if present | `requirementIds` |

If scenario fixtures do not yet contain requirement or acceptance IDs, evidence should use:

```text
acceptanceIds: []
requirementIds: []
remainingGaps: ["Scenario is not linked to acceptance criteria yet."]
```

## 9. Validator Rules

Script:

```text
scripts/validate-validation-evidence.mjs
```

Rules:

- Evidence JSON parses.
- `schemaVersion` is `1.0.0`.
- `status` is allowed.
- `validationLevel` is allowed.
- `checks` is non-empty.
- `Passed` evidence must not contain failed checks.
- `Blocked` evidence must include a failure class and next action.
- `Runtime Tested` requires Play Mode and input/gameplay checks.

## 10. Unity Preconditions

Manual setup before first live proof:

1. Open Unity project.
2. Import `unity-package/Packages/com.codex.unity-bridge`.
3. Start Unity Bridge from Unity menu.
4. Confirm `http://127.0.0.1:17777/health` returns OK.
5. Run probe harness.
6. Run apply harness only after probe is clean or blocked reason is understood.

## 11. Validation Commands

Bridge unavailable baseline:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario scenario.top_down_collectible --prepare-sample --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
node plugins\ainvil\scripts\validate-validation-evidence.mjs
```

Bridge available proof:

```powershell
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode apply --scenario scenario.top_down_collectible --prepare-sample --rpc-timeout-ms 8000 --evidence-out validation\evidence\EVID-top-down-collectible-latest.json
node plugins\ainvil\scripts\validate-validation-evidence.mjs
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
```

## 12. Acceptance Criteria

| acceptance id | given | when | then |
| --- | --- | --- | --- |
| AC-PC3-001 | Unity Bridge is unavailable. | Probe runs with evidence export. | Evidence status is `Blocked`, failure class is `BridgeDisconnected`, and next action is present. |
| AC-PC3-002 | Unity Bridge is reachable. | Probe runs. | Health, compile, console, hierarchy, and artifact checks are recorded. |
| AC-PC3-003 | Scene and input bridge are available. | Apply runs. | Play Mode and input checks are recorded. |
| AC-PC3-004 | Scenario passes. | Evidence exports. | Evidence status is `Passed` with sufficient validation level. |
| AC-PC3-005 | Scenario fails. | Evidence exports. | Failure is classified and actionable. |
| AC-PC3-006 | A scene has unsaved changes. | The harness opens or prepares a scene. | The bridge uses an explicit `dirtyScenePolicy` and does not show a Unity Editor modal dialog. |

## 13. Definition Of Done

PC-3 is done when:

- One selected scenario exports validation evidence.
- Unavailable bridge produces valid blocked evidence.
- Reachable bridge produces passed or classified failure evidence.
- Evidence validator is included in plugin validation after deterministic evidence exists.
- At least one evidence file can be linked to graph acceptance criteria in PC-4.
- Scene automation never depends on a human dismissing a Unity Editor save/discard popup.
