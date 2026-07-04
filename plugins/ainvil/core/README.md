# AInvil Core

This folder contains provider-neutral contracts for the future standalone AInvil app and non-Codex LLM plugins.

## Modules

- `provider-adapter.mjs`: base provider adapter and registry.
- `tool-calling-adapter.mjs`: converts generic MCP-style tools into provider-specific tool schemas.
- `context-pack.mjs`: packages GDD, technical design, Unity state, recent changes, and open questions into a portable context payload.
- `ainvil-paths.mjs`: centralizes current plugin-root path resolution for platform artifacts.
- `loaders.mjs`: read-only loaders for graph, intelligence reports, review records, benchmark cases, KPI artifacts, and file discovery.
- `summaries.mjs`: pure summary helpers used by the CLI and future clients.
- `artifact-checks.mjs`: shared required-artifact checks for the CLI doctor and validators.
- `benchmark-report.mjs`: baseline benchmark report generation from seed datasets.
- `workflow-report.mjs`: read-only Workflow Runtime Report builder for client-neutral workflow state summaries.
- `workflow-transitions.mjs`: read-only Workflow Transition Plan builder.
- `workflow-approvals.mjs`: read-only Workflow Transition Approval classifier.

These modules do not call external LLM APIs directly. They define the stable boundary that OpenAI, Anthropic, Google, local LLM, Codex plugin, and generic MCP integrations can implement.

The read-only modules are the first practical platform-core extraction. They do not move files or create a package boundary yet; they centralize reusable logic while the Codex plugin remains fully functional.

`workflow-report.mjs` is not a workflow engine. It does not perform transitions or execute tasks; it prepares the reporting boundary for future workflow planning.

`workflow-transitions.mjs` and `workflow-approvals.mjs` also do not execute work. They only recommend transition candidates and classify approval requirements.
