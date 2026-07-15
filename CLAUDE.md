# AInvil Claude Guide

This workspace includes AInvil, a Unity-focused AI game production system shared with Codex.

Use AInvil when the user asks for game design partnership, GDD work, technical design, Unity implementation planning, Unity scene changes, playability validation, input validation, project state synchronization, or production readiness review.

## Entry Points

- AInvil plugin root: `plugins/ainvil`
- Codex plugin manifest: `plugins/ainvil/.codex-plugin/plugin.json`
- Claude MCP config: `.mcp.json`
- Unity MCP server: `plugins/ainvil/mcp-server/server.mjs`
- Unity package: `plugins/ainvil/unity-package/Packages/com.codex.unity-bridge`
- Multi-LLM strategy: `plugins/ainvil/docs/Multi_LLM_Plugin_Strategy.md`
- Claude setup notes: `plugins/ainvil/docs/Claude_Code_Integration.md`

## Agent Roles

Map the Codex skills to Claude behavior:

- Orchestrator: read `plugins/ainvil/skills/orchestrator/SKILL.md` for broad production coordination.
- GDD Agent: read `plugins/ainvil/skills/gdd-agent/SKILL.md` for GDD, design critique, feature specs, and gameplay rules.
- Unity Agent: read `plugins/ainvil/skills/unity-agent/SKILL.md` for Unity implementation and scene/prefab/script changes.
- Input Agent: read `plugins/ainvil/skills/input-agent/SKILL.md` for playability and input validation.

Before making Unity changes, inspect the current Unity state with MCP tools where available. After Unity writes, check compilation, console logs, and relevant validation evidence.

## Useful Commands

```powershell
node plugins\ainvil\cli\ainvil-cli.mjs doctor --unity-project <UnityProjectPath>
node plugins\ainvil\cli\ainvil-cli.mjs compile-check --unity-project <UnityProjectPath>
node plugins\ainvil\scripts\run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational
node plugins\ainvil\cli\ainvil-cli.mjs productization
node plugins\ainvil\cli\ainvil-cli.mjs release
```
