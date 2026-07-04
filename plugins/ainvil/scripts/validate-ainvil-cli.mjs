import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const cliPath = path.join(pluginRoot, "cli/ainvil-cli.mjs");
const offline = process.argv.includes("--offline");
const commands = ["help", "status", "graph", "intelligence", "reviews", "benchmark", "kpi", "workflow", "transitions", "approvals", "executions", "evidence", "traceability", "dashboard", "sync", "gate", "review", "release", "rc", "doctor"]
  .filter((command) => !(offline && command === "doctor"));
const errors = [];

for (const command of commands) {
  const result = await runCli(command);
  if (result.code !== 0) {
    errors.push(`ainvil ${command}: ${result.output.trim() || `exited with ${result.code}`}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR ${error}`);
  process.exit(1);
}

console.log(`AInvil CLI smoke validation passed (${commands.length} command(s), offline=${offline}).`);

function runCli(command) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cliPath, command], {
      cwd: pluginRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.on("error", (error) => resolve({ code: 1, output: error.message }));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}
