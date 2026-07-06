const UNITY_URL = process.env.UNITY_BRIDGE_URL || "http://127.0.0.1:17777/rpc";
const UNITY_HEALTH_URL = new URL("/health", UNITY_URL).toString();
const PROTOCOL_VERSION = "2025-06-18";

const tools = [
  {
    name: "unity_get_status",
    description: "Return Unity bridge, editor, active scene, selection, compilation, and play mode status.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_get_hierarchy",
    description: "Return the active Unity scene hierarchy as a tree.",
    inputSchema: {
      type: "object",
      properties: {
        includeInactive: { type: "boolean", default: true },
        includeComponents: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_get_game_object",
    description: "Return detailed information for one GameObject.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string", description: "Hierarchy path, for example /Player/Camera." },
        includeSerializedFields: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_project_diff",
    description: "Compare documented expected GameObject paths with the active Unity scene hierarchy.",
    inputSchema: {
      type: "object",
      required: ["expectedPaths"],
      properties: {
        expectedPaths: {
          type: "array",
          items: { type: "string" },
          description: "Expected hierarchy paths such as /GameSystems/RunManager."
        },
        includeInactive: { type: "boolean", default: true },
        includeComponents: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_create_game_object",
    description: "Create an empty GameObject or a Unity primitive.",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string" },
        parentPath: { type: "string" },
        primitiveType: { type: "string", enum: ["empty", "cube", "sphere", "capsule", "cylinder", "plane", "quad"], default: "empty" },
        position: { $ref: "#/$defs/vector3" },
        rotation: { $ref: "#/$defs/vector3" },
        scale: { $ref: "#/$defs/vector3" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_create_asset_based_object",
    description: "Create a gameplay object by searching project prefabs first, then falling back to a Unity primitive when no suitable asset exists.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        assetQuery: { type: "string", description: "Search query such as Player, Enemy, Building, Tree, Door." },
        folders: { type: "array", items: { type: "string" } },
        parentPath: { type: "string" },
        fallbackPrimitive: { type: "string", enum: ["empty", "cube", "sphere", "capsule", "cylinder", "plane", "quad"], default: "cube" },
        materialPath: { type: "string" },
        addCamera: { type: "boolean", default: false },
        addCharacterController: { type: "boolean", default: false },
        position: { $ref: "#/$defs/vector3" },
        rotation: { $ref: "#/$defs/vector3" },
        scale: { $ref: "#/$defs/vector3" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_create_asset_based_layout",
    description: "Create multiple gameplay/world objects by searching project prefabs first, then falling back to primitives for layouts such as building blocks or forests.",
    inputSchema: {
      type: "object",
      properties: {
        rootName: { type: "string", default: "AssetBasedLayout" },
        assetQuery: { type: "string", description: "Search query such as Building, Tree, Rock, Crate." },
        folders: { type: "array", items: { type: "string" } },
        count: { type: "integer", minimum: 1, maximum: 500, default: 10 },
        columns: { type: "integer", minimum: 1 },
        spacing: { type: "number", default: 4 },
        layout: { type: "string", enum: ["grid", "line", "scatter"], default: "grid" },
        fallbackPrimitive: { type: "string", enum: ["empty", "cube", "sphere", "capsule", "cylinder", "plane", "quad"], default: "cube" },
        position: { $ref: "#/$defs/vector3" },
        rotation: { $ref: "#/$defs/vector3" },
        scale: { $ref: "#/$defs/vector3" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_set_game_object",
    description: "Update a GameObject name, active state, tag, layer, parent, or transform.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" },
        name: { type: "string" },
        active: { type: "boolean" },
        tag: { type: "string" },
        layer: { type: ["string", "integer"] },
        parentPath: { type: ["string", "null"], description: "New parent path, or null/empty to move to scene root." },
        siblingIndex: { type: "integer" },
        position: { $ref: "#/$defs/vector3" },
        rotation: { $ref: "#/$defs/vector3" },
        scale: { $ref: "#/$defs/vector3" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_delete_game_object",
    description: "Delete a GameObject with Undo support.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_add_component",
    description: "Add a Component to a GameObject.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "componentType"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string", description: "Type name such as Rigidbody or Namespace.PlayerController." }
      }
    }
  },
  {
    name: "unity_remove_component",
    description: "Remove a Component from a GameObject with Undo support.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "componentType"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string" }
      }
    }
  },
  {
    name: "unity_get_component_schema",
    description: "Return serialized fields and writable public fields/properties for a Component type or instance.",
    inputSchema: {
      type: "object",
      required: ["componentType"],
      properties: {
        componentType: { type: "string" },
        targetPath: { type: "string", description: "Optional GameObject path. When provided, serialized fields are read from the actual component instance." }
      }
    }
  },
  {
    name: "unity_set_component_property",
    description: "Set a serialized field or property on a Component.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "componentType", "propertyName", "value"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string" },
        propertyName: { type: "string" },
        value: {
          description: "JSON value. Supports strings, numbers, booleans, vectors, colors, enums, and arrays for serialized fields.",
          type: ["string", "number", "boolean", "object", "array", "null"]
        }
      }
    }
  },
  {
    name: "unity_assign_object_reference",
    description: "Assign a GameObject, Component, or Asset reference to a Component field.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "componentType", "fieldName", "referenceKind", "reference"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string" },
        fieldName: { type: "string" },
        referenceKind: { type: "string", enum: ["gameObject", "component", "asset"] },
        reference: { type: "string", description: "GameObject path, component path/type, or asset path/GUID." },
        referenceComponentType: { type: "string", description: "Required when referenceKind is component and reference points to a GameObject." }
      }
    }
  },
  {
    name: "unity_find_assets",
    description: "Find Unity assets by AssetDatabase filter.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", default: "" },
        folders: { type: "array", items: { type: "string" } },
        limit: { type: "integer", minimum: 1, maximum: 200, default: 50 }
      }
    }
  },
  {
    name: "unity_create_prefab_instance",
    description: "Instantiate a prefab asset into the active scene.",
    inputSchema: {
      type: "object",
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", description: "Prefab asset path or GUID." },
        name: { type: "string" },
        parentPath: { type: "string" },
        position: { $ref: "#/$defs/vector3" },
        rotation: { $ref: "#/$defs/vector3" },
        scale: { $ref: "#/$defs/vector3" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_create_asset_grid_ui",
    description: "Create an asset-first grid UI using a prefab or generated Image/Button cells instead of a plain Text list.",
    inputSchema: {
      type: "object",
      properties: {
        parentPath: { type: "string", description: "Optional parent GameObject path. Defaults to an existing or generated Canvas." },
        panelName: { type: "string", default: "AssetGrid" },
        cellCount: { type: "integer", minimum: 1, maximum: 200, default: 12 },
        columns: { type: "integer", minimum: 1, default: 4 },
        cellSize: { $ref: "#/$defs/vector2" },
        spacing: { $ref: "#/$defs/vector2" },
        includeLabels: { type: "boolean", default: true },
        useButtons: { type: "boolean", default: true },
        spriteAssetPath: { type: "string", description: "Optional Sprite asset path/GUID for generated cells." },
        cellPrefabPath: { type: "string", description: "Optional prefab asset path/GUID to instantiate as each cell." }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_save_scene",
    description: "Save the active scene or a scene at a specific path.",
    inputSchema: {
      type: "object",
      properties: {
        scenePath: { type: "string", description: "Optional scene path. Defaults to the active scene." },
        saveAsPath: { type: "string", description: "Optional path for unsaved scenes or Save As." }
      }
    }
  },
  {
    name: "unity_open_scene",
    description: "Open a Unity scene by asset path.",
    inputSchema: {
      type: "object",
      required: ["scenePath"],
      properties: {
        scenePath: { type: "string" },
        mode: { type: "string", enum: ["single", "additive"], default: "single" },
        saveCurrentIfDirty: { type: "boolean", default: false },
        dirtyScenePolicy: {
          type: "string",
          enum: ["save", "discard", "fail"],
          default: "fail",
          description: "Non-interactive policy for dirty scenes before opening. save auto-saves, discard opens without saving, fail returns an error. No editor popup is shown."
        }
      }
    }
  },
  {
    name: "unity_list_scenes",
    description: "List scenes from Build Settings or assets.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string", enum: ["buildSettings", "assets", "all"], default: "all" },
        limit: { type: "integer", minimum: 1, maximum: 500, default: 200 }
      }
    }
  },
  {
    name: "unity_create_material",
    description: "Create a Material asset with an optional shader and color.",
    inputSchema: {
      type: "object",
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string" },
        shaderName: { type: "string", default: "Standard" },
        color: { $ref: "#/$defs/color" }
      },
      $defs: vectorDefs()
    }
  },
  {
    name: "unity_assign_material",
    description: "Assign a Material asset to a Renderer on a GameObject.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "materialPath"],
      properties: {
        targetPath: { type: "string" },
        materialPath: { type: "string", description: "Material asset path or GUID." },
        materialIndex: { type: "integer", minimum: 0, default: 0 }
      }
    }
  },
  {
    name: "unity_create_asset",
    description: "Create a ScriptableObject asset.",
    inputSchema: {
      type: "object",
      required: ["assetPath", "typeName"],
      properties: {
        assetPath: { type: "string" },
        typeName: { type: "string", description: "ScriptableObject type full name or short name." }
      }
    }
  },
  {
    name: "unity_import_asset",
    description: "Import or refresh an asset path.",
    inputSchema: {
      type: "object",
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string" },
        forceUpdate: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_refresh_assets",
    description: "Refresh Unity AssetDatabase and report whether compilation/updating is active.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    }
  },
  {
    name: "unity_find_animation_assets",
    description: "Find AnimationClip, AnimatorController, RuntimeAnimatorController, and Avatar assets in the Unity project.",
    inputSchema: {
      type: "object",
      properties: {
        folders: { type: "array", items: { type: "string" } },
        limit: { type: "integer", minimum: 1, maximum: 300, default: 100 }
      }
    }
  },
  {
    name: "unity_create_animator_controller",
    description: "Create an AnimatorController asset with optional states backed by AnimationClip assets.",
    inputSchema: {
      type: "object",
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string", description: "AnimatorController output path under Assets/." },
        states: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              clipPath: { type: "string" }
            }
          },
          default: []
        },
        parameters: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "type"],
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["Float", "Int", "Bool", "Trigger"] }
            }
          },
          default: []
        }
      }
    }
  },
  {
    name: "unity_assign_animator_controller",
    description: "Add or update an Animator on a GameObject and assign a RuntimeAnimatorController asset.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "controllerPath"],
      properties: {
        targetPath: { type: "string" },
        controllerPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_get_animator_info",
    description: "Return Animator and AnimatorController state/parameter information from a GameObject or controller asset.",
    inputSchema: {
      type: "object",
      properties: {
        targetPath: { type: "string" },
        controllerPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_get_console_logs",
    description: "Read recent Unity console logs captured by the bridge.",
    inputSchema: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["all", "log", "warning", "error"], default: "all" },
        limit: { type: "integer", minimum: 1, maximum: 500, default: 100 },
        clearAfterRead: { type: "boolean", default: false }
      }
    }
  }
  ,
  {
    name: "unity_clear_console",
    description: "Clear the Unity Console and bridge-captured log buffer.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_enter_play_mode",
    description: "Enter Unity Play Mode.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_exit_play_mode",
    description: "Exit Unity Play Mode.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_invoke_component_method",
    description: "Invoke a public instance method on a Component. Useful for Play Mode debug hooks and prototype control methods.",
    inputSchema: {
      type: "object",
      required: ["targetPath", "componentType", "methodName"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string" },
        methodName: { type: "string" },
        requirePlaying: { type: "boolean", default: false },
        debugOnly: { type: "boolean", default: false },
        allowedMethodPrefixes: {
          type: "array",
          items: { type: "string" },
          default: ["Get", "Reset", "Set", "Simulate", "Validate", "Debug"]
        },
        args: {
          type: "array",
          description: "JSON arguments converted to the method parameter types.",
          items: { type: ["string", "number", "boolean", "object", "array", "null"] },
          default: []
        }
      }
    }
  },
  {
    name: "unity_click_ui_button",
    description: "Invoke a Unity UI Button onClick event on a target GameObject.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" },
        requireActive: { type: "boolean", default: true },
        requireInteractable: { type: "boolean", default: true },
        includePreflight: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_get_ui_text",
    description: "Read text from Unity UI Text, TextMeshPro, or another component exposing a public text property.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string", default: "auto" },
        includeInactive: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_get_debug_state",
    description: "Invoke a public debug state method such as GetDebugStateJson, GetDebugState, or GetInputDebugState and return machine-readable state.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" },
        componentType: { type: "string" },
        methodName: { type: "string" },
        format: { type: "string", enum: ["json", "object", "string"], default: "json" }
      }
    }
  },
  {
    name: "unity_probe_validation_observation",
    description: "Probe one Validation Design observation and return a normalized value plus probe/source RPC metadata.",
    inputSchema: {
      type: "object",
      required: ["observation"],
      properties: {
        observation: {
          type: "object",
          required: ["name", "type"],
          additionalProperties: true,
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["activeScene", "objectExists", "objectActive", "componentExists", "textValue", "debugStateJson", "editorLogErrors"] },
            target: { type: "string" },
            component: { type: "string" },
            componentType: { type: "string" },
            methodName: { type: "string" },
            field: { type: "string" },
            format: { type: "string" }
          }
        }
      }
    }
  },
  {
    name: "unity_send_key_event",
    description: "Send a keyboard event to the focused Unity Game View. Useful for Play Mode input-spec validation such as Escape opening a pause menu.",
    inputSchema: {
      type: "object",
      required: ["key"],
      properties: {
        key: { type: "string", description: "Unity KeyCode name or common alias such as Escape, Esc, Space, Enter, A, Alpha1." },
        eventType: { type: "string", enum: ["down", "up", "press"], default: "press" },
        modifiers: {
          type: "array",
          items: { type: "string", enum: ["Shift", "Control", "Alt", "Command", "Function", "Numeric", "CapsLock"] },
          default: []
        },
        focusGameView: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_input_test_bridge",
    description: "Invoke the preferred runtime AInvilRuntimeInputTestBridge method in Play Mode for repeatable input validation. Compatibility AInvilInputTestBridge components are still accepted.",
    inputSchema: {
      type: "object",
      required: ["action"],
      properties: {
        action: { type: "string", enum: ["getState", "pressKey", "releaseKey", "clickUiPath", "invokeSetupHook", "clearTrace"] },
        targetPath: { type: "string", description: "Optional GameObject path containing the input test bridge component." },
        componentType: { type: "string", default: "Codex.UnityBridge.AInvilRuntimeInputTestBridge" },
        key: { type: "string", description: "Required for pressKey and releaseKey." },
        path: { type: "string", description: "Required for clickUiPath." },
        hookId: { type: "string", description: "Required for invokeSetupHook." },
        jsonArgs: { type: ["object", "array", "string", "number", "boolean", "null"], description: "Optional setup hook payload." }
      }
    }
  },
  {
    name: "unity_create_input_test_bridge",
    description: "Create or select /Debug/AInvilInputTestBridge with the preferred runtime AInvilRuntimeInputTestBridge component.",
    inputSchema: {
      type: "object",
      properties: {
        rootPath: { type: "string", default: "/Debug" },
        name: { type: "string", default: "AInvilInputTestBridge" }
      }
    }
  },
  {
    name: "unity_run_editor_tests",
    description: "Run Unity EditMode or PlayMode tests.",
    inputSchema: {
      type: "object",
      properties: {
        testMode: { type: "string", enum: ["EditMode", "PlayMode"], default: "EditMode" },
        filter: { type: "string" }
      }
    }
  },
  {
    name: "unity_compile_status",
    description: "Return Unity compilation/update status and recent compile errors.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_get_selection",
    description: "Return the current Unity selection.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "unity_select_object",
    description: "Select a GameObject, asset, or object by instance id in Unity.",
    inputSchema: {
      type: "object",
      properties: {
        targetPath: { type: "string" },
        assetPath: { type: "string" },
        instanceId: { type: "integer" },
        ping: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "unity_open_prefab_stage",
    description: "Open a prefab asset in Prefab Stage.",
    inputSchema: {
      type: "object",
      required: ["assetPath"],
      properties: {
        assetPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_get_prefab_info",
    description: "Return prefab asset or instance information and overrides.",
    inputSchema: {
      type: "object",
      properties: {
        targetPath: { type: "string" },
        assetPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_apply_prefab_overrides",
    description: "Apply overrides from a prefab instance to its source prefab asset.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_revert_prefab_overrides",
    description: "Revert all overrides on a prefab instance.",
    inputSchema: {
      type: "object",
      required: ["targetPath"],
      properties: {
        targetPath: { type: "string" }
      }
    }
  },
  {
    name: "unity_execute_batch",
    description: "Execute multiple Unity Bridge tool calls as one Undo group.",
    inputSchema: {
      type: "object",
      required: ["operations"],
      properties: {
        name: { type: "string", default: "Unity Bridge Batch" },
        dryRun: { type: "boolean", default: false },
        operations: {
          type: "array",
          items: {
            type: "object",
            required: ["method"],
            properties: {
              method: { type: "string" },
              params: { type: "object" }
            }
          }
        }
      }
    }
  }
];

function vectorDefs() {
  return {
    vector2: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" }
      },
      required: ["x", "y"]
    },
    vector3: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        z: { type: "number" }
      },
      required: ["x", "y", "z"]
    },
    color: {
      type: "object",
      properties: {
        r: { type: "number" },
        g: { type: "number" },
        b: { type: "number" },
        a: { type: "number", default: 1 }
      },
      required: ["r", "g", "b"]
    }
  };
}

async function callUnity(method, params) {
  const attempts = method === "unity_enter_play_mode" ? 1 : 6;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callUnityOnce(method, params);
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !(await shouldRetryUnityCall())) {
        break;
      }
      await sleep(Math.min(3000, 500 * attempt));
    }
  }
  throw lastError;
}

