# Input Spec

## Document Authority

- Input Spec decomposes Technical Design and FeatureSpec input requirements into bindings and validation methods.
- Input Spec does not override the current GDD, System Design, Technical Design, or FeatureSpec.
- Related GDD sections:
- Related System Design sections:
- Related Technical Design sections:
- Related Feature Specs:
- Related Scene Blueprints:
- Related Component Contracts:
- Related Prefab Contracts:
- Related Input Spec:
- Related Decision Log entries:

## Contexts

| context id | context | active when | blocked when |
| --- | --- | --- | --- |
| INPUTCTX-Global | Global | Always | Loading modal |

## Inputs

| input id | related requirement | context | device | binding | action | expected behavior | implementation target | validation method | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INPUT-PauseToggle | REQ-Pause-001 | Global | Keyboard | Escape | Toggle pause | Pause UI opens or closes when allowed. | COMP-PauseController | unity_send_key_event or unity_input_test_bridge | Not tested |

## Debug/Test Inputs

| input id | related requirement | purpose | method | production policy | status |
| --- | --- | --- | --- | --- | --- |
| INPUT-DebugReset | REQ-Debug-001 | Reset state | AInvilInputTestBridge.InvokeSetupHook | Editor-only | Planned |
