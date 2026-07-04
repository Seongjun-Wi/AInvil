import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const serverPath = path.join(pluginRoot, "mcp-server", "server.mjs");

const child = spawn(process.execPath, [serverPath], {
  cwd: pluginRoot,
  env: {
    ...process.env,
    UNITY_BRIDGE_URL: process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let buffer = Buffer.alloc(0);
const responses = new Map();
let nextId = 1;

const timeout = setTimeout(() => {
  fail("Timed out waiting for MCP server responses.");
}, 5000);

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  drainMessages();
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

child.on("error", (error) => {
  fail(error.message);
});

child.on("exit", (code, signal) => {
  if (responses.size > 0) {
    fail(`MCP server exited before responding to all requests: code=${code} signal=${signal}`);
  }
});

try {
  const initialize = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "ainvil-validator", version: "0.1.0" }
  });

  if (initialize.serverInfo?.name !== "unity-bridge") {
    throw new Error("initialize did not return serverInfo.name=unity-bridge.");
  }
  if (!initialize.capabilities?.tools) {
    throw new Error("initialize did not advertise tools capability.");
  }

  notify("notifications/initialized", {});

  const listed = await request("tools/list", {});
  const tools = listed.tools || [];
  const requiredTools = [
    "unity_get_status",
    "unity_get_hierarchy",
    "unity_get_game_object",
    "unity_get_ui_text",
    "unity_get_debug_state",
    "unity_probe_validation_observation",
    "unity_execute_batch",
    "unity_compile_status"
  ];

  for (const tool of requiredTools) {
    if (!tools.some((entry) => entry.name === tool)) {
      throw new Error(`tools/list is missing ${tool}.`);
    }
  }

  clearTimeout(timeout);
  child.kill();
  console.log(`MCP server validation passed with ${tools.length} tools.`);
} catch (error) {
  fail(error.message || String(error));
}

function request(method, params) {
  const id = nextId++;
  const message = { jsonrpc: "2.0", id, method, params };
  writeMessage(message);
  return new Promise((resolve, reject) => {
    responses.set(id, { resolve, reject });
  });
}

function notify(method, params) {
  writeMessage({ jsonrpc: "2.0", method, params });
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  child.stdin.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}

function drainMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = /content-length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (buffer.length < messageEnd) return;

    const raw = buffer.slice(messageStart, messageEnd).toString("utf8");
    buffer = buffer.slice(messageEnd);
    const message = JSON.parse(raw);
    const pending = responses.get(message.id);
    if (!pending) continue;

    responses.delete(message.id);
    if (message.error) {
      pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
    } else {
      pending.resolve(message.result);
    }
  }
}

function fail(message) {
  clearTimeout(timeout);
  for (const pending of responses.values()) {
    pending.reject(new Error(message));
  }
  responses.clear();
  if (!child.killed) child.kill();
  console.error(`ERROR ${message}`);
  process.exit(1);
}
