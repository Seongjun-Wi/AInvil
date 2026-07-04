# AInvil Examples

This directory stores sample fixtures that are useful for plugin development,
benchmarks, and regression checks, but must not be used as operational project
state or release evidence.

## Contents

- `state/production_state_graph.example.json`: former example production graph.
- `harness/scenarios/top_down_collectible.example.json`: sample live harness scenario.
- `validation/design/top_down_collectible.validation-design.example.json`: sample validation design.

Operational reports should use:

- `state/production_state_graph.json`
- project-specific `harness/scenarios/*.json` with `classification: "Operational"`
- non-sample validation evidence in `validation/evidence/`
