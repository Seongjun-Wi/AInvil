# AInvil Quickstart

[Back to README](../../README.md)

## Requirements

- Node.js available as `node`
- Unity 2021.3 or newer
- Unity Bridge package installed from:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
```

Unity Bridge endpoint:

```text
http://127.0.0.1:17777/rpc
```

## Core RC Check

Run from repository root:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project <UnityProjectPath>
node plugins\ainvil\cli\ainvil-cli.mjs compile-check --unity-project <UnityProjectPath>
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins\ainvil\cli\ainvil-cli.mjs review
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

## DungeonRecoveryCompany Revalidation

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project E:\wiseongjun\Unity\DungeonRecoveryCompany
node plugins\ainvil\cli\ainvil-cli.mjs compile-check --unity-project E:\wiseongjun\Unity\DungeonRecoveryCompany
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario dungeon_recovery_procedural_space_quality_validation
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario dungeon_recovery_procedural_visual_validation
node plugins\ainvil\cli\ainvil-cli.mjs regression --procedural --visual --space-quality --build --unity-project E:\wiseongjun\Unity\DungeonRecoveryCompany
```

Expected result:

```text
Compile Check: Passed
Procedural Space Quality: Passed
Visual Validation: Passed
Regression: Passed
```

## Offline Validators

These do not require Unity Play Mode:

```powershell
node plugins\ainvil\scripts\validate-project-dashboard.mjs
node plugins\ainvil\scripts\validate-release-readiness-report.mjs
node plugins\ainvil\scripts\validate-validation-evidence.mjs
node plugins\ainvil\scripts\validate-production-state-graph.mjs
```

## Common Outcomes

| Outcome | Meaning |
| --- | --- |
| `Passed` | The check ran and met its acceptance criteria. |
| `CompileBlocked` | C# compile errors block Play Mode. Fix compile first. |
| `EnvironmentBlocked` | Unity Editor, Bridge, path, port, or package setup blocks validation. |
| `Failed` | The check ran and product acceptance failed. |
