# Dungeon Recovery Procedural Space Quality Review

- Scenario: dungeon_recovery_procedural_space_quality_validation
- Status: Passed
- Validation level: Play Mode Verified
- Public Release Ready: No
- Dry-run report: reports/dungeon_recovery_procedural_space_quality_dry_run.json

## Seed Results

| Seed | Rooms | Avg room area | Corridor width | Wall height | Props | Blocked doorways | Blocked targets | Reachable targets | Job complete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1001 | 5 | 77 | 3 | 3.200000047683716 | 10 | 0 | 0 | 3 | true |
| 2026 | 4 | 79 | 3 | 3.200000047683716 | 10 | 0 | 0 | 3 | true |
| 7777 | 5 | 93 | 3 | 3.200000047683716 | 14 | 0 | 0 | 3 | true |

## Prop And Target Validation

| Seed | Prop types | Prop overlaps | Target distribution | Target min distance | Target clearance | Navigability after props |
| --- | --- | ---: | --- | ---: | --- | --- |
| 1001 | barrel, broken_pillar, crate, debris_pile, shelf, storage_rack | 0 | room2:1,room4:1,room5:1 | 10 | true | true |
| 2026 | broken_pillar, crate, debris_pile, shelf, storage_rack | 0 | room1:1,room2:1,room4:1 | 21 | true | true |
| 7777 | barrel, broken_pillar, crate, shelf, storage_rack | 0 | room2:1,room3:1,room5:1 | 19 | true | true |

## Assertions

| Assertion | Result | Message |
| --- | --- | --- |
| generation_succeeded | Passed | generation_succeeded passed. |
| room_count | Passed | room_count passed. |
| min_room_width | Passed | min_room_width passed. |
| min_room_depth | Passed | min_room_depth passed. |
| average_room_area | Passed | average_room_area passed. |
| corridor_width | Passed | corridor_width passed. |
| narrow_passages | Passed | narrow_passages passed. |
| player_clearance | Passed | player_clearance passed. |
| wall_height | Passed | wall_height passed. |
| props_exist | Passed | props_exist passed. |
| prop_types | Passed | prop_types passed. |
| prop_overlap | Passed | prop_overlap passed. |
| doorways_unblocked | Passed | doorways_unblocked passed. |
| targets_unblocked | Passed | targets_unblocked passed. |
| reachable_targets | Passed | reachable_targets passed. |
| navigability_after_props | Passed | navigability_after_props passed. |
| target_distance | Passed | target_distance passed. |
| target_clearance | Passed | target_clearance passed. |
| target_reachability | Passed | target_reachability passed. |
| job_complete | Passed | job_complete passed. |
| public_release_not_claimed | Passed | public_release_not_claimed passed. |
| generation_succeeded | Passed | generation_succeeded passed. |
| room_count | Passed | room_count passed. |
| min_room_width | Passed | min_room_width passed. |
| min_room_depth | Passed | min_room_depth passed. |
| average_room_area | Passed | average_room_area passed. |
| corridor_width | Passed | corridor_width passed. |
| narrow_passages | Passed | narrow_passages passed. |
| player_clearance | Passed | player_clearance passed. |
| wall_height | Passed | wall_height passed. |
| props_exist | Passed | props_exist passed. |
| prop_types | Passed | prop_types passed. |
| prop_overlap | Passed | prop_overlap passed. |
| doorways_unblocked | Passed | doorways_unblocked passed. |
| targets_unblocked | Passed | targets_unblocked passed. |
| reachable_targets | Passed | reachable_targets passed. |
| navigability_after_props | Passed | navigability_after_props passed. |
| target_distance | Passed | target_distance passed. |
| target_clearance | Passed | target_clearance passed. |
| target_reachability | Passed | target_reachability passed. |
| job_complete | Passed | job_complete passed. |
| public_release_not_claimed | Passed | public_release_not_claimed passed. |
| generation_succeeded | Passed | generation_succeeded passed. |
| room_count | Passed | room_count passed. |
| min_room_width | Passed | min_room_width passed. |
| min_room_depth | Passed | min_room_depth passed. |
| average_room_area | Passed | average_room_area passed. |
| corridor_width | Passed | corridor_width passed. |
| narrow_passages | Passed | narrow_passages passed. |
| player_clearance | Passed | player_clearance passed. |
| wall_height | Passed | wall_height passed. |
| props_exist | Passed | props_exist passed. |
| prop_types | Passed | prop_types passed. |
| prop_overlap | Passed | prop_overlap passed. |
| doorways_unblocked | Passed | doorways_unblocked passed. |
| targets_unblocked | Passed | targets_unblocked passed. |
| reachable_targets | Passed | reachable_targets passed. |
| navigability_after_props | Passed | navigability_after_props passed. |
| target_distance | Passed | target_distance passed. |
| target_clearance | Passed | target_clearance passed. |
| target_reachability | Passed | target_reachability passed. |
| job_complete | Passed | job_complete passed. |
| public_release_not_claimed | Passed | public_release_not_claimed passed. |
| all_seeds_tested | Passed | all_seeds_tested passed. |
| console_errors_zero | Passed | console_errors_zero passed. |
| stale_evidence | Passed | stale_evidence passed. |
| public_release_not_claimed | Passed | public_release_not_claimed passed. |

## Next Action

Procedural space quality validation passed. Public Release Ready remains No.
