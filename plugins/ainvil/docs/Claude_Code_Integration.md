# Claude Code Integration

AInvil can be used from both Codex and Claude Code by sharing the provider-neutral parts of the plugin and registering the Unity Bridge MCP server with Claude.

## What Is Shared

| Surface | Path | Used by |
| --- | --- | --- |
| Codex plugin manifest | `plugins/ainvil/.codex-plugin/plugin.json` | Codex |
| Codex skills | `plugins/ainvil/skills/` | Codex directly, Claude by reading `CLAUDE.md` |
| Unity MCP server | `plugins/ainvil/mcp-server/server.mjs` | Codex and Claude |
| Unity package | `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge` | Unity Editor |
| Shared schemas/templates/core | `plugins/ainvil/schemas`, `templates`, `core` | Codex, Claude, CLI |
| Claude project guide | `CLAUDE.md` | Claude |
| Claude project MCP config | `.mcp.json` | Claude Code |

## Claude Code Setup

From the repository root, Claude Code can read the project-scoped `.mcp.json`:

```powershell
cmd /c claude mcp list
cmd /c claude mcp get ainvil-unity-bridge
```

PowerShell may block `claude.ps1` on this machine. Use `cmd /c claude ...` if that happens.

The project `.mcp.json` sets `AINVIL_MCP_SCHEMA_MODE=claude`. This keeps the Unity tool calls unchanged, but flattens MCP input schemas for Claude Code compatibility.

If you prefer a user-scoped registration instead of the project `.mcp.json`, run:

```powershell
cmd /c claude mcp add --scope user ainvil-unity-bridge -- node E:\wiseongjun\ProgrammingNAssignment\GameDesigner\plugins\ainvil\mcp-server\server.mjs
```

Then add these environment variables to that user-scoped entry if needed:

```json
{
  "AINVIL_MCP_SCHEMA_MODE": "claude",
  "UNITY_BRIDGE_URL": "http://127.0.0.1:17777/rpc"
}
```

## Unity Requirements

1. Install the Unity package from `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge`.
2. Open Unity.
3. Start the bridge with `Tools > Codex Unity Bridge > Start Server`.
4. Confirm the bridge is listening at `http://127.0.0.1:17777/rpc`.

## Validation

Run these checks from the repository root:

```powershell
node plugins\ainvil\scripts\validate-mcp-server.mjs
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project <UnityProjectPath>
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
```

`validate-mcp-server.mjs` checks the MCP protocol handshake without requiring Unity. The doctor and live harness checks require Unity Bridge to be running.

## Behavior Notes For Claude

Claude does not automatically understand Codex plugin skill registration. `CLAUDE.md` maps the AInvil Codex skills into Claude-readable instructions. When a task mentions AInvil, Claude should read the relevant `SKILL.md` file before acting.
