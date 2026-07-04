# Codex Unity Bridge

Install this package in a Unity project, then use `Tools > Codex Unity Bridge > Start Server`.

The editor bridge listens on `http://127.0.0.1:17777/rpc` and executes requests from the Codex Unity Bridge MCP server.

## Play Mode Input Validation

Version `0.6.0` restores the bridge after entering Play Mode, exposes `unity_input_test_bridge`, adds asset-first gameplay/world object creation, adds asset-first grid UI generation, and adds basic AnimatorController binding tools.

For repeatable Input Agent validation, add `AInvilRuntimeInputTestBridge` to a scene object and wire its UnityEvents to project-specific input adapters. The component records input traces and exposes:

- `GetInputDebugState()`
- `PressKey(string key)`
- `ReleaseKey(string key)`
- `ClickUiPath(string path)`
- `InvokeSetupHook(string hookId, string jsonArgs)`
- `ClearInputTrace()`

`AInvilInputTestBridge` remains available for compatibility with older sample scenes. New operational validation scenarios should prefer `Codex.UnityBridge.AInvilRuntimeInputTestBridge`.

## Asset-First Prototype UI

Use `unity_create_asset_grid_ui` for inventory, shop, roster, card, and item collection UI instead of implementing the main view as a plain Text list. It creates a Canvas-backed grid using an existing cell prefab or generated Image/Button cells.

## Asset-First Gameplay and World Objects

Use:

- `unity_create_asset_based_object`
- `unity_create_asset_based_layout`

These tools search project prefabs first. If no suitable prefab exists, they create Unity primitive fallback objects. For example, a Player can fall back to a capsule with a CharacterController and Camera, and a building block can fall back to scaled cube buildings.

## Animation Binding

Use:

- `unity_find_animation_assets`
- `unity_create_animator_controller`
- `unity_assign_animator_controller`
- `unity_get_animator_info`

These tools support simple clip-to-controller workflows. Advanced blend trees, humanoid retargeting, and root motion tuning still require manual setup or future tool expansion.
