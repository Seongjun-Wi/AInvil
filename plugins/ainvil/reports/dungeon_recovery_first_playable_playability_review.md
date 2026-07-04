# Dungeon Recovery First Playable Playability Review

- Generated at: 2026-07-04T14:47:46.151Z
- Status: Needs Improvement
- Automated E2E: Passed (Play Mode Verified)
- Automated console check: Passed
- Console error count: 0

## Manual Feedback

- Received: yes
- Checklist items provided: 12 / 12
- Summary: Manual playability review found major camera/framing and visibility issues. Progress UI and Job Complete were understandable, and no runtime instability was reported, but the build is not acceptable as a first playable yet.

## UX Changes Applied

- Added HUD controls text: WASD / Arrow Keys: Move and E: Recover nearby target.
- Added Recover labels and marker spheres above all three recovery targets.
- Added nearest-target highlight that changes the marker and label to Press E: Recover.
- Changed recovered targets to green/dimmed visual state and Recovered label.
- Kept Job Complete visible in the progress UI after all three recoveries.
- Switched generated materials to URP-compatible shaders to remove magenta/pink missing-shader rendering.
- Reframed the main camera with an orthographic centered view so the player and recovery targets are visible.
- Added a player marker/label and enlarged target markers/labels for readability.
- Added a simple objective banner separate from the controls text.
- Kept generated assets isolated under Assets/AInvilGenerated/DungeonRecoveryFirstPlayable.

## Review Items

| Item | Status | Finding |
| --- | --- | --- |
| Player can understand what to do. | Needs Improvement | Controls are visible as text, but the user expects a more game-like tutorial/navigation pattern. |
| Movement can be judged. | Needs Improvement | User could not judge movement feel because the player was not visible. |
| Camera framing supports play. | Needs Improvement | User reported the camera did not show the player or goals clearly. |
| Three recovery targets are identifiable. | Needs Improvement | User reported targets could not be evaluated because they were not visible in the camera view. |
| Recoverable state is visually clear. | Needs Improvement | Press E text exists, but the user could not evaluate it due to camera/visibility issues. |
| E-key recovery response is satisfying. | Needs Improvement | User said only text changes, so the response feels ambiguous. |
| Progress UI is readable. | Passed | User said the UI can be understood, while noting it is not recommended as a normal game presentation. |
| Job Complete is clear. | Passed | User said Job Complete is understandable. |
| No errors, freezes, or abnormal behavior. | Passed | User reported no such symptoms. |
| Overall acceptable as a first playable. | Needs Improvement | User said it is not acceptable because nothing meaningful was visible and it feels like a WASD/interaction test. |

## Manual Acceptance Criteria

| ID | Criterion | Status |
| --- | --- | --- |
| MAC-DRC-001 | Within 3 seconds of starting play, the player understands the objective and controls. | Needs Improvement |
| MAC-DRC-002 | All three recovery targets are visually distinguishable on screen. | Needs Improvement |
| MAC-DRC-003 | The target that can be recovered near the player is visually distinguished. | Needs Improvement |
| MAC-DRC-004 | Recovering all targets clearly transitions the job to complete. | Passed |
| MAC-DRC-005 | Manual play remains free of visible errors, freezes, or abnormal behavior. | Passed |

## Remaining Issues

- Retest required after camera, material, player marker, target marker, and objective banner fixes.
- The current experience still relies on prototype UI/text and does not yet provide a full game-like tutorial flow.
- E-key recovery feedback is still minimal and should eventually receive animation/audio/VFX beyond this generated primitive slice.
- User requested broader design improvement; this pass only applies minimal generated-folder UX fixes.
