# AInvil Codex Plugin

AInvil is a Codex plugin bundle for a Unity-based AI game production agent.

It is not only a Unity MCP wrapper. The plugin combines game design collaboration, GDD completion, technical design, Unity implementation support, playability validation, project state synchronization, review governance, benchmarking, KPI tracking, and workflow reporting.

## Plugin Entry Points

| entry point | path | purpose |
| --- | --- | --- |
| manifest | `.codex-plugin/plugin.json` | Codex plugin metadata, skill registration, and MCP registration |
| skills | `skills/` | Orchestrator, GDD Agent, Unity Agent, and Input Agent instructions |
| MCP config | `.mcp.json` | Registers the Unity Bridge MCP server |
| MCP server | `mcp-server/server.mjs` | Proxies MCP calls to the local Unity Bridge HTTP endpoint |
| Unity package | `unity-package/Packages/com.codex.unity-bridge` | Canonical Unity-side bridge package |
| platform core | `core/` | Artifact loading, summaries, workflow reports, transition plans, approvals, and guarded runtime synchronization |
| CLI | `cli/ainvil-cli.mjs` | Non-Codex entrypoint for platform inspection and guarded workflow synchronization |

## Current Identity

AInvil acts as:

- AI game design partner
- technical design assistant
- Unity implementation agent
- playability validation agent
- long-term project memory and synchronization system

The user remains the creative owner. AInvil critiques, structures, implements, validates, and maintains the user's intended game; it must not silently replace the user's creative direction.

## Local Validation

Run these commands from the repository root:

```powershell
node plugins\ainvil\scripts\generate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-benchmark-report.mjs
node plugins\ainvil\scripts\validate-ainvil-plugin.mjs
node plugins\ainvil\scripts\validate-ainvil-cli.mjs
node plugins\ainvil\scripts\validate-ainvil-harness.mjs
```

Useful read-only CLI checks:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs status
node plugins\ainvil\cli\ainvil-cli.mjs workflow
node plugins\ainvil\cli\ainvil-cli.mjs transitions
node plugins\ainvil\cli\ainvil-cli.mjs approvals
node plugins\ainvil\cli\ainvil-cli.mjs executions
node plugins\ainvil\cli\ainvil-cli.mjs execute-transition --transition TRANS-RunBenchmark-Refresh --dry-run
node plugins\ainvil\cli\ainvil-cli.mjs execute
node plugins\ainvil\cli\ainvil-cli.mjs doctor
```

## Unity Requirements

Unity integration requires:

- Node.js available as `node`
- Unity 2021.3 or newer
- the canonical Unity package from `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge`
- Unity project dependency pointing to the canonical package path, for example `file:E:/wiseongjun/ProgrammingNAssignment/GameDesigner/plugins/ainvil/unity-package/Packages/com.codex.unity-bridge`
- Unity Bridge running at `http://127.0.0.1:17777/rpc`

Platform and CLI inspection features do not require Unity, Codex, or a database. The guarded runtime command writes workflow reports, a run record, generated dashboard/traceability views, and a graph next-action sync; it does not modify Unity or promote validation without actual evidence.

## Productization Status

Use the productization report to separate design-time capability from verified runtime behavior:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs init-production-graph
node plugins\ainvil\cli\ainvil-cli.mjs productization
```

The report classifies each AInvil capability as `Verified`, `Partial`, `Blocked`, `Spec-only`, or `Deprecated/Sample`, and writes:

- `reports/productization_status_report.json`
- `reports/productization_status_report.md`

Example harness fixtures such as `top_down_collectible` are retained for benchmark/sample use, but they must not satisfy operational release gates for a real project.

## Core RC Quickstart

The current release level is `Core Release Ready / Release Candidate`. This means the AInvil Core Unity Bridge smoke and evidence pipeline is verified. It does not yet claim `Product MVP Ready` or `Public Release Ready`.

Run the minimum Core RC verification flow from the repository root:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins\ainvil\cli\ainvil-cli.mjs review
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```

Generate the RC baseline and environment audit:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs rc
```

Run offline regression without requiring Unity to be open:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs regression
```

Run optional live smoke regression when Unity Bridge is running:

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs regression --live-smoke
```

Run fresh workspace verification against an explicit Unity project:

```powershell
node plugins\ainvil\scripts\verify-fresh-workspace.mjs --unity-project <UnityProjectPath>
node plugins\ainvil\cli\ainvil-cli.mjs regression --live-smoke --unity-project <UnityProjectPath>
```

See:

- `docs/AInvil_Core_RC_Quickstart.md`
- `docs/AInvil_Fresh_Workspace_Verification.md`
- `docs/AInvil_Release_Level_Definitions.md`

## Platform Boundary

The current plugin intentionally keeps the platform core inside the plugin directory. This proves AInvil can run as a Codex plugin while also exposing reusable read-only platform logic for future CLI, desktop, web, or service clients.

Future extraction should preserve this boundary:

- `core/` remains client-neutral. Its guarded runtime may write AInvil operational artifacts, but it must not depend on Codex skills or Unity Bridge.
- `cli/` remains a thin client over `core/`.
- `skills/` remain Codex-facing agent instructions.
- `mcp-server/` and `unity-package/` remain Unity integration surfaces.

`UnityPackage/` at the repository root is a deprecated mirror/install artifact. Keep `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge` as the source of truth. Fresh workspace smoke can pass against the deprecated mirror, but public release packaging should use the canonical plugin-local package path.
