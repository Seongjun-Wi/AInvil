export class ProviderAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  get name() {
    return this.config.name || "unknown";
  }

  async listModels() {
    throw new Error(`${this.name} adapter does not implement listModels().`);
  }

  async sendMessage(_request) {
    throw new Error(`${this.name} adapter does not implement sendMessage().`);
  }

  async streamMessage(_request) {
    throw new Error(`${this.name} adapter does not implement streamMessage().`);
  }

  countTokens(messages = []) {
    return JSON.stringify(messages).length;
  }

  capabilities() {
    return {
      supportsToolCalling: false,
      supportsStructuredOutput: false,
      supportsVision: false
    };
  }
}

export function createProviderRegistry(adapters = []) {
  const registry = new Map();
  for (const adapter of adapters) {
    registry.set(adapter.name, adapter);
  }
  return {
    get(name) {
      const adapter = registry.get(name);
      if (!adapter) throw new Error(`Provider adapter not registered: ${name}`);
      return adapter;
    },
    list() {
      return [...registry.keys()];
    },
    register(adapter) {
      registry.set(adapter.name, adapter);
    }
  };
}
