# Dungeon Recovery Procedural Recovery Job Dry Run

- Scenario: `dungeon_recovery_procedural_recovery_job_e2e`
- Classification: `Operational`
- Unity project: `E:/wiseongjun/Unity/DungeonRecoveryCompany`
- Scope: `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/`
- Public Release Ready: `No`

## Planned Unity Files

- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_ProceduralRecoveryJob.unity`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilProceduralRecoveryJobController.cs`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilProceduralRecoveryPlayerController.cs`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilProceduralRecoveryJobBuilder.cs`

## Algorithm

The v1 generator uses a seeded grid. It creates 4-6 rectangular rooms, connects room centers with L-shaped corridors, spawns floor tiles, surrounds the connected floor with primitive wall cubes, places the player at the first room center, and places three recovery targets on reachable valid floor cells.

Normal play assigns a random startup seed and displays it in the HUD. Fixed seeds are retained only for deterministic validation hooks.

The playable camera is first-person, parented to the player, and rotates with mouse movement. WASD movement is relative to the current view direction.

## Seed Validation

The operational harness validates seeds `1001`, `2026`, and `7777`. Each seed must generate at least four rooms, non-empty floor cells, exactly three recovery targets, three reachable targets, no duplicate target cells, no target/wall overlap, and a completed recovery job. The harness also samples `GenerateWithRandomSeed()` twice and requires different startup seed values.

## Reachability

Reachability is checked with deterministic BFS over cardinal floor-cell neighbors from the player start cell. This proves structural accessibility without requiring full human navigation path simulation in this v1.

## Target Placement Rules

- Target count must be exactly three.
- Targets must be on valid floor cells.
- Targets must not overlap wall cells.
- Targets must not duplicate cells.
- Targets must not overlap the player start cell.
- Targets must be reachable from the player start.
- Targets should keep at least Manhattan distance four from each other.

## Failure Handling

If random room placement cannot create four rooms, a deterministic fallback room layout is used. If three valid reachable targets cannot be placed, generation fails and evidence records `Failed`. If Unity Bridge or compile is unavailable, evidence records `Blocked`.

## Rollback

Remove the procedural scene, procedural scripts, procedural scenario, procedural evidence, procedural reports, and procedural build output listed in this report. Existing first playable files are intentionally left intact.

## Risks

- Runtime primitive count may need pooling or mesh batching later.
- Tutorial remains simple UI text.
- Validation uses deterministic hooks and BFS reachability, not full human navigation path validation.
- First-person mouse look still needs manual comfort review.
- Public Release Ready remains intentionally unclaimed.
