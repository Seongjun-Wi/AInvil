# AInvil Supplemental Planning Audit

## 1. Purpose

This audit records what remains after the main planning and technical design work was implemented.

## 2. Confirmed Improvements

- AInvil naming is separated from Unity Agent.
- Internal language policy is now English-first.
- Plugin manifest references `.mcp.json`.
- Unity Bridge MCP server is registered through plugin config.
- Play Mode reconnect support is implemented.
- Runtime input test bridge is implemented.
- Templates and schemas exist.
- Provider-neutral core modules exist.
- Node-based plugin validation exists.

## 3. Remaining Risks

### 3.1 Unity Live Validation

The C# package and Play Mode reconnect must still be tested in an actual Unity Editor session.

Risk:

- Static validation cannot catch Unity API compile errors or Play Mode lifecycle edge cases.

Mitigation:

- Run `docs/validation/Unity_Bridge_Play_Mode_Smoke_Test.md`.

### 3.2 Codex Plugin Reload

The manifest and MCP config are structurally valid, but the plugin must be reloaded in Codex to confirm MCP tool exposure.

Risk:

- Codex plugin ingestion may impose requirements not covered by static validation.

Mitigation:

- Reinstall/reload plugin and call `unity_get_status`.

### 3.3 Runtime Input Bridge Integration

`AInvilInputTestBridge` provides a generic event surface, but each game still needs project-specific wiring.

Risk:

- The bridge may record a command while the game input system does not react.

Mitigation:

- Treat `unity_input_test_bridge` as a repeatable validation path, not as proof of production input unless the project adapter is wired.

### 3.4 Standalone GUI Scope

The desktop app is designed but not scaffolded.

Risk:

- Scope may grow before core plugin workflow is stable.

Mitigation:

- Validate plugin and Unity workflow first, then scaffold a minimal dashboard.

## 4. Recommended Next Steps

1. Run Unity live smoke test.
2. Reload plugin in Codex and confirm MCP tools.
3. Add one sample Unity scene that contains `AInvilInputTestBridge`.
4. Choose the first non-Codex provider adapter.
5. Scaffold desktop MVP only after live plugin workflow passes.
