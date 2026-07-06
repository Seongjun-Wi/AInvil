# Dungeon Recovery Procedural Visual Review

- Scenario: dungeon_recovery_procedural_visual_validation
- Status: Passed
- Validation level: Visual Verified
- Seed: 213770770
- Camera mode: FirstPerson
- Human review required: true
- Public Release Ready: No

## Screenshots

| Checkpoint | Purpose | File | Visible targets | Magenta ratio |
| --- | --- | --- | --- | --- |
| spawn_initial | Confirm initial camera framing, HUD, seed, and absence of magenta rendering. | reports/visual_review/screenshots/procedural_213770770_spawn_initial.png | 1 | 0 |
| after_mouse_look | Confirm first-person view changes after mouse-look equivalent rotation. | reports/visual_review/screenshots/procedural_213770770_after_mouse_look.png | 1 | 0 |
| near_first_target_or_target_visible | Confirm target visibility when the player is placed near a recovery target. | reports/visual_review/screenshots/procedural_213770770_near_first_target_or_target_visible.png | 1 | 0 |
| interaction_prompt | Confirm Press E interaction prompt visibility. | reports/visual_review/screenshots/procedural_213770770_interaction_prompt.png | 1 | 0 |
| job_complete | Confirm completion UI visibility after all targets are recovered. | reports/visual_review/screenshots/procedural_213770770_job_complete.png | 1 | 0 |

## Assertions

| Assertion | Result | Message |
| --- | --- | --- |
| screenshots_exist | Passed | screenshots_exist passed. |
| camera_exists | Passed | camera_exists passed. |
| active_camera_valid | Passed | active_camera_valid passed. |
| camera_position_valid | Passed | camera_position_valid passed. |
| camera_not_inside_wall | Passed | camera_not_inside_wall passed. |
| camera_not_outside_dungeon | Passed | camera_not_outside_dungeon passed. |
| camera_first_person_controlled | Passed | camera_first_person_controlled passed. |
| mouse_look_verified | Passed | mouse_look_verified passed. |
| player_movement_verified | Passed | player_movement_verified passed. |
| ui_canvas_exists | Passed | ui_canvas_exists passed. |
| progress_ui_visible | Passed | progress_ui_visible passed. |
| seed_ui_visible | Passed | seed_ui_visible passed. |
| interaction_prompt_visible | Passed | interaction_prompt_visible passed. |
| job_complete_ui_visible | Passed | job_complete_ui_visible passed. |
| near_target_visible | Passed | near_target_visible passed. |
| prompt_visible_at_interaction_checkpoint | Passed | prompt_visible_at_interaction_checkpoint passed. |
| missing_shader_not_suspected | Passed | missing_shader_not_suspected passed. |
| magenta_ratio_below_threshold | Passed | magenta_ratio_below_threshold passed. |
| human_review_required | Passed | human_review_required passed. |
| public_release_not_claimed | Passed | public_release_not_claimed passed. |

## Camera Framing

- Position: 10.277,1.648,17.584
- Rotation: 4,326.31,0
- Inside wall: false
- Outside dungeon: false
- Mouse look verified: true
- Player movement verified: true

## UI And Target Visibility

- Progress UI visible: true
- Seed UI visible: true
- Interaction prompt visible: true
- Job Complete UI visible: true
- Visible target counts: {"spawn_initial":1,"after_mouse_look":1,"near_first_target_or_target_visible":1,"interaction_prompt":1,"job_complete":1}

## Material Check

- Magenta pixel ratio: 0
- Missing shader suspected: false

## Detected Issues

- None

## Human Review Prompt

Review the attached screenshots for camera framing, target readability, prompt readability, UI placement, missing material artifacts, and whether the first-person view is comfortable enough for a first playable.
