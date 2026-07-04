# Multi LLM Plugin Strategy

## Goal

AInvil must not depend on Codex-specific tool calling or prompt structure. The same project state, task graph, document templates, and Unity tools should be reusable from multiple LLM environments.

## Shared Core

| module | role |
| --- | --- |
| `core/provider-adapter.mjs` | Provider adapter base and registry |
| `core/tool-calling-adapter.mjs` | Convert generic tools to OpenAI/Anthropic/generic shapes |
| `core/context-pack.mjs` | Portable prompt context payload |
| `schemas/` | Stable structured data contracts |
| `templates/` | Stable document output format |

## Provider Adapter Contract

Required methods:

- `listModels()`
- `sendMessage(request)`
- `streamMessage(request)`
- `countTokens(messages)`
- `capabilities()`

Capability flags:

- `supportsToolCalling`
- `supportsStructuredOutput`
- `supportsVision`

## Tool Strategy

AInvil tools use a generic MCP-style schema:

```json
{
  "name": "unity_get_status",
  "description": "Return Unity bridge status.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

Provider conversion:

- OpenAI: function tool shape.
- Anthropic: `input_schema` tool shape.
- Generic/local: retain generic shape and use text-command fallback when needed.

## Plugin Export Targets

| target | expected package |
| --- | --- |
| Codex | `.codex-plugin/plugin.json`, skills, `.mcp.json` |
| Claude/Desktop MCP | generic MCP server config |
| OpenAI app/tool connector | provider adapter plus tool schema export |
| Local LLM | text-command fallback and MCP proxy |

## Acceptance Criteria

- A tool can be represented in generic, OpenAI, and Anthropic formats.
- A context pack can be generated without provider-specific fields.
- A provider without tool calling can still receive a text-command representation.
- Codex plugin continues to work as the first supported integration.
