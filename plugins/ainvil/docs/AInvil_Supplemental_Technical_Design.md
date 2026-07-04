# AInvil Supplemental Technical Design

## 1. Plugin Validation Script

File:

- `scripts/validate-ainvil-plugin.mjs`

Purpose:

- Validate local plugin layout without requiring Python.
- Catch missing integration files before Codex plugin reload.

Checks:

- `plugin.json` required fields.
- display name is `AInvil`.
- `mcpServers` points to an existing `.mcp.json`.
- `.mcp.json` contains `mcpServers.unity-bridge`.
- skill files exist.
- template files exist.
- schemas parse as JSON.
- Unity package files exist.
- Unity package version is `0.4.0`.
- provider-neutral core modules exist.

Command:

```powershell
node plugins/ainvil/scripts/validate-ainvil-plugin.mjs
```

## 2. Static Validation Boundary

Static validation can verify:

- file layout.
- JSON syntax.
- JavaScript syntax.
- expected plugin integration paths.

Static validation cannot verify:

- Unity C# compilation.
- Unity package import.
- Play Mode reconnect.
- runtime input behavior.
- Codex app plugin reload.

## 3. Live Validation Plan

Required environment:

- Unity Editor with target project open.
- AInvil Unity package installed.
- Codex plugin reloaded.
- Unity Bridge server started.

Steps:

1. Call `unity_get_status`.
2. Call `unity_create_input_test_bridge`.
3. Enter Play Mode.
4. Call `unity_get_status` again.
5. Call `unity_input_test_bridge` with `action: getState`.
6. Call `unity_input_test_bridge` with `action: pressKey`, `key: Escape`.
7. Read console errors.

Pass criteria:

- Unity Bridge remains reachable after Play Mode.
- input bridge commands return structured results.
- no bridge-related console errors appear.

## 4. Future Technical Work

- Add a sample scene or prefab containing `AInvilInputTestBridge`.
- Add a project-specific input adapter example.
- Add OpenAI or Anthropic provider adapter.
- Add desktop app scaffold after plugin workflow is live-validated.