async function callUnityOnce(method, params) {
  let response;
  try {
    response = await fetch(UNITY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params: params || {} })
    });
  } catch (error) {
    throw new Error(`Unity Bridge is not reachable at ${UNITY_URL}. Open Unity and enable Tools > Codex Unity Bridge > Start Server. ${error.message}`);
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Unity Bridge returned non-JSON response (${response.status}): ${text.slice(0, 500)}`);
  }

  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Unity Bridge HTTP ${response.status}`);
  }
  return payload.result ?? payload;
}

async function shouldRetryUnityCall() {
  try {
    const response = await fetch(UNITY_HEALTH_URL);
    if (!response.ok) return true;
    const payload = await response.json();
    return payload.bridgeStatus === "reconnecting" || payload.bridgeStatus === "transitioning" || payload.isPlayingOrWillChangePlaymode;
  } catch {
    return true;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleRequest(message) {
  const { id, method, params = {} } = message;
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: params.protocolVersion || PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "unity-bridge", version: "0.6.0" },
        instructions: "Use Unity Bridge tools to inspect before editing. Prefer hierarchy paths and check console errors after writes."
      }
    };
  }
  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools } };
  }
  if (method === "tools/call") {
    const toolName = params.name;
    const args = params.arguments || {};
    if (!tools.some((tool) => tool.name === toolName)) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    if (toolName === "unity_project_diff") {
      const result = await diffUnityProject(args);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        }
      };
    }
    const result = await callUnity(toolName, args);
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      }
    };
  }
  if (method?.startsWith("notifications/")) {
    return null;
  }
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

