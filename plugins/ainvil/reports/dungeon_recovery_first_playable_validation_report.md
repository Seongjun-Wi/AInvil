# Dungeon Recovery First Playable Validation Report

- Generated at: 2026-07-04T13:35:42.832Z
- Result: Passed
- Validation level: Play Mode Verified
- Scenario: dungeon_recovery_first_playable_e2e
- Evidence: validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json
- Unity project: E:/wiseongjun/Unity/DungeonRecoveryCompany/Assets
- Generated root: Assets/AInvilGenerated/DungeonRecoveryFirstPlayable

## Checks

- Bridge health: Passed
- Compile: Passed
- Console error count: 0
- Play Mode entered: Passed
- Play Mode exited: Passed

## Gameplay Result

- Total targets: 3
- Initial recovered: 0
- After first recovery: 1
- After third recovery: 3
- Job complete: true
- Progress text: "Recovered: 3 / 3\nJob Complete"

## Rollback

- Generated folder: E:/wiseongjun/Unity/DungeonRecoveryCompany/Assets/AInvilGenerated/DungeonRecoveryFirstPlayable
- Action: Delete the generated folder and its .meta files, then let Unity reimport. Existing game assets outside Assets/AInvilGenerated are not part of this change.

## Limitations

- Deterministic validation hooks were used for the recovery sequence.
- Manual feel, UX, balance, build, persistence, accessibility, and public installation validation remain separate gates.
- Public Release Ready is not claimed.
