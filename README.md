# AInvil

AInvil is a Codex plugin and Unity bridge workspace for AI-assisted game production.
It combines game design documentation, technical planning, Unity implementation support,
playability validation, workflow reporting, and release-readiness checks.

This repository contains both the Codex-side plugin and the Unity-side bridge package.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `plugins/ainvil/` | Main AInvil Codex plugin bundle |
| `plugins/ainvil/skills/` | Codex skill instructions for orchestration, GDD, Unity work, and input validation |
| `plugins/ainvil/mcp-server/` | MCP server that talks to the local Unity Bridge endpoint |
| `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/` | Canonical Unity package |
| `plugins/ainvil/docs/` | Product, architecture, workflow, and validation documentation |
| `plugins/ainvil/scripts/` | Validation, reporting, benchmark, and workflow scripts |
| `plugins/ainvil/cli/ainvil-cli.mjs` | Command-line entry point for status and workflow checks |
| `UnityPackage/` | Deprecated mirror/install artifact for the Unity package |

## Requirements

- Node.js available as `node`
- Unity 2021.3 or newer for Unity Bridge workflows
- Codex desktop/app environment for plugin-driven agent workflows

Most CLI inspection and report-generation commands can run without Unity. Live validation
requires Unity to be open and the bridge server to be running.

## Unity Package

Use the canonical Unity package from:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
```

In Unity, install it with Package Manager:

1. Open `Window > Package Manager`.
2. Select `Add package from disk...`.
3. Choose:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json
```

Then start the bridge from Unity:

```text
Tools > Codex Unity Bridge > Start Server
```

The bridge listens on:

```text
http://127.0.0.1:17777/rpc
```

## Useful Commands

Run these from the repository root.

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs status
node plugins\ainvil\cli\ainvil-cli.mjs doctor
node plugins\ainvil\cli\ainvil-cli.mjs workflow
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

Validation and report commands:

```powershell
node plugins\ainvil\scripts\generate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
node plugins\ainvil\scripts\validate-ainvil-cli.mjs
node plugins\ainvil\scripts\validate-ainvil-harness.mjs
```

Offline regression:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs regression
```

Live smoke regression, when Unity Bridge is running:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs regression --live-smoke
```

## Git Notes

Generated Unity builds are intentionally ignored:

```text
plugins/ainvil/reports/builds/
```

Validation reports, design documents, schemas, skills, and Unity package source files are kept
in Git because they describe the production state of AInvil.

## Status

The current AInvil plugin is organized around Core Release Candidate workflows:

- game design and GDD support
- technical design and implementation planning
- Unity Bridge integration
- playability validation evidence
- benchmark and release-readiness reporting
- workflow state and synchronization artifacts

See `plugins/ainvil/README.md` for deeper plugin-specific documentation.
