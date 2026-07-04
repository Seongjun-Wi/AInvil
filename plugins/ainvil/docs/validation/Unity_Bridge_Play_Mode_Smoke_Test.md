# Unity Bridge Play Mode Smoke Test

## Purpose

Verify that AInvil can keep using Unity Bridge after Unity enters Play Mode and that Input Agent can use both best-effort and repeatable validation paths.

## Preconditions

- Unity project has `com.codex.unity-bridge` installed.
- Unity menu `Tools > Codex Unity Bridge > Start Server` has been clicked.
- Codex plugin has loaded the `unity-bridge` MCP server from `.mcp.json`.
- Optional: scene contains `AInvilInputTestBridge`.

## Test Cases

### T1: Health Before Play Mode

1. Call `unity_get_status`.
2. Expected:
   - `bridgeRunning: true`
   - `bridgeStatus: running`
   - `capabilityVersion: 0.6.0-asset-first-objects`

### T2: Enter Play Mode and Reconnect

1. Call `unity_enter_play_mode`.
2. Wait 1-5 seconds.
3. Call `unity_get_status`.
4. Expected:
   - call succeeds after retry if needed
   - `isPlaying: true`
   - `bridgeStatus: running` or temporary `transitioning/reconnecting`
   - `playModeTransitionCount >= 1`

### T3: Best-Effort Key Event

1. Call `unity_send_key_event` with:
   - `key: Escape`
   - `eventType: press`
2. Expected:
   - call succeeds
   - `eventsSent` includes `down` and `up`
3. Note:
   - This only proves the Editor event was sent. Game input receipt must be verified separately.

### T4: Runtime Input Test Bridge

1. If needed, call `unity_create_input_test_bridge`.
2. Ensure scene has `AInvilInputTestBridge`.
3. Call `unity_input_test_bridge` with `action: getState`.
4. Call `unity_input_test_bridge` with `action: pressKey`, `key: Escape`.
5. Expected:
   - `getState` succeeds
   - `pressKey` returns `received: true`
   - trace count increases

### T5: Console Check

1. Call `unity_get_console_logs` with `level: error`.
2. Expected:
   - no new bridge errors

### T6: Asset-First Gameplay Object

1. Call `unity_create_asset_based_object` with:
   - `name: PlayerPrototype`
   - `assetQuery: Player`
   - `fallbackPrimitive: capsule`
   - `addCharacterController: true`
   - `addCamera: true`
2. Expected:
   - call succeeds
   - if a player prefab exists, the object source is `prefab`
   - otherwise the object source is `fallbackPrimitive`
   - fallback object has a CharacterController and child Camera

### T7: Asset-First World Layout

1. Call `unity_create_asset_based_layout` with:
   - `rootName: BuildingBlock`
   - `assetQuery: Building`
   - `count: 12`
   - `columns: 4`
   - `fallbackPrimitive: cube`
2. Expected:
   - call succeeds
   - if building prefabs exist, the objects use prefab source
   - otherwise cubes are scaled as prototype building placeholders

### T8: Asset-First UI Grid

1. Call `unity_create_asset_grid_ui` with:
   - `panelName: InventoryGrid`
   - `cellCount: 12`
   - `columns: 4`
2. Expected:
   - call succeeds
   - a Canvas exists
   - `/Canvas/InventoryGrid` exists
   - generated cells use Image/Button components, not a single Text list

### T9: Animation Asset Binding

1. Call `unity_find_animation_assets`.
2. If clips exist, call `unity_create_animator_controller` with one or more states.
3. Select a character GameObject and call `unity_assign_animator_controller`.
4. Call `unity_get_animator_info`.
5. Expected:
   - controller has states
   - target GameObject has Animator
   - assigned controller path matches expected asset

## Failure Classification

| symptom | likely failure type | next action |
| --- | --- | --- |
| MCP cannot reach Unity after Play Mode | BridgeDisconnected | Check `/health`, retry, confirm server menu state |
| `unity_send_key_event` succeeds but game does not react | InputNotReceived | Use `AInvilInputTestBridge` or project input adapter |
| `unity_input_test_bridge` cannot find component | PreconditionFailed | Add component to scene or pass `targetPath` |
| component method throws | GameLogicFailed | Inspect component implementation and console |
| console errors after command | ConsoleError | Read stack trace and block validation |
