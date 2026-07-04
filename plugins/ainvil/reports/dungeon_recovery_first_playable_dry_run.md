# Dungeon Recovery First Playable Dry Run

- Unity project: `E:/wiseongjun/Unity/DungeonRecoveryCompany`
- Scenario: `dungeon_recovery_first_playable_e2e`
- Scope: generated assets only under `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable`

## Planned Files

- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_FirstRecoveryJob.unity`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilDungeonRecoveryGameController.cs`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryTarget.cs`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryPlayerController.cs`
- `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryUiView.cs`
- Materials under `Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials`

## Validation

Play Mode validation will use deterministic hooks on the game controller:

1. Load generated scene.
2. Enter Play Mode.
3. Assert `totalRecoveryTargetCount == 3`.
4. Assert initial `recoveredCount == 0`.
5. Recover three targets through public validation methods.
6. Assert final `recoveredCount == 3`.
7. Assert `isJobComplete == true`.
8. Assert progress text contains `Job Complete`.
9. Assert console error count is `0`.

## Rollback

Delete:

```text
E:/wiseongjun/Unity/DungeonRecoveryCompany/Assets/AInvilGenerated/DungeonRecoveryFirstPlayable
```

No existing scene, prefab, or game script should be modified.
