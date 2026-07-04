# AInvil Harness

The AInvil harness validates goal-driven Unity game creation workflows.

Run:

```bash
node scripts/validate-ainvil-harness.mjs
```

The current harness is static. It validates scenario fixtures that describe how a user goal should trace through AInvil documents, Unity capability groups, expected artifacts, and validation checks.

Live probe mode for operational project scenarios:

```bash
node scripts/run-ainvil-live-harness.mjs --mode probe
```

Live apply mode:

```bash
node scripts/run-ainvil-live-harness.mjs --mode apply
```

Probe mode is non-mutating and checks bridge health, compile status, console status, hierarchy access, and expected artifact probes. Apply mode may create `AInvilRuntimeInputTestBridge`, enter Play Mode, send input, and exit Play Mode.

Sample fixtures are marked with `classification: "Example"` and are excluded from default live harness runs. To run them intentionally:

```bash
node scripts/run-ainvil-live-harness.mjs --mode probe --include-examples
node scripts/run-ainvil-live-harness.mjs --mode apply --scenario scenario.top_down_collectible --prepare-sample
```

Project-specific validation should add a new `classification: "Operational"` scenario under `harness/scenarios/` and connect it to real requirement and acceptance IDs.
