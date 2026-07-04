export function toGenericTool(tool) {
  return {
    name: tool.name,
    description: tool.description || "",
    inputSchema: tool.inputSchema || { type: "object", properties: {} }
  };
}

export function toOpenAITool(tool) {
  const generic = toGenericTool(tool);
  return {
    type: "function",
    function: {
      name: generic.name,
      description: generic.description,
      parameters: generic.inputSchema
    }
  };
}

export function toAnthropicTool(tool) {
  const generic = toGenericTool(tool);
  return {
    name: generic.name,
    description: generic.description,
    input_schema: generic.inputSchema
  };
}

export function normalizeToolResult(result) {
  if (typeof result === "string") return { content: result };
  if (result?.content) return result;
  return { content: JSON.stringify(result ?? null, null, 2) };
}

export function convertToolsForProvider(providerName, tools) {
  switch ((providerName || "").toLowerCase()) {
    case "openai":
      return tools.map(toOpenAITool);
    case "anthropic":
    case "claude":
      return tools.map(toAnthropicTool);
    default:
      return tools.map(toGenericTool);
  }
}