async function diffUnityProject(args) {
  const expectedPaths = Array.isArray(args.expectedPaths) ? args.expectedPaths : [];
  if (expectedPaths.length === 0) {
    throw new Error("expectedPaths must contain at least one path.");
  }

  const hierarchy = await callUnity("unity_get_hierarchy", {
    includeInactive: args.includeInactive ?? true,
    includeComponents: args.includeComponents ?? true
  });
  const actualPaths = new Set();
  collectHierarchyPaths(hierarchy.roots || [], actualPaths);

  const missingInUnity = expectedPaths.filter((path) => !actualPaths.has(path));
  const missingInRegistry = [...actualPaths]
    .filter((path) => !expectedPaths.includes(path))
    .sort();

  return {
    ok: true,
    scene: hierarchy.scene,
    scenePath: hierarchy.path,
    expectedCount: expectedPaths.length,
    actualCount: actualPaths.size,
    missingInUnity,
    missingInRegistry
  };
}

function collectHierarchyPaths(nodes, paths) {
  for (const node of nodes) {
    if (node.path) paths.add(node.path);
    collectHierarchyPaths(node.children || [], paths);
  }
}

let buffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  void drainMessages();
});

async function drainMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = /content-length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number(match[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (buffer.length < messageEnd) return;

    const raw = buffer.slice(messageStart, messageEnd).toString("utf8");
    buffer = buffer.slice(messageEnd);

    let message;
    try {
      message = JSON.parse(raw);
      const response = await handleRequest(message);
      if (response) writeMessage(response);
    } catch (error) {
      if (message?.id !== undefined) {
        writeMessage({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32000, message: error.message || String(error) }
        });
      }
    }
  }
}

function writeMessage(message) {
  const json = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`);
}
