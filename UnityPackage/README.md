# Unity Package Install Files

This folder is a deprecated mirror/install artifact for the Unity-side Codex Unity Bridge package required by Game Designer Unity Agent.

Canonical source:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge
```

The bundled package is version `0.6.0`, which includes Play Mode reconnect support, asset-first Unity creation tools, AnimatorController helpers, and the runtime `AInvilRuntimeInputTestBridge` component for repeatable input validation.

## Install

Recommended: in Unity, use Package Manager's `Add package from disk...` and select the canonical package:

```text
plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json
```

Alternatively, copy this folder into a Unity project:

```text
UnityPackage/Packages/com.codex.unity-bridge
```

Target location:

```text
<UnityProject>/Packages/com.codex.unity-bridge
```

Then open Unity and start the bridge:

```text
Tools > Codex Unity Bridge > Start Server
```

For input validation scenes, add the preferred runtime component:

```text
Codex.UnityBridge.AInvilRuntimeInputTestBridge
```

`Codex.UnityBridge.AInvilInputTestBridge` remains as a compatibility/sample bridge.

The bridge listens on:

```text
http://127.0.0.1:17777/rpc
```

The Codex plugin, skills, marketplace files, and MCP configuration are not needed inside the Unity project.
