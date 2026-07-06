# AInvil Codex Plugin

AInvil is the plugin implementation for the evidence-grounded Unity game production workflow.

Main project README: [../../README.md](../../README.md)  
Korean README: [../../README.ko.md](../../README.ko.md)  
Architecture: [../../docs/ainvil/ARCHITECTURE.md](../../docs/ainvil/ARCHITECTURE.md)

## What Lives Here

| Path | Purpose |
| --- | --- |
| `.codex-plugin/plugin.json` | Codex plugin metadata and skill registration. |
| `skills/` | Orchestrator, GDD Agent, Unity Agent, and Input Agent instructions. |
| `core/` | Productization, review, release readiness, regression, and workspace logic. |
| `cli/ainvil-cli.mjs` | CLI entry point for checks and reports. |
| `mcp-server/` | Unity Bridge MCP proxy. |
| `unity-package/Packages/com.codex.unity-bridge` | Canonical Unity Bridge package. |
| `harness/` | Operational and sample validation scenarios. |
| `validation/evidence/` | Runtime, visual, build, and safety evidence. |
| `reports/` | Dashboard, productization, RC, release, and regression reports. |

## Current Verified Level

```text
Core Release Ready / Release Candidate
Product MVP Ready Candidate
Public Release Ready: No
```

Current full regression:

```text
21 passed, 0 failed, 0 blocked
```

## Quick Checks

Run from the repository root:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project <UnityProjectPath>
node plugins\ainvil\cli\ainvil-cli.mjs compile-check --unity-project <UnityProjectPath>
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

Offline validators:

```powershell
node plugins\ainvil\scripts\validate-project-dashboard.mjs
node plugins\ainvil\scripts\validate-release-readiness-report.mjs
node plugins\ainvil\scripts\validate-validation-evidence.mjs
node plugins\ainvil\scripts\validate-production-state-graph.mjs
```

## Unity Bridge

Canonical package:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
```

The root-level `UnityPackage/` directory is a deprecated mirror/install artifact.

## More Documentation

- [Architecture](../../docs/ainvil/ARCHITECTURE.md)
- [DungeonRecoveryCompany Case Study](../../docs/ainvil/CASE_STUDY_DUNGEON_RECOVERY.md)
- [Validation Summary](../../docs/ainvil/VALIDATION.md)
- [Quickstart](../../docs/ainvil/QUICKSTART.md)
- [Release Levels](../../docs/ainvil/RELEASE_LEVELS.md)
- [Roadmap](../../docs/ainvil/ROADMAP.md)
