# Dungeon Recovery Procedural Space Quality Dry Run

- Scope: `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/`
- Unity project: `E:/wiseongjun/Unity/DungeonRecoveryCompany`
- Public Release Ready: No

## Planned Generator Changes

- Grid: `42 x 34`
- Room width range: `7-11`
- Room depth range: `7-11`
- Desired room count: `4-5`
- Corridor width: `3`
- Wall height: `3.2`
- Player height: `1.8`
- Camera height: `1.62`

## Algorithm

Rooms are enlarged so first-person movement has room to turn, search, and route around props. Corridors are carved with a 3-cell brush instead of a single-cell line. Walls are raised above player and camera height.

Room props are generated from Unity primitives only: crate, shelf, barrel, broken pillar, debris pile, and storage rack. Prop placement excludes player start, recovery target cells, target-adjacent cells, and corridor cells.

## Validation

The new operational scenario `dungeon_recovery_procedural_space_quality_validation` checks seeds `1001`, `2026`, and `7777` for room metrics, corridor clearance, wall height, prop blocking, target clearance, reachability, job completion, console errors, stale evidence, and Public Release Ready staying `No`.

## Risks

- Larger rooms may reduce placement success on constrained grids, so expanded fallback rooms remain in place.
- Props can still make visual search harder; this is acceptable for exploration but human review remains separate.
- Unity recompilation can temporarily disconnect the Bridge during scene rebuild.

## Rollback Scope

Rollback is limited to generated AInvil Unity files under `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/` and AInvil scenario/harness/report files under `plugins/ainvil/`.
