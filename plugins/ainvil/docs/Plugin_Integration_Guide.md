# AInvil Plugin Integration Guide

`plugins/ainvil` is the active AInvil Codex plugin bundle. The root `README.md`
describes the plugin identity, entry points, platform boundary, and local
validation commands.

## Codex Plugin Components

| component | path | purpose |
| --- | --- | --- |
| plugin manifest | `.codex-plugin/plugin.json` | Plugin metadata and skill/MCP entry points |
| MCP config | `.mcp.json` | Registers `unity-bridge` MCP server |
| MCP server | `mcp-server/server.mjs` | Converts MCP tool calls into Unity Bridge HTTP RPC |
| skills | `skills/` | AInvil, GDD Agent, Unity Agent, Input Agent instructions |
| Unity package | `unity-package/Packages/com.codex.unity-bridge` | Unity Editor/Runtime bridge package |
| templates | `templates/` | Document templates used by agents |
| schemas | `schemas/` | Shared structured data contracts |

## MCP Registration

`plugin.json` points to `.mcp.json`:

```json
{
  "mcpServers": "./.mcp.json"
}
```

`.mcp.json` registers the local stdio MCP server:

```json
{
  "mcpServers": {
    "unity-bridge": {
      "command": "node",
      "args": ["./mcp-server/server.mjs"],
      "cwd": ".",
      "startup_timeout_sec": 10,
      "tool_timeout_sec": 60,
      "default_tools_approval_mode": "prompt",
      "env": {
        "UNITY_BRIDGE_URL": "http://127.0.0.1:17777/rpc"
      }
    }
  }
}
```

## Expected Install Flow

1. Install or refresh the AInvil plugin.
2. Open a Unity project.
3. Add the Unity package from `unity-package/Packages/com.codex.unity-bridge`.
4. In Unity, run `Tools > Codex Unity Bridge > Start Server`.
5. In Codex, use AInvil/Unity Agent and call `unity_get_status`.

## Requirements

- Node.js available as `node` for the MCP server.
- Unity 2021.3 or newer.
- Unity package dependency `com.unity.nuget.newtonsoft-json`.
- Local bridge URL `http://127.0.0.1:17777/rpc`.

## Validation Checklist

| check | expected |
| --- | --- |
| `plugin.json` parses | valid JSON |
| `.mcp.json` parses | valid JSON |
| `node --check mcp-server/server.mjs` | no syntax errors |
| `node scripts/validate-mcp-server.mjs` | initialize and tools/list succeed |
| `unity_get_status` | returns bridge status |
| Play Mode reconnect | status works after entering Play Mode |
| Input bridge | `unity_input_test_bridge action=getState` works when component exists |
| Asset-first object | `unity_create_asset_based_object` creates prefab or fallback primitive |
| Asset-first layout | `unity_create_asset_based_layout` creates repeated prefab or fallback primitive objects |
| Asset-first UI | `unity_create_asset_grid_ui` creates Image/Button grid cells |
| Animation binding | `unity_find_animation_assets` and `unity_get_animator_info` return expected data |

## Known Gaps

- Plugin validator requires Python in the local environment.
- Live Unity compile and Play Mode validation require an open Unity Editor.
- `unity_send_key_event` remains best-effort for Unity New Input System.
