using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEditor;
using UnityEditor.Animations;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Object = UnityEngine.Object;

namespace Codex.UnityBridge.Editor
{
    [InitializeOnLoad]
    public static class CodexUnityBridgeServer
    {
        private const string Prefix = "http://127.0.0.1:17777/";
        private const string ServerPreferenceKey = "CodexUnityBridge.ServerEnabled";
        private const string CapabilityVersion = "0.6.0-validation-probes";
        private static readonly ConcurrentQueue<Action> MainThreadActions = new ConcurrentQueue<Action>();
        private static readonly List<ConsoleEntry> ConsoleEntries = new List<ConsoleEntry>();
        private static readonly object ConsoleLock = new object();

        private static HttpListener listener;
        private static Thread listenerThread;
        private static volatile bool running;
        private static int playModeTransitionCount;
        private static int restoreRetryCount;

        static CodexUnityBridgeServer()
        {
            EditorApplication.update += DrainMainThreadActions;
            EditorApplication.quitting += StopServerForReloadOrQuit;
            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
            AssemblyReloadEvents.beforeAssemblyReload += StopServerForReloadOrQuit;
            EditorApplication.delayCall += RestoreServerIfEnabled;
            Application.logMessageReceived += OnLogMessageReceived;
        }

        [MenuItem("Tools/Codex Unity Bridge/Start Server")]
        public static void StartServer()
        {
            if (running)
            {
                Debug.Log("Codex Unity Bridge is already running.");
                return;
            }

            listener = new HttpListener();
            listener.Prefixes.Add(Prefix);
            listener.Start();
            running = true;

            listenerThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "Codex Unity Bridge"
            };
            listenerThread.Start();
            SessionState.SetBool(ServerPreferenceKey, true);
            EditorPrefs.SetBool(ServerPreferenceKey, true);
            restoreRetryCount = 0;

            Debug.Log("Codex Unity Bridge listening on " + Prefix);
        }

        [MenuItem("Tools/Codex Unity Bridge/Stop Server")]
        public static void StopServer()
        {
            StopServer(false);
        }

        private static void StopServer(bool keepEnabledPreference)
        {
            running = false;
            try
            {
                listener?.Stop();
                listener?.Close();
            }
            catch (Exception)
            {
                // Listener shutdown can throw while a request is pending.
            }
            finally
            {
                listener = null;
            }

            if (!keepEnabledPreference)
            {
                SessionState.SetBool(ServerPreferenceKey, false);
                EditorPrefs.SetBool(ServerPreferenceKey, false);
            }

            if (listenerThread != null && listenerThread.IsAlive)
            {
                listenerThread.Join(250);
            }
            listenerThread = null;

            if (!keepEnabledPreference)
            {
                Debug.Log("Codex Unity Bridge stopped.");
            }
        }

        [MenuItem("Tools/Codex Unity Bridge/Status")]
        public static void Status()
        {
            Debug.Log(running ? "Codex Unity Bridge is running on " + Prefix : "Codex Unity Bridge is stopped.");
        }

        [MenuItem("Tools/Codex Unity Bridge/Create AInvil Input Test Bridge")]
        public static void CreateAInvilInputTestBridgeMenu()
        {
            var result = CreateInputTestBridge(new JObject());
            Debug.Log("Created AInvil Input Test Bridge: " + result);
        }

        private static void ListenLoop()
        {
            while (running && listener != null)
            {
                try
                {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(_ => HandleContext(context));
                }
                catch (HttpListenerException)
                {
                    if (running)
                    {
                        Debug.LogWarning("Codex Unity Bridge listener interrupted.");
                    }
                }
                catch (ThreadAbortException)
                {
                    running = false;
                    return;
                }
                catch (ObjectDisposedException)
                {
                    if (running)
                    {
                        Debug.LogWarning("Codex Unity Bridge listener was disposed while running.");
                    }
                }
                catch (Exception ex)
                {
                    if (running)
                    {
                        Debug.LogException(ex);
                    }
                }
            }
        }

        private static void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            playModeTransitionCount++;
            if (state == PlayModeStateChange.ExitingEditMode || state == PlayModeStateChange.ExitingPlayMode)
            {
                StopServerForReloadOrQuit();
            }
            else if (state == PlayModeStateChange.EnteredEditMode || state == PlayModeStateChange.EnteredPlayMode)
            {
                RestoreServerIfEnabled();
            }
        }

        private static void RestoreServerIfEnabled()
        {
            if (!running && BridgeServerShouldBeEnabled())
            {
                TryStartServer("restore");
            }
        }

        private static void StopServerForReloadOrQuit()
        {
            if (running)
            {
                StopServer(true);
            }
        }

        private static void TryStartServer(string reason)
        {
            try
            {
                StartServer();
            }
            catch (Exception ex)
            {
                Debug.LogWarning("Codex Unity Bridge failed to " + reason + ": " + ex.Message);
                if (BridgeServerShouldBeEnabled() && restoreRetryCount < 20)
                {
                    restoreRetryCount++;
                    EditorApplication.delayCall += RestoreServerIfEnabled;
                }
            }
        }

        private static bool BridgeServerShouldBeEnabled()
        {
            return SessionState.GetBool(ServerPreferenceKey, EditorPrefs.GetBool(ServerPreferenceKey, true));
        }

        private static void HandleContext(HttpListenerContext context)
        {
            try
            {
                if (context.Request.HttpMethod == "GET" && context.Request.Url.AbsolutePath == "/health")
                {
                    WriteJson(context, 200, (JObject)ExecuteOnMainThread(Health));
                    return;
                }

                if (context.Request.HttpMethod != "POST" || context.Request.Url.AbsolutePath != "/rpc")
                {
                    WriteJson(context, 404, new JObject { ["error"] = "Expected POST /rpc." });
                    return;
                }

                string body;
                using (var reader = new System.IO.StreamReader(context.Request.InputStream, context.Request.ContentEncoding))
                {
                    body = reader.ReadToEnd();
                }

                var request = JObject.Parse(body);
                var method = request.Value<string>("method");
                var parameters = request["params"] as JObject ?? new JObject();
                var result = ExecuteOnMainThread(() => Dispatch(method, parameters));

                WriteJson(context, 200, new JObject { ["result"] = result });
            }
            catch (Exception ex)
            {
                WriteJson(context, 500, new JObject { ["error"] = ex.Message });
            }
        }

        private static JToken ExecuteOnMainThread(Func<JToken> operation)
        {
            JToken result = null;
            Exception error = null;
            using (var done = new ManualResetEvent(false))
            {
                MainThreadActions.Enqueue(() =>
                {
                    try
                    {
                        result = operation();
                    }
                    catch (Exception ex)
                    {
                        error = ex;
                    }
                    finally
                    {
                        done.Set();
                    }
                });

                if (!done.WaitOne(TimeSpan.FromSeconds(30)))
                {
                    throw new TimeoutException("Unity main thread did not process the bridge request within 30 seconds.");
                }
            }

            if (error != null)
            {
                throw error;
            }

            return result ?? JValue.CreateNull();
        }

        private static void DrainMainThreadActions()
        {
            while (MainThreadActions.TryDequeue(out var action))
            {
                action();
            }
        }

        private static JToken Dispatch(string method, JObject parameters)
        {
            switch (method)
            {
                case "unity_get_status":
                    return GetStatus();
                case "unity_get_hierarchy":
                    return GetHierarchy(parameters);
                case "unity_get_game_object":
                    return GetGameObject(parameters);
                case "unity_create_game_object":
                    return CreateGameObject(parameters);
                case "unity_create_asset_based_object":
                    return CreateAssetBasedObject(parameters);
                case "unity_create_asset_based_layout":
                    return CreateAssetBasedLayout(parameters);
                case "unity_set_game_object":
                    return SetGameObject(parameters);
                case "unity_delete_game_object":
                    return DeleteGameObject(parameters);
                case "unity_add_component":
                    return AddComponent(parameters);
                case "unity_remove_component":
                    return RemoveComponent(parameters);
                case "unity_get_component_schema":
                    return GetComponentSchema(parameters);
                case "unity_set_component_property":
                    return SetComponentProperty(parameters);
                case "unity_assign_object_reference":
                    return AssignObjectReference(parameters);
                case "unity_find_assets":
                    return FindAssets(parameters);
                case "unity_create_prefab_instance":
                    return CreatePrefabInstance(parameters);
                case "unity_create_asset_grid_ui":
                    return CreateAssetGridUi(parameters);
                case "unity_save_scene":
                    return SaveScene(parameters);
                case "unity_open_scene":
                    return OpenScene(parameters);
                case "unity_list_scenes":
                    return ListScenes(parameters);
                case "unity_create_material":
                    return CreateMaterial(parameters);
                case "unity_assign_material":
                    return AssignMaterial(parameters);
                case "unity_create_asset":
                    return CreateAsset(parameters);
                case "unity_import_asset":
                    return ImportAsset(parameters);
                case "unity_find_animation_assets":
                    return FindAnimationAssets(parameters);
                case "unity_create_animator_controller":
                    return CreateAnimatorController(parameters);
                case "unity_assign_animator_controller":
                    return AssignAnimatorController(parameters);
                case "unity_get_animator_info":
                    return GetAnimatorInfo(parameters);
                case "unity_get_console_logs":
                    return GetConsoleLogs(parameters);
                case "unity_clear_console":
                    return ClearConsole();
                case "unity_enter_play_mode":
                    return EnterPlayMode();
                case "unity_exit_play_mode":
                    return ExitPlayMode();
                case "unity_invoke_component_method":
                    return InvokeComponentMethod(parameters);
                case "unity_click_ui_button":
                    return ClickUiButton(parameters);
                case "unity_get_ui_text":
                    return GetUiText(parameters);
                case "unity_get_debug_state":
                    return GetDebugState(parameters);
                case "unity_probe_validation_observation":
                    return ProbeValidationObservation(parameters);
                case "unity_send_key_event":
                    return SendKeyEvent(parameters);
                case "unity_input_test_bridge":
                    return InputTestBridge(parameters);
                case "unity_create_input_test_bridge":
                    return CreateInputTestBridge(parameters);
                case "unity_run_editor_tests":
                    return RunEditorTests(parameters);
                case "unity_compile_status":
                    return CompileStatus();
                case "unity_get_selection":
                    return GetSelection();
                case "unity_select_object":
                    return SelectObject(parameters);
                case "unity_open_prefab_stage":
                    return OpenPrefabStage(parameters);
                case "unity_get_prefab_info":
                    return GetPrefabInfo(parameters);
                case "unity_apply_prefab_overrides":
                    return ApplyPrefabOverrides(parameters);
                case "unity_revert_prefab_overrides":
                    return RevertPrefabOverrides(parameters);
                case "unity_execute_batch":
                    return ExecuteBatch(parameters);
                default:
                    throw new InvalidOperationException("Unknown bridge method: " + method);
            }
        }

        private static JToken GetStatus()
        {
            var scene = SceneManager.GetActiveScene();
            return new JObject
            {
                ["ok"] = true,
                ["bridgeRunning"] = running,
                ["bridgeStatus"] = BridgeStatus(),
                ["capabilityVersion"] = CapabilityVersion,
                ["unityVersion"] = Application.unityVersion,
                ["projectPath"] = Application.dataPath,
                ["isPlaying"] = EditorApplication.isPlaying,
                ["isPaused"] = EditorApplication.isPaused,
                ["isPlayingOrWillChangePlaymode"] = EditorApplication.isPlayingOrWillChangePlaymode,
                ["isCompiling"] = EditorApplication.isCompiling,
                ["isUpdating"] = EditorApplication.isUpdating,
                ["playModeTransitionCount"] = playModeTransitionCount,
                ["inputTestBridgeAvailable"] = FindInputTestBridgeComponent(null, "Codex.UnityBridge.AInvilRuntimeInputTestBridge", false) != null
                    || FindInputTestBridgeComponent(null, "AInvilInputTestBridge", false) != null,
                ["activeScene"] = new JObject
                {
                    ["name"] = scene.name,
                    ["path"] = scene.path,
                    ["isDirty"] = scene.isDirty,
                    ["isLoaded"] = scene.isLoaded,
                    ["rootCount"] = scene.rootCount
                },
                ["selection"] = DescribeSelection()
            };
        }

        private static JToken Health()
        {
            return new JObject
            {
                ["ok"] = true,
                ["bridgeRunning"] = running,
                ["bridgeStatus"] = BridgeStatus(),
                ["capabilityVersion"] = CapabilityVersion,
                ["unityVersion"] = Application.unityVersion,
                ["isPlaying"] = EditorApplication.isPlaying,
                ["isPlayingOrWillChangePlaymode"] = EditorApplication.isPlayingOrWillChangePlaymode,
                ["playModeTransitionCount"] = playModeTransitionCount
            };
        }

        private static JToken GetHierarchy(JObject parameters)
        {
            var includeInactive = parameters.Value<bool?>("includeInactive") ?? true;
            var includeComponents = parameters.Value<bool?>("includeComponents") ?? true;
            var scene = SceneManager.GetActiveScene();
            var roots = new JArray();

            foreach (var root in scene.GetRootGameObjects())
            {
                if (includeInactive || root.activeInHierarchy)
                {
                    roots.Add(DescribeHierarchyNode(root, includeInactive, includeComponents));
                }
            }

            return new JObject
            {
                ["scene"] = scene.name,
                ["path"] = scene.path,
                ["roots"] = roots
            };
        }

        private static JObject DescribeHierarchyNode(GameObject gameObject, bool includeInactive, bool includeComponents)
        {
            var children = new JArray();
            foreach (Transform child in gameObject.transform)
            {
                if (includeInactive || child.gameObject.activeInHierarchy)
                {
                    children.Add(DescribeHierarchyNode(child.gameObject, includeInactive, includeComponents));
                }
            }

            var node = new JObject
            {
                ["name"] = gameObject.name,
                ["path"] = GetPath(gameObject),
                ["activeSelf"] = gameObject.activeSelf,
                ["activeInHierarchy"] = gameObject.activeInHierarchy,
                ["instanceId"] = GetObjectId(gameObject),
                ["children"] = children
            };

            if (includeComponents)
            {
                node["components"] = new JArray(gameObject.GetComponents<Component>().Where(c => c != null).Select(c => c.GetType().FullName));
            }

            return node;
        }

        private static JToken GetGameObject(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("path"));
            var includeSerializedFields = parameters.Value<bool?>("includeSerializedFields") ?? true;

            var components = new JArray();
            foreach (var component in gameObject.GetComponents<Component>())
            {
                if (component == null)
                {
                    continue;
                }

                var componentJson = new JObject
                {
                    ["type"] = component.GetType().FullName
                };
                componentJson["enabled"] = component is Behaviour behaviour ? new JValue(behaviour.enabled) : JValue.CreateNull();

                if (includeSerializedFields)
                {
                    componentJson["serializedFields"] = DescribeSerializedFields(component);
                }

                components.Add(componentJson);
            }

            return new JObject
            {
                ["name"] = gameObject.name,
                ["path"] = GetPath(gameObject),
                ["activeSelf"] = gameObject.activeSelf,
                ["tag"] = gameObject.tag,
                ["layer"] = LayerMask.LayerToName(gameObject.layer),
                ["transform"] = new JObject
                {
                    ["position"] = ToJson(gameObject.transform.localPosition),
                    ["rotation"] = ToJson(gameObject.transform.localEulerAngles),
                    ["scale"] = ToJson(gameObject.transform.localScale)
                },
                ["components"] = components
            };
        }

        private static JToken CreateGameObject(JObject parameters)
        {
            var name = parameters.Value<string>("name");
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new ArgumentException("name is required.");
            }

            var primitiveType = (parameters.Value<string>("primitiveType") ?? "empty").ToLowerInvariant();
            GameObject gameObject;
            switch (primitiveType)
            {
                case "cube":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    break;
                case "sphere":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    break;
                case "capsule":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                    break;
                case "cylinder":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    break;
                case "plane":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Plane);
                    break;
                case "quad":
                    gameObject = GameObject.CreatePrimitive(PrimitiveType.Quad);
                    break;
                case "empty":
                    gameObject = new GameObject();
                    break;
                default:
                    throw new ArgumentException("Unsupported primitiveType: " + primitiveType);
            }

            Undo.RegisterCreatedObjectUndo(gameObject, "Create " + name);
            gameObject.name = name;

            var parentPath = parameters.Value<string>("parentPath");
            if (!string.IsNullOrWhiteSpace(parentPath))
            {
                gameObject.transform.SetParent(RequireGameObject(parentPath).transform);
            }

            SetTransformValues(gameObject.transform, parameters);
            Selection.activeGameObject = gameObject;
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["path"] = GetPath(gameObject),
                ["instanceId"] = GetObjectId(gameObject)
            };
        }

        private static JToken CreateAssetBasedObject(JObject parameters)
        {
            var name = parameters.Value<string>("name") ?? parameters.Value<string>("assetQuery") ?? "AssetBasedObject";
            var assetQuery = parameters.Value<string>("assetQuery") ?? name;
            var parentPath = parameters.Value<string>("parentPath");
            var fallbackPrimitive = parameters.Value<string>("fallbackPrimitive") ?? "cube";
            var materialPath = parameters.Value<string>("materialPath");
            var addCamera = parameters.Value<bool?>("addCamera") ?? false;
            var addCharacterController = parameters.Value<bool?>("addCharacterController") ?? false;
            var searchFolders = parameters["folders"]?.ToObject<string[]>();

            var prefab = FindBestPrefabAsset(assetQuery, searchFolders);
            GameObject gameObject;
            string source;
            string sourceAssetPath = null;
            if (prefab != null)
            {
                gameObject = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
                if (gameObject == null)
                {
                    throw new InvalidOperationException("Failed to instantiate prefab: " + AssetDatabase.GetAssetPath(prefab));
                }
                source = "prefab";
                sourceAssetPath = AssetDatabase.GetAssetPath(prefab);
                Undo.RegisterCreatedObjectUndo(gameObject, "Create Asset-Based Prefab Object");
            }
            else
            {
                gameObject = CreatePrimitiveOrEmpty(fallbackPrimitive);
                source = "fallbackPrimitive";
                Undo.RegisterCreatedObjectUndo(gameObject, "Create Asset-Based Fallback Object");
            }

            gameObject.name = name;
            if (!string.IsNullOrWhiteSpace(parentPath))
            {
                Undo.SetTransformParent(gameObject.transform, RequireGameObject(parentPath).transform, "Set Asset-Based Object Parent");
            }
            SetTransformValues(gameObject.transform, parameters);

            if (!string.IsNullOrWhiteSpace(materialPath))
            {
                AssignMaterialToGameObject(gameObject, materialPath, 0);
            }

            if (addCharacterController && gameObject.GetComponent<CharacterController>() == null)
            {
                Undo.AddComponent<CharacterController>(gameObject);
            }

            if (addCamera)
            {
                var cameraObject = new GameObject("Camera");
                Undo.RegisterCreatedObjectUndo(cameraObject, "Create Follow Camera");
                cameraObject.transform.SetParent(gameObject.transform, false);
                cameraObject.transform.localPosition = new Vector3(0, 3, -6);
                cameraObject.transform.localEulerAngles = new Vector3(20, 0, 0);
                cameraObject.AddComponent<Camera>();
            }

            Selection.activeGameObject = gameObject;
            EditorSceneManagerMarkDirty();
            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(gameObject),
                ["source"] = source,
                ["sourceAssetPath"] = sourceAssetPath,
                ["fallbackPrimitive"] = prefab == null ? fallbackPrimitive : null,
                ["assetQuery"] = assetQuery
            };
        }

        private static JToken CreateAssetBasedLayout(JObject parameters)
        {
            var rootName = parameters.Value<string>("rootName") ?? "AssetBasedLayout";
            var assetQuery = parameters.Value<string>("assetQuery") ?? rootName;
            var count = Math.Max(1, Math.Min(parameters.Value<int?>("count") ?? 10, 500));
            var columns = Math.Max(1, parameters.Value<int?>("columns") ?? Mathf.CeilToInt(Mathf.Sqrt(count)));
            var spacing = parameters.Value<float?>("spacing") ?? 4f;
            var fallbackPrimitive = parameters.Value<string>("fallbackPrimitive") ?? "cube";
            var layout = (parameters.Value<string>("layout") ?? "grid").ToLowerInvariant();
            var searchFolders = parameters["folders"]?.ToObject<string[]>();
            var baseScale = parameters["scale"] != null ? parameters["scale"].ToObject<Vector3>() : Vector3.one;

            var root = new GameObject(rootName);
            Undo.RegisterCreatedObjectUndo(root, "Create Asset-Based Layout");
            var prefab = FindBestPrefabAsset(assetQuery, searchFolders);
            var objects = new JArray();
            for (var i = 0; i < count; i++)
            {
                GameObject item;
                string source;
                if (prefab != null)
                {
                    item = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
                    if (item == null)
                    {
                        throw new InvalidOperationException("Failed to instantiate prefab: " + AssetDatabase.GetAssetPath(prefab));
                    }
                    source = "prefab";
                    Undo.RegisterCreatedObjectUndo(item, "Create Layout Prefab Object");
                }
                else
                {
                    item = CreatePrimitiveOrEmpty(fallbackPrimitive);
                    source = "fallbackPrimitive";
                    Undo.RegisterCreatedObjectUndo(item, "Create Layout Fallback Object");
                }

                item.name = rootName + "_" + (i + 1);
                item.transform.SetParent(root.transform);
                item.transform.localPosition = LayoutPosition(i, count, columns, spacing, layout);
                item.transform.localRotation = Quaternion.identity;
                item.transform.localScale = ScaleForLayoutItem(baseScale, i, fallbackPrimitive, assetQuery);
                objects.Add(new JObject
                {
                    ["path"] = GetPath(item),
                    ["source"] = source
                });
            }

            SetTransformValues(root.transform, parameters);
            Selection.activeGameObject = root;
            EditorSceneManagerMarkDirty();
            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(root),
                ["assetQuery"] = assetQuery,
                ["source"] = prefab != null ? "prefab" : "fallbackPrimitive",
                ["sourceAssetPath"] = prefab != null ? AssetDatabase.GetAssetPath(prefab) : null,
                ["count"] = count,
                ["layout"] = layout,
                ["objects"] = objects
            };
        }

        private static JToken SetGameObject(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            Undo.RecordObject(gameObject, "Set GameObject");
            Undo.RecordObject(gameObject.transform, "Set Transform");

            if (parameters["name"] != null)
            {
                gameObject.name = parameters.Value<string>("name");
            }
            if (parameters["active"] != null)
            {
                gameObject.SetActive(parameters.Value<bool>("active"));
            }
            if (parameters["tag"] != null)
            {
                gameObject.tag = parameters.Value<string>("tag");
            }
            if (parameters["layer"] != null)
            {
                gameObject.layer = ResolveLayer(parameters["layer"]);
            }
            if (parameters.ContainsKey("parentPath"))
            {
                var parentPath = parameters.Value<string>("parentPath");
                var parent = string.IsNullOrWhiteSpace(parentPath) ? null : RequireGameObject(parentPath).transform;
                Undo.SetTransformParent(gameObject.transform, parent, "Set Parent");
            }
            if (parameters["siblingIndex"] != null)
            {
                gameObject.transform.SetSiblingIndex(parameters.Value<int>("siblingIndex"));
            }

            SetTransformValues(gameObject.transform, parameters);
            EditorUtility.SetDirty(gameObject);
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(gameObject),
                ["instanceId"] = GetObjectId(gameObject)
            };
        }

        private static JToken DeleteGameObject(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var path = GetPath(gameObject);
            Undo.DestroyObjectImmediate(gameObject);
            EditorSceneManagerMarkDirty();
            return new JObject { ["ok"] = true, ["deletedPath"] = path };
        }

        private static JToken AddComponent(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var type = RequireComponentType(parameters.Value<string>("componentType"));
            if (gameObject.GetComponent(type) != null)
            {
                return new JObject
                {
                    ["path"] = GetPath(gameObject),
                    ["componentType"] = type.FullName,
                    ["alreadyExisted"] = true
                };
            }

            Undo.AddComponent(gameObject, type);
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["path"] = GetPath(gameObject),
                ["componentType"] = type.FullName,
                ["alreadyExisted"] = false
            };
        }

        private static JToken RemoveComponent(JObject parameters)
        {
            var component = RequireComponent(parameters.Value<string>("targetPath"), parameters.Value<string>("componentType"));
            if (component is Transform)
            {
                throw new InvalidOperationException("Transform cannot be removed.");
            }

            var path = GetPath(component.gameObject);
            var type = component.GetType().FullName;
            Undo.DestroyObjectImmediate(component);
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["ok"] = true,
                ["path"] = path,
                ["componentType"] = type
            };
        }

        private static JToken GetComponentSchema(JObject parameters)
        {
            var type = RequireComponentType(parameters.Value<string>("componentType"));
            Component component = null;
            var targetPath = parameters.Value<string>("targetPath");
            if (!string.IsNullOrWhiteSpace(targetPath))
            {
                component = RequireComponent(targetPath, type.FullName);
            }

            var serializedFields = component != null ? DescribeSerializedFields(component) : new JArray();
            var writableMembers = new JArray();
            foreach (var field in type.GetFields(BindingFlags.Instance | BindingFlags.Public))
            {
                if (!field.IsInitOnly && !field.IsLiteral)
                {
                    writableMembers.Add(new JObject
                    {
                        ["name"] = field.Name,
                        ["kind"] = "field",
                        ["type"] = field.FieldType.FullName
                    });
                }
            }

            foreach (var property in type.GetProperties(BindingFlags.Instance | BindingFlags.Public))
            {
                if (property.CanWrite && property.GetIndexParameters().Length == 0)
                {
                    writableMembers.Add(new JObject
                    {
                        ["name"] = property.Name,
                        ["kind"] = "property",
                        ["type"] = property.PropertyType.FullName
                    });
                }
            }

            return new JObject
            {
                ["componentType"] = type.FullName,
                ["serializedFields"] = serializedFields,
                ["writableMembers"] = writableMembers
            };
        }

        private static JToken SetComponentProperty(JObject parameters)
        {
            var component = RequireComponent(parameters.Value<string>("targetPath"), parameters.Value<string>("componentType"));
            var propertyName = parameters.Value<string>("propertyName");
            var value = parameters["value"];
            if (string.IsNullOrWhiteSpace(propertyName))
            {
                throw new ArgumentException("propertyName is required.");
            }

            Undo.RecordObject(component, "Set " + propertyName);

            if (TrySetTransformShortcut(component, propertyName, value))
            {
                EditorUtility.SetDirty(component);
                EditorSceneManagerMarkDirty();
                return new JObject { ["ok"] = true, ["path"] = GetPath(component.gameObject), ["propertyName"] = propertyName };
            }

            var serializedObject = new SerializedObject(component);
            var serializedProperty = serializedObject.FindProperty(propertyName);
            if (serializedProperty != null)
            {
                SetSerializedProperty(serializedProperty, value);
                serializedObject.ApplyModifiedProperties();
                EditorUtility.SetDirty(component);
                EditorSceneManagerMarkDirty();
                return new JObject { ["ok"] = true, ["path"] = GetPath(component.gameObject), ["propertyName"] = propertyName };
            }

            var type = component.GetType();
            var property = type.GetProperty(propertyName);
            if (property != null && property.CanWrite)
            {
                property.SetValue(component, ConvertToken(value, property.PropertyType));
                EditorUtility.SetDirty(component);
                EditorSceneManagerMarkDirty();
                return new JObject { ["ok"] = true, ["path"] = GetPath(component.gameObject), ["propertyName"] = propertyName };
            }

            var field = type.GetField(propertyName);
            if (field != null)
            {
                field.SetValue(component, ConvertToken(value, field.FieldType));
                EditorUtility.SetDirty(component);
                EditorSceneManagerMarkDirty();
                return new JObject { ["ok"] = true, ["path"] = GetPath(component.gameObject), ["propertyName"] = propertyName };
            }

            throw new ArgumentException("No writable field, property, or serialized property named " + propertyName + " on " + type.FullName);
        }

        private static JToken AssignObjectReference(JObject parameters)
        {
            var component = RequireComponent(parameters.Value<string>("targetPath"), parameters.Value<string>("componentType"));
            var fieldName = parameters.Value<string>("fieldName");
            var referenceKind = parameters.Value<string>("referenceKind");
            var reference = parameters.Value<string>("reference");
            Object referencedObject;

            switch (referenceKind)
            {
                case "gameObject":
                    referencedObject = RequireGameObject(reference);
                    break;
                case "component":
                    referencedObject = RequireComponent(reference, parameters.Value<string>("referenceComponentType"));
                    break;
                case "asset":
                    referencedObject = AssetDatabase.LoadAssetAtPath<Object>(reference);
                    if (referencedObject == null)
                    {
                        var path = AssetDatabase.GUIDToAssetPath(reference);
                        referencedObject = string.IsNullOrWhiteSpace(path) ? null : AssetDatabase.LoadAssetAtPath<Object>(path);
                    }
                    if (referencedObject == null)
                    {
                        throw new ArgumentException("Asset not found: " + reference);
                    }
                    break;
                default:
                    throw new ArgumentException("Unsupported referenceKind: " + referenceKind);
            }

            Undo.RecordObject(component, "Assign " + fieldName);
            var serializedObject = new SerializedObject(component);
            var serializedProperty = serializedObject.FindProperty(fieldName);
            if (serializedProperty == null || serializedProperty.propertyType != SerializedPropertyType.ObjectReference)
            {
                throw new ArgumentException(fieldName + " is not an object reference serialized property.");
            }

            serializedProperty.objectReferenceValue = referencedObject;
            serializedObject.ApplyModifiedProperties();
            EditorUtility.SetDirty(component);
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["ok"] = true,
                ["targetPath"] = GetPath(component.gameObject),
                ["fieldName"] = fieldName,
                ["referenceName"] = referencedObject.name
            };
        }

        private static JToken FindAssets(JObject parameters)
        {
            var filter = parameters.Value<string>("filter") ?? "";
            var limit = Math.Max(1, Math.Min(parameters.Value<int?>("limit") ?? 50, 200));
            var folders = parameters["folders"]?.ToObject<string[]>();
            var guids = folders != null && folders.Length > 0
                ? AssetDatabase.FindAssets(filter, folders)
                : AssetDatabase.FindAssets(filter);

            var assets = new JArray();
            foreach (var guid in guids.Take(limit))
            {
                var path = AssetDatabase.GUIDToAssetPath(guid);
                var asset = AssetDatabase.LoadMainAssetAtPath(path);
                assets.Add(new JObject
                {
                    ["guid"] = guid,
                    ["path"] = path,
                    ["name"] = asset != null ? asset.name : System.IO.Path.GetFileNameWithoutExtension(path),
                    ["type"] = asset != null ? asset.GetType().FullName : null
                });
            }

            return new JObject { ["assets"] = assets, ["count"] = assets.Count };
        }

        private static JToken CreatePrefabInstance(JObject parameters)
        {
            var assetPath = ResolveAssetPath(parameters.Value<string>("assetPath"));
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if (prefab == null)
            {
                throw new ArgumentException("Prefab not found: " + assetPath);
            }

            var instanceObject = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            if (instanceObject == null)
            {
                throw new InvalidOperationException("Failed to instantiate prefab: " + assetPath);
            }

            Undo.RegisterCreatedObjectUndo(instanceObject, "Create Prefab Instance");
            if (parameters["name"] != null)
            {
                instanceObject.name = parameters.Value<string>("name");
            }
            var parentPath = parameters.Value<string>("parentPath");
            if (!string.IsNullOrWhiteSpace(parentPath))
            {
                Undo.SetTransformParent(instanceObject.transform, RequireGameObject(parentPath).transform, "Set Prefab Parent");
            }
            SetTransformValues(instanceObject.transform, parameters);
            Selection.activeGameObject = instanceObject;
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["path"] = GetPath(instanceObject),
                ["assetPath"] = assetPath,
                ["instanceId"] = GetObjectId(instanceObject)
            };
        }

        private static JToken CreateAssetGridUi(JObject parameters)
        {
            var panelName = parameters.Value<string>("panelName") ?? "AssetGrid";
            var cellCount = Math.Max(1, Math.Min(parameters.Value<int?>("cellCount") ?? 12, 200));
            var columns = Math.Max(1, parameters.Value<int?>("columns") ?? 4);
            var cellSize = ToVector2(parameters["cellSize"] as JObject, new Vector2(96, 96));
            var spacing = ToVector2(parameters["spacing"] as JObject, new Vector2(8, 8));
            var includeLabels = parameters.Value<bool?>("includeLabels") ?? true;
            var useButtons = parameters.Value<bool?>("useButtons") ?? true;
            var spritePath = parameters.Value<string>("spriteAssetPath");
            var cellPrefabPath = parameters.Value<string>("cellPrefabPath");

            EnsureEventSystem();
            var parent = ResolveUiParent(parameters.Value<string>("parentPath"));

            var panel = new GameObject(panelName, typeof(RectTransform));
            Undo.RegisterCreatedObjectUndo(panel, "Create Asset Grid UI");
            panel.transform.SetParent(parent.transform, false);
            var panelRect = panel.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.5f, 0.5f);
            panelRect.anchorMax = new Vector2(0.5f, 0.5f);
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panelRect.sizeDelta = new Vector2(columns * cellSize.x + (columns - 1) * spacing.x, Mathf.Ceil((float)cellCount / columns) * cellSize.y);

            var gridType = RequireComponentType("GridLayoutGroup");
            var grid = panel.AddComponent(gridType);
            SetObjectMember(grid, "cellSize", cellSize);
            SetObjectMember(grid, "spacing", spacing);
            SetObjectMember(grid, "constraint", "FixedColumnCount");
            SetObjectMember(grid, "constraintCount", columns);

            var sprite = !string.IsNullOrWhiteSpace(spritePath)
                ? AssetDatabase.LoadAssetAtPath<Sprite>(ResolveAssetPath(spritePath))
                : null;
            var prefab = !string.IsNullOrWhiteSpace(cellPrefabPath)
                ? AssetDatabase.LoadAssetAtPath<GameObject>(ResolveAssetPath(cellPrefabPath))
                : null;

            var cells = new JArray();
            for (var i = 0; i < cellCount; i++)
            {
                var cell = prefab != null
                    ? PrefabUtility.InstantiatePrefab(prefab) as GameObject
                    : CreateDefaultGridCell("Cell_" + (i + 1), sprite, includeLabels, useButtons, i + 1);
                if (cell == null)
                {
                    throw new InvalidOperationException("Failed to create grid cell.");
                }

                Undo.RegisterCreatedObjectUndo(cell, "Create Grid Cell");
                cell.name = "Cell_" + (i + 1);
                cell.transform.SetParent(panel.transform, false);
                cells.Add(GetPath(cell));
            }

            Selection.activeGameObject = panel;
            EditorSceneManagerMarkDirty();
            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(panel),
                ["cellCount"] = cellCount,
                ["columns"] = columns,
                ["usedPrefab"] = prefab != null ? AssetDatabase.GetAssetPath(prefab) : null,
                ["usedSprite"] = sprite != null ? AssetDatabase.GetAssetPath(sprite) : null,
                ["cells"] = cells
            };
        }

        private static JToken SaveScene(JObject parameters)
        {
            var scenePath = parameters.Value<string>("scenePath");
            var saveAsPath = parameters.Value<string>("saveAsPath");
            var scene = string.IsNullOrWhiteSpace(scenePath)
                ? SceneManager.GetActiveScene()
                : SceneManager.GetSceneByPath(scenePath);

            if (!scene.IsValid() || !scene.isLoaded)
            {
                throw new ArgumentException("Scene not loaded: " + (scenePath ?? "<active>"));
            }

            bool saved;
            if (!string.IsNullOrWhiteSpace(saveAsPath))
            {
                saved = EditorSceneManager.SaveScene(scene, saveAsPath);
            }
            else
            {
                saved = EditorSceneManager.SaveScene(scene);
            }

            return new JObject
            {
                ["saved"] = saved,
                ["path"] = scene.path,
                ["name"] = scene.name
            };
        }

        private static JToken OpenScene(JObject parameters)
        {
            var scenePath = parameters.Value<string>("scenePath");
            var dirtyScenePolicy = (parameters.Value<string>("dirtyScenePolicy")
                ?? ((parameters.Value<bool?>("saveCurrentIfDirty") ?? false) ? "save" : "fail")).ToLowerInvariant();
            var dirtySceneResult = HandleDirtyScenesBeforeOpen(dirtyScenePolicy);
            var mode = (parameters.Value<string>("mode") ?? "single").ToLowerInvariant() == "additive"
                ? OpenSceneMode.Additive
                : OpenSceneMode.Single;

            var activeScene = SceneManager.GetActiveScene();
            if (mode == OpenSceneMode.Single && activeScene.IsValid() && activeScene.path == scenePath)
            {
                return new JObject
                {
                    ["name"] = activeScene.name,
                    ["path"] = activeScene.path,
                    ["isLoaded"] = activeScene.isLoaded,
                    ["alreadyOpen"] = true,
                    ["dirtyScenePolicy"] = dirtyScenePolicy,
                    ["dirtySceneResult"] = dirtySceneResult
                };
            }

            var scene = EditorSceneManager.OpenScene(scenePath, mode);

            return new JObject
            {
                ["name"] = scene.name,
                ["path"] = scene.path,
                ["isLoaded"] = scene.isLoaded,
                ["alreadyOpen"] = false,
                ["dirtyScenePolicy"] = dirtyScenePolicy,
                ["dirtySceneResult"] = dirtySceneResult
            };
        }

        private static JArray HandleDirtyScenesBeforeOpen(string policy)
        {
            var changedScenes = Enumerable.Range(0, SceneManager.sceneCount)
                .Select(SceneManager.GetSceneAt)
                .Where(scene => scene.IsValid() && scene.isLoaded && scene.isDirty)
                .ToList();
            var result = new JArray();

            if (changedScenes.Count == 0)
            {
                return result;
            }

            if (policy == "save")
            {
                foreach (var scene in changedScenes)
                {
                    if (string.IsNullOrWhiteSpace(scene.path))
                    {
                        throw new InvalidOperationException("Dirty untitled scene cannot be auto-saved before opening another scene. Save it explicitly with unity_save_scene saveAsPath or use dirtyScenePolicy=discard.");
                    }

                    var saved = EditorSceneManager.SaveScene(scene);
                    if (!saved)
                    {
                        throw new InvalidOperationException("Failed to auto-save dirty scene before opening another scene: " + scene.path);
                    }
                    result.Add(new JObject
                    {
                        ["path"] = scene.path,
                        ["name"] = scene.name,
                        ["action"] = "saved"
                    });
                }
                return result;
            }

            if (policy == "discard")
            {
                foreach (var scene in changedScenes)
                {
                    result.Add(new JObject
                    {
                        ["path"] = scene.path,
                        ["name"] = scene.name,
                        ["action"] = "discardedOnOpen"
                    });
                }
                return result;
            }

            if (policy == "fail")
            {
                throw new InvalidOperationException("Dirty scene changes are present. Re-run unity_open_scene with dirtyScenePolicy=save or dirtyScenePolicy=discard to avoid editor popups.");
            }

            throw new ArgumentException("Unsupported dirtyScenePolicy: " + policy + ". Use save, discard, or fail.");
        }

        private static JToken ListScenes(JObject parameters)
        {
            var source = (parameters.Value<string>("source") ?? "all").ToLowerInvariant();
            var limit = Math.Max(1, Math.Min(parameters.Value<int?>("limit") ?? 200, 500));
            var scenes = new List<JObject>();

            if (source == "buildsettings" || source == "all")
            {
                foreach (var scene in EditorBuildSettings.scenes)
                {
                    scenes.Add(new JObject
                    {
                        ["source"] = "buildSettings",
                        ["path"] = scene.path,
                        ["enabled"] = scene.enabled,
                        ["guid"] = scene.guid.ToString()
                    });
                }
            }

            if (source == "assets" || source == "all")
            {
                foreach (var guid in AssetDatabase.FindAssets("t:Scene"))
                {
                    var path = AssetDatabase.GUIDToAssetPath(guid);
                    if (scenes.All(item => item.Value<string>("path") != path))
                    {
                        scenes.Add(new JObject
                        {
                            ["source"] = "assets",
                            ["path"] = path,
                            ["enabled"] = false,
                            ["guid"] = guid
                        });
                    }
                }
            }

            return new JObject { ["scenes"] = new JArray(scenes.Take(limit)), ["count"] = Math.Min(scenes.Count, limit) };
        }

        private static JToken CreateMaterial(JObject parameters)
        {
            var assetPath = parameters.Value<string>("assetPath");
            var shaderName = parameters.Value<string>("shaderName") ?? "Standard";
            var shader = Shader.Find(shaderName);
            if (shader == null)
            {
                throw new ArgumentException("Shader not found: " + shaderName);
            }

            EnsureAssetFolder(assetPath);
            var material = new Material(shader);
            if (parameters["color"] != null)
            {
                material.color = parameters["color"].ToObject<Color>();
            }
            AssetDatabase.CreateAsset(material, assetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            return new JObject
            {
                ["path"] = assetPath,
                ["name"] = material.name,
                ["shader"] = shader.name
            };
        }

        private static JToken AssignMaterial(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var renderer = gameObject.GetComponent<Renderer>();
            if (renderer == null)
            {
                throw new ArgumentException("Renderer not found on " + GetPath(gameObject));
            }

            var materialPath = ResolveAssetPath(parameters.Value<string>("materialPath"));
            var material = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
            if (material == null)
            {
                throw new ArgumentException("Material not found: " + materialPath);
            }

            var materialIndex = Math.Max(0, parameters.Value<int?>("materialIndex") ?? 0);
            Undo.RecordObject(renderer, "Assign Material");
            var materials = renderer.sharedMaterials;
            if (materials.Length == 0)
            {
                materials = new Material[materialIndex + 1];
            }
            else if (materialIndex >= materials.Length)
            {
                Array.Resize(ref materials, materialIndex + 1);
            }
            materials[materialIndex] = material;
            renderer.sharedMaterials = materials;
            EditorUtility.SetDirty(renderer);
            EditorSceneManagerMarkDirty();

            return new JObject
            {
                ["ok"] = true,
                ["targetPath"] = GetPath(gameObject),
                ["materialPath"] = materialPath,
                ["materialIndex"] = materialIndex
            };
        }

        private static JToken CreateAsset(JObject parameters)
        {
            var assetPath = parameters.Value<string>("assetPath");
            var type = RequireType(parameters.Value<string>("typeName"));
            if (!typeof(ScriptableObject).IsAssignableFrom(type))
            {
                throw new ArgumentException("typeName must be a ScriptableObject type: " + type.FullName);
            }

            EnsureAssetFolder(assetPath);
            var asset = ScriptableObject.CreateInstance(type);
            AssetDatabase.CreateAsset(asset, assetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            return new JObject
            {
                ["path"] = assetPath,
                ["name"] = asset.name,
                ["type"] = type.FullName
            };
        }

        private static JToken ImportAsset(JObject parameters)
        {
            var assetPath = parameters.Value<string>("assetPath");
            var options = (parameters.Value<bool?>("forceUpdate") ?? true)
                ? ImportAssetOptions.ForceUpdate
                : ImportAssetOptions.Default;
            AssetDatabase.ImportAsset(assetPath, options);
            AssetDatabase.Refresh();

            return new JObject { ["ok"] = true, ["path"] = assetPath };
        }

        private static JToken FindAnimationAssets(JObject parameters)
        {
            var limit = Math.Max(1, Math.Min(parameters.Value<int?>("limit") ?? 100, 300));
            var folders = parameters["folders"]?.ToObject<string[]>();
            var filters = new[] { "t:AnimationClip", "t:AnimatorController", "t:Avatar", "t:RuntimeAnimatorController" };
            var assets = new JArray();
            var seen = new HashSet<string>();

            foreach (var filter in filters)
            {
                var guids = folders != null && folders.Length > 0
                    ? AssetDatabase.FindAssets(filter, folders)
                    : AssetDatabase.FindAssets(filter);
                foreach (var guid in guids)
                {
                    if (!seen.Add(guid) || assets.Count >= limit)
                    {
                        continue;
                    }
                    var path = AssetDatabase.GUIDToAssetPath(guid);
                    var asset = AssetDatabase.LoadMainAssetAtPath(path);
                    assets.Add(new JObject
                    {
                        ["guid"] = guid,
                        ["path"] = path,
                        ["name"] = asset != null ? asset.name : System.IO.Path.GetFileNameWithoutExtension(path),
                        ["type"] = asset != null ? asset.GetType().FullName : null
                    });
                }
            }

            return new JObject { ["assets"] = assets, ["count"] = assets.Count };
        }

        private static JToken CreateAnimatorController(JObject parameters)
        {
            var assetPath = parameters.Value<string>("assetPath");
            if (string.IsNullOrWhiteSpace(assetPath))
            {
                throw new ArgumentException("assetPath is required.");
            }

            EnsureAssetFolder(assetPath);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(assetPath);
            var states = parameters["states"] as JArray ?? new JArray();
            AnimatorState firstState = null;
            foreach (var stateToken in states.OfType<JObject>())
            {
                var name = stateToken.Value<string>("name") ?? "State";
                var clipPath = stateToken.Value<string>("clipPath");
                var clip = !string.IsNullOrWhiteSpace(clipPath)
                    ? AssetDatabase.LoadAssetAtPath<AnimationClip>(ResolveAssetPath(clipPath))
                    : null;
                var state = controller.layers[0].stateMachine.AddState(name);
                state.motion = clip;
                firstState = firstState ?? state;
            }

            if (firstState != null)
            {
                controller.layers[0].stateMachine.defaultState = firstState;
            }

            var parametersArray = parameters["parameters"] as JArray ?? new JArray();
            foreach (var parameterToken in parametersArray.OfType<JObject>())
            {
                var name = parameterToken.Value<string>("name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }
                var typeText = parameterToken.Value<string>("type") ?? "Trigger";
                var type = (AnimatorControllerParameterType)Enum.Parse(typeof(AnimatorControllerParameterType), typeText, true);
                controller.AddParameter(name, type);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return DescribeAnimatorController(controller);
        }

        private static JToken AssignAnimatorController(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var controllerPath = ResolveAssetPath(parameters.Value<string>("controllerPath"));
            var controller = AssetDatabase.LoadAssetAtPath<RuntimeAnimatorController>(controllerPath);
            if (controller == null)
            {
                throw new ArgumentException("RuntimeAnimatorController not found: " + controllerPath);
            }

            var animator = gameObject.GetComponent<Animator>();
            if (animator == null)
            {
                animator = Undo.AddComponent<Animator>(gameObject);
            }
            Undo.RecordObject(animator, "Assign Animator Controller");
            animator.runtimeAnimatorController = controller;
            EditorUtility.SetDirty(animator);
            EditorSceneManagerMarkDirty();
            return new JObject
            {
                ["ok"] = true,
                ["targetPath"] = GetPath(gameObject),
                ["controllerPath"] = controllerPath,
                ["componentType"] = typeof(Animator).FullName
            };
        }

        private static JToken GetAnimatorInfo(JObject parameters)
        {
            AnimatorController controller = null;
            Animator animator = null;
            var targetPath = parameters.Value<string>("targetPath");
            if (!string.IsNullOrWhiteSpace(targetPath))
            {
                animator = RequireGameObject(targetPath).GetComponent<Animator>();
                if (animator == null)
                {
                    throw new ArgumentException("Animator not found on " + targetPath);
                }
                controller = animator.runtimeAnimatorController as AnimatorController;
            }

            var controllerPath = parameters.Value<string>("controllerPath");
            if (controller == null && !string.IsNullOrWhiteSpace(controllerPath))
            {
                controller = AssetDatabase.LoadAssetAtPath<AnimatorController>(ResolveAssetPath(controllerPath));
            }

            if (controller == null)
            {
                throw new ArgumentException("AnimatorController not found. Provide targetPath with an AnimatorController or controllerPath.");
            }

            var info = DescribeAnimatorController(controller);
            if (animator != null)
            {
                info["targetPath"] = GetPath(animator.gameObject);
                info["avatar"] = animator.avatar != null ? animator.avatar.name : null;
            }
            return info;
        }

        private static JToken GetConsoleLogs(JObject parameters)
        {
            var level = (parameters.Value<string>("level") ?? "all").ToLowerInvariant();
            var limit = Math.Max(1, Math.Min(parameters.Value<int?>("limit") ?? 100, 500));
            var clearAfterRead = parameters.Value<bool?>("clearAfterRead") ?? false;

            List<ConsoleEntry> snapshot;
            lock (ConsoleLock)
            {
                snapshot = ConsoleEntries.ToList();
                if (clearAfterRead)
                {
                    ConsoleEntries.Clear();
                }
            }

            var logs = snapshot
                .Where(entry => level == "all" || entry.Level == level)
                .Take(Math.Max(0, snapshot.Count))
                .Reverse()
                .Take(limit)
                .Reverse()
                .Select(entry => JObject.FromObject(entry));

            return new JObject { ["logs"] = new JArray(logs) };
        }

        private static JToken ClearConsole()
        {
            lock (ConsoleLock)
            {
                ConsoleEntries.Clear();
            }

            var logEntries = Type.GetType("UnityEditor.LogEntries,UnityEditor.dll");
            var clearMethod = logEntries?.GetMethod("Clear", BindingFlags.Static | BindingFlags.Public);
            clearMethod?.Invoke(null, null);

            return new JObject { ["ok"] = true };
        }

        private static JToken EnterPlayMode()
        {
            EditorApplication.isPlaying = true;
            return new JObject { ["ok"] = true, ["isPlaying"] = EditorApplication.isPlaying };
        }

        private static JToken ExitPlayMode()
        {
            EditorApplication.isPlaying = false;
            return new JObject { ["ok"] = true, ["isPlaying"] = EditorApplication.isPlaying };
        }

        private static JToken InvokeComponentMethod(JObject parameters)
        {
            var targetPath = parameters.Value<string>("targetPath");
            var componentType = parameters.Value<string>("componentType");
            var methodName = parameters.Value<string>("methodName");
            if (string.IsNullOrWhiteSpace(methodName))
            {
                throw new ArgumentException("methodName is required.");
            }

            var requirePlaying = parameters.Value<bool?>("requirePlaying") ?? false;
            if (requirePlaying && !EditorApplication.isPlaying)
            {
                throw new InvalidOperationException("PlayModeRequired: " + methodName + " requires Play Mode.");
            }
            var debugOnly = parameters.Value<bool?>("debugOnly") ?? false;
            if (debugOnly && !MethodNameAllowedForDebug(methodName, parameters["allowedMethodPrefixes"] as JArray))
            {
                throw new InvalidOperationException("UnsafeMethodBlocked: " + methodName + " is not allowed by the validation debug method policy.");
            }

            var component = RequireComponent(targetPath, componentType);
            var args = parameters["args"] as JArray ?? new JArray();
            var flags = BindingFlags.Instance | BindingFlags.Public;
            var methods = component.GetType()
                .GetMethods(flags)
                .Where(method => method.Name == methodName && method.GetParameters().Length == args.Count)
                .ToArray();
            Exception lastInvocationError = null;

            foreach (var method in methods)
            {
                try
                {
                    var convertedArgs = ConvertMethodArgs(method, args);
                    var result = method.Invoke(component, convertedArgs);
                    return new JObject
                    {
                        ["ok"] = true,
                        ["targetPath"] = targetPath,
                        ["componentType"] = component.GetType().FullName,
                        ["methodName"] = methodName,
                        ["isPlaying"] = EditorApplication.isPlaying,
                        ["returnType"] = method.ReturnType.FullName,
                        ["result"] = MethodResultToJson(result)
                    };
                }
                catch (TargetInvocationException ex)
                {
                    lastInvocationError = ex.InnerException ?? ex;
                    break;
                }
                catch (Exception ex) when (ex is ArgumentException || ex is JsonException || ex is FormatException || ex is InvalidCastException)
                {
                    // Try the next overload.
                }
            }

            if (lastInvocationError != null)
            {
                throw new InvalidOperationException("MethodInvocationFailed: " + component.GetType().FullName + "." + methodName + " threw " + lastInvocationError.GetType().Name + ": " + lastInvocationError.Message);
            }
            throw new InvalidOperationException("No compatible public method found: " + component.GetType().FullName + "." + methodName + " with " + args.Count + " argument(s).");
        }

        private static JToken ClickUiButton(JObject parameters)
        {
            var targetPath = parameters.Value<string>("targetPath");
            var requireActive = parameters.Value<bool?>("requireActive") ?? true;
            var requireInteractable = parameters.Value<bool?>("requireInteractable") ?? true;
            var includePreflight = parameters.Value<bool?>("includePreflight") ?? true;
            var gameObject = RequireGameObject(targetPath);
            if (requireActive && !gameObject.activeInHierarchy)
            {
                throw new InvalidOperationException("InactiveTarget: UI Button target is not active in hierarchy: " + targetPath);
            }
            var component = RequireComponent(targetPath, "Button");
            if (requireActive && component is Behaviour behaviour && !behaviour.enabled)
            {
                throw new InvalidOperationException("InactiveTarget: UI Button component is disabled on " + targetPath);
            }
            var interactable = ReadBoolProperty(component, "interactable");
            if (requireInteractable && interactable.HasValue && !interactable.Value)
            {
                throw new InvalidOperationException("ButtonNotInteractable: UI Button is not interactable: " + targetPath);
            }
            var buttonType = component.GetType();
            var onClickMember = buttonType.GetProperty("onClick", BindingFlags.Instance | BindingFlags.Public)?.GetValue(component, null)
                ?? buttonType.GetField("onClick", BindingFlags.Instance | BindingFlags.Public)?.GetValue(component);
            if (onClickMember == null)
            {
                throw new InvalidOperationException("Button onClick event was not found on " + targetPath + ".");
            }

            var invokeMethod = onClickMember.GetType().GetMethod("Invoke", BindingFlags.Instance | BindingFlags.Public, null, Type.EmptyTypes, null);
            if (invokeMethod == null)
            {
                throw new InvalidOperationException("Button onClick event does not expose Invoke().");
            }

            invokeMethod.Invoke(onClickMember, null);
            var result = new JObject
            {
                ["ok"] = true,
                ["targetPath"] = targetPath,
                ["componentType"] = component.GetType().FullName,
                ["isPlaying"] = EditorApplication.isPlaying,
                ["clicked"] = true
            };
            if (includePreflight)
            {
                result["activeSelf"] = gameObject.activeSelf;
                result["activeInHierarchy"] = gameObject.activeInHierarchy;
                result["enabled"] = component is Behaviour enabledBehaviour ? new JValue(enabledBehaviour.enabled) : JValue.CreateNull();
                result["interactable"] = interactable.HasValue ? new JValue(interactable.Value) : JValue.CreateNull();
                var listenerCount = ReadPersistentListenerCount(onClickMember);
                result["listenerCountKnown"] = listenerCount.HasValue;
                result["persistentListenerCount"] = listenerCount.HasValue ? new JValue(listenerCount.Value) : JValue.CreateNull();
            }
            return result;
        }

        private static JToken GetUiText(JObject parameters)
        {
            var targetPath = parameters.Value<string>("targetPath");
            var componentType = parameters.Value<string>("componentType") ?? "auto";
            var gameObject = RequireGameObject(targetPath);
            var component = FindTextComponent(gameObject, componentType);
            if (component == null)
            {
                throw new InvalidOperationException("TextComponentNotFound: no readable text component found on " + targetPath + ".");
            }
            var text = ReadTextFromComponent(component);
            if (text == null)
            {
                throw new InvalidOperationException("TextReadFailed: text property was not readable on " + component.GetType().FullName + ".");
            }
            return new JObject
            {
                ["ok"] = true,
                ["targetPath"] = targetPath,
                ["componentType"] = component.GetType().FullName,
                ["text"] = text,
                ["activeSelf"] = gameObject.activeSelf,
                ["activeInHierarchy"] = gameObject.activeInHierarchy,
                ["isPlaying"] = EditorApplication.isPlaying
            };
        }

        private static JToken GetDebugState(JObject parameters)
        {
            var targetPath = parameters.Value<string>("targetPath");
            var componentType = parameters.Value<string>("componentType");
            var requestedMethodName = parameters.Value<string>("methodName");
            var format = (parameters.Value<string>("format") ?? "json").ToLowerInvariant();
            var gameObject = RequireGameObject(targetPath);
            var component = string.IsNullOrWhiteSpace(componentType)
                ? FindDebugStateComponent(gameObject, requestedMethodName)
                : RequireComponent(targetPath, componentType);
            if (component == null)
            {
                throw new InvalidOperationException("DebugStateMethodNotFound: no component with a supported debug state method was found on " + targetPath + ".");
            }
            var method = FindDebugStateMethod(component, requestedMethodName);
            if (method == null)
            {
                throw new InvalidOperationException("DebugStateMethodNotFound: no supported debug state method found on " + component.GetType().FullName + ".");
            }

            object rawResult;
            try
            {
                rawResult = method.Invoke(component, null);
            }
            catch (TargetInvocationException ex)
            {
                var inner = ex.InnerException ?? ex;
                throw new InvalidOperationException("DebugStateInvocationFailed: " + inner.GetType().Name + ": " + inner.Message);
            }

            var raw = rawResult as string;
            var state = DebugStateToJson(rawResult, format, out raw);
            return new JObject
            {
                ["ok"] = true,
                ["targetPath"] = targetPath,
                ["componentType"] = component.GetType().FullName,
                ["methodName"] = method.Name,
                ["isPlaying"] = EditorApplication.isPlaying,
                ["state"] = state,
                ["raw"] = raw != null ? new JValue(raw) : JValue.CreateNull()
            };
        }

        private static JToken ProbeValidationObservation(JObject parameters)
        {
            var observation = parameters["observation"] as JObject ?? parameters;
            var name = observation.Value<string>("name");
            var type = observation.Value<string>("type");
            if (string.IsNullOrWhiteSpace(type))
            {
                throw new ArgumentException("observation.type is required.");
            }

            JToken value;
            string probe;
            string sourceRpc;
            switch (type)
            {
                case "activeScene":
                    var status = GetStatus();
                    var activeScene = status["activeScene"] as JObject;
                    var field = observation.Value<string>("field") ?? "name";
                    value = activeScene?[field] ?? JValue.CreateNull();
                    probe = "SceneProbe";
                    sourceRpc = "unity_get_status";
                    break;
                case "objectExists":
                    value = new JValue(FindGameObjectByPath(observation.Value<string>("target")) != null);
                    probe = "SceneProbe";
                    sourceRpc = "unity_get_game_object";
                    break;
                case "objectActive":
                    var target = RequireGameObject(observation.Value<string>("target"));
                    value = new JValue(target.activeSelf && target.activeInHierarchy);
                    probe = "SceneProbe";
                    sourceRpc = "unity_get_game_object";
                    break;
                case "componentExists":
                    var targetObject = RequireGameObject(observation.Value<string>("target"));
                    value = new JValue(FindComponentByName(targetObject, observation.Value<string>("component")) != null);
                    probe = "ComponentProbe";
                    sourceRpc = "unity_get_game_object";
                    break;
                case "textValue":
                    var textResult = GetUiText(new JObject
                    {
                        ["targetPath"] = observation.Value<string>("target"),
                        ["componentType"] = observation.Value<string>("componentType") ?? "auto"
                    }) as JObject;
                    value = textResult?["text"] ?? JValue.CreateNull();
                    probe = "UIProbe";
                    sourceRpc = "unity_get_ui_text";
                    break;
                case "debugStateJson":
                    var debugResult = GetDebugState(new JObject
                    {
                        ["targetPath"] = observation.Value<string>("target"),
                        ["componentType"] = observation.Value<string>("component"),
                        ["methodName"] = observation.Value<string>("methodName"),
                        ["format"] = observation.Value<string>("format") ?? "json"
                    }) as JObject;
                    value = debugResult?["state"] ?? JValue.CreateNull();
                    probe = "DebugStateProbe";
                    sourceRpc = "unity_get_debug_state";
                    break;
                case "editorLogErrors":
                    var logs = GetConsoleLogs(new JObject { ["level"] = "error", ["limit"] = observation.Value<int?>("limit") ?? 50 }) as JObject;
                    value = new JValue(logs?["logs"] is JArray entries ? entries.Count : 0);
                    probe = "LogProbe";
                    sourceRpc = "unity_get_console_logs";
                    break;
                default:
                    throw new ArgumentException("Unsupported validation observation type: " + type);
            }

            return new JObject
            {
                ["ok"] = true,
                ["name"] = name,
                ["type"] = type,
                ["value"] = value,
                ["probe"] = probe,
                ["sourceRpc"] = sourceRpc,
                ["isPlaying"] = EditorApplication.isPlaying
            };
        }

        private static JToken SendKeyEvent(JObject parameters)
        {
            var key = parameters.Value<string>("key");
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("key is required.");
            }

            var eventType = (parameters.Value<string>("eventType") ?? "press").ToLowerInvariant();
            var focusGameView = parameters.Value<bool?>("focusGameView") ?? true;
            var keyCode = ParseKeyCode(key);
            var modifiers = ParseEventModifiers(parameters["modifiers"] as JArray);
            var targetWindow = focusGameView ? FocusGameView() : EditorWindow.focusedWindow;
            if (targetWindow == null)
            {
                throw new InvalidOperationException("No focused EditorWindow is available to receive keyboard input.");
            }

            var sent = new JArray();
            if (eventType == "down" || eventType == "press")
            {
                targetWindow.SendEvent(CreateKeyEvent(EventType.KeyDown, keyCode, modifiers));
                sent.Add("down");
            }
            if (eventType == "up" || eventType == "press")
            {
                targetWindow.SendEvent(CreateKeyEvent(EventType.KeyUp, keyCode, modifiers));
                sent.Add("up");
            }
            if (sent.Count == 0)
            {
                throw new ArgumentException("Unsupported eventType: " + eventType);
            }

            return new JObject
            {
                ["ok"] = true,
                ["key"] = keyCode.ToString(),
                ["eventType"] = eventType,
                ["eventsSent"] = sent,
                ["targetWindow"] = targetWindow.GetType().FullName,
                ["isPlaying"] = EditorApplication.isPlaying
            };
        }

        private static JToken InputTestBridge(JObject parameters)
        {
            var action = parameters.Value<string>("action");
            if (string.IsNullOrWhiteSpace(action))
            {
                throw new ArgumentException("action is required.");
            }

            var targetPath = parameters.Value<string>("targetPath");
            var componentType = parameters.Value<string>("componentType") ?? "Codex.UnityBridge.AInvilRuntimeInputTestBridge";
            var component = FindInputTestBridgeComponent(targetPath, componentType, true);
            if (component == null)
            {
                throw new InvalidOperationException("Input test bridge component was not found. Add AInvilRuntimeInputTestBridge to the Play Mode scene or pass targetPath/componentType.");
            }

            string methodName;
            var args = new JArray();
            switch (action)
            {
                case "getState":
                    methodName = "GetInputDebugState";
                    break;
                case "pressKey":
                    methodName = "PressKey";
                    args.Add(RequireString(parameters, "key"));
                    break;
                case "releaseKey":
                    methodName = "ReleaseKey";
                    args.Add(RequireString(parameters, "key"));
                    break;
                case "clickUiPath":
                    methodName = "ClickUiPath";
                    args.Add(RequireString(parameters, "path"));
                    break;
                case "invokeSetupHook":
                    methodName = "InvokeSetupHook";
                    args.Add(RequireString(parameters, "hookId"));
                    args.Add(parameters["jsonArgs"] != null ? parameters["jsonArgs"].ToString(Formatting.None) : "{}");
                    break;
                case "clearTrace":
                    methodName = "ClearInputTrace";
                    break;
                default:
                    throw new ArgumentException("Unsupported input test bridge action: " + action);
            }

            var result = InvokePublicComponentMethod(component, methodName, args);
            return new JObject
            {
                ["ok"] = true,
                ["action"] = action,
                ["targetPath"] = GetPath(component.gameObject),
                ["componentType"] = component.GetType().FullName,
                ["isPlaying"] = EditorApplication.isPlaying,
                ["result"] = MethodResultToJson(result)
            };
        }

        private static JToken CreateInputTestBridge(JObject parameters)
        {
            var rootPath = parameters.Value<string>("rootPath") ?? "/Debug";
            var objectName = parameters.Value<string>("name") ?? "AInvilInputTestBridge";
            var root = FindGameObjectByPath(rootPath);
            if (root == null)
            {
                root = new GameObject(rootPath.Trim('/'));
                Undo.RegisterCreatedObjectUndo(root, "Create " + root.name);
            }

            var existing = root.transform.Cast<Transform>()
                .FirstOrDefault(child => child.name == objectName)
                ?.gameObject;
            var bridgeObject = existing ?? new GameObject(objectName);
            if (existing == null)
            {
                Undo.RegisterCreatedObjectUndo(bridgeObject, "Create " + objectName);
                bridgeObject.transform.SetParent(root.transform);
                bridgeObject.transform.localPosition = Vector3.zero;
                bridgeObject.transform.localRotation = Quaternion.identity;
                bridgeObject.transform.localScale = Vector3.one;
            }

            var bridgeType = TryFindComponentType("Codex.UnityBridge.AInvilRuntimeInputTestBridge")
                ?? TryFindComponentType("AInvilRuntimeInputTestBridge")
                ?? TryFindComponentType("Codex.UnityBridge.AInvilInputTestBridge")
                ?? TryFindComponentType("AInvilInputTestBridge");
            if (bridgeType == null)
            {
                throw new InvalidOperationException("AInvilRuntimeInputTestBridge runtime component type was not found.");
            }

            var component = bridgeObject.GetComponent(bridgeType);
            if (component == null)
            {
                component = bridgeObject.AddComponent(bridgeType);
                if (component == null)
                {
                    throw new InvalidOperationException("Failed to add AInvilRuntimeInputTestBridge component type: " + bridgeType.AssemblyQualifiedName);
                }
                Undo.RegisterCreatedObjectUndo(component, "Add " + bridgeType.Name);
            }

            Selection.activeGameObject = bridgeObject;
            EditorSceneManagerMarkDirty();
            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(bridgeObject),
                ["componentType"] = component.GetType().FullName,
                ["created"] = existing == null
            };
        }

        private static JToken RunEditorTests(JObject parameters)
        {
            var apiType = Type.GetType("UnityEditor.TestTools.TestRunner.Api.TestRunnerApi,UnityEditor.TestRunner.dll");
            var filterType = Type.GetType("UnityEditor.TestTools.TestRunner.Api.Filter,UnityEditor.TestRunner.dll");
            var executionSettingsType = Type.GetType("UnityEditor.TestTools.TestRunner.Api.ExecutionSettings,UnityEditor.TestRunner.dll");
            var testModeType = Type.GetType("UnityEditor.TestTools.TestRunner.Api.TestMode,UnityEditor.TestRunner.dll");
            if (apiType == null || filterType == null || executionSettingsType == null || testModeType == null)
            {
                throw new InvalidOperationException("Unity Test Runner API is not available. Install or enable the Unity Test Framework package.");
            }

            var testModeName = parameters.Value<string>("testMode") ?? "EditMode";
            var filter = Activator.CreateInstance(filterType);
            filterType.GetField("testMode")?.SetValue(filter, Enum.Parse(testModeType, testModeName));
            var testFilter = parameters.Value<string>("filter");
            if (!string.IsNullOrWhiteSpace(testFilter))
            {
                filterType.GetField("testNames")?.SetValue(filter, new[] { testFilter });
            }

            var settings = Activator.CreateInstance(executionSettingsType, new[] { filter });
            var api = Activator.CreateInstance(apiType);
            apiType.GetMethod("Execute")?.Invoke(api, new[] { settings });

            return new JObject
            {
                ["started"] = true,
                ["testMode"] = testModeName,
                ["filter"] = testFilter
            };
        }

        private static JToken CompileStatus()
        {
            var errors = new JArray();
            lock (ConsoleLock)
            {
                foreach (var entry in ConsoleEntries.Where(item => item.Level == "error").Reverse().Take(50).Reverse())
                {
                    errors.Add(JObject.FromObject(entry));
                }
            }

            return new JObject
            {
                ["isCompiling"] = EditorApplication.isCompiling,
                ["isUpdating"] = EditorApplication.isUpdating,
                ["errorCount"] = errors.Count,
                ["recentErrors"] = errors
            };
        }

        private static JToken GetSelection()
        {
            return DescribeSelection();
        }

        private static JToken SelectObject(JObject parameters)
        {
            Object target = null;
            if (parameters["instanceId"] != null)
            {
                target = ObjectFromId(parameters.Value<int>("instanceId"));
            }
            if (target == null && parameters["targetPath"] != null)
            {
                target = RequireGameObject(parameters.Value<string>("targetPath"));
            }
            if (target == null && parameters["assetPath"] != null)
            {
                target = AssetDatabase.LoadMainAssetAtPath(ResolveAssetPath(parameters.Value<string>("assetPath")));
            }
            if (target == null)
            {
                throw new ArgumentException("No selectable target found.");
            }

            Selection.activeObject = target;
            if (parameters.Value<bool?>("ping") ?? true)
            {
                EditorGUIUtility.PingObject(target);
            }

            return new JObject
            {
                ["ok"] = true,
                ["name"] = target.name,
                ["type"] = target.GetType().FullName,
                ["instanceId"] = GetObjectId(target)
            };
        }

        private static JToken OpenPrefabStage(JObject parameters)
        {
            var assetPath = ResolveAssetPath(parameters.Value<string>("assetPath"));
            var stage = PrefabStageUtility.OpenPrefab(assetPath);
            if (stage == null)
            {
                throw new InvalidOperationException("Failed to open prefab stage: " + assetPath);
            }

            return new JObject
            {
                ["assetPath"] = assetPath,
                ["prefabContentsRoot"] = stage.prefabContentsRoot != null ? stage.prefabContentsRoot.name : null
            };
        }

        private static JToken GetPrefabInfo(JObject parameters)
        {
            var assetPath = parameters.Value<string>("assetPath");
            if (!string.IsNullOrWhiteSpace(assetPath))
            {
                assetPath = ResolveAssetPath(assetPath);
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
                if (prefab == null)
                {
                    throw new ArgumentException("Prefab asset not found: " + assetPath);
                }
                return new JObject
                {
                    ["kind"] = "asset",
                    ["assetPath"] = assetPath,
                    ["name"] = prefab.name,
                    ["type"] = PrefabUtility.GetPrefabAssetType(prefab).ToString()
                };
            }

            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var instanceRoot = PrefabUtility.GetNearestPrefabInstanceRoot(gameObject);
            if (instanceRoot == null)
            {
                throw new ArgumentException("Target is not a prefab instance: " + GetPath(gameObject));
            }

            var overrides = new JArray(PrefabUtility.GetObjectOverrides(instanceRoot, false).Select(DescribeObjectOverride));
            var propertyModifications = new JArray((PrefabUtility.GetPropertyModifications(instanceRoot) ?? new PropertyModification[0]).Select(DescribePropertyModification));
            var addedComponents = new JArray(PrefabUtility.GetAddedComponents(instanceRoot).Select(item => new JObject
            {
                ["instanceComponent"] = item.instanceComponent != null ? DescribeObject(item.instanceComponent) : null,
                ["sourceComponent"] = item.instanceComponent != null ? DescribeCorrespondingSourceObject(item.instanceComponent) : null
            }));
            var addedGameObjects = new JArray(PrefabUtility.GetAddedGameObjects(instanceRoot).Select(item => new JObject
            {
                ["instanceGameObject"] = item.instanceGameObject != null ? DescribeObject(item.instanceGameObject) : null,
                ["sourceGameObject"] = item.instanceGameObject != null ? DescribeCorrespondingSourceObject(item.instanceGameObject) : null
            }));

            return new JObject
            {
                ["kind"] = "instance",
                ["path"] = GetPath(gameObject),
                ["instanceRootPath"] = GetPath(instanceRoot),
                ["assetPath"] = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(gameObject),
                ["assetType"] = PrefabUtility.GetPrefabAssetType(gameObject).ToString(),
                ["instanceStatus"] = PrefabUtility.GetPrefabInstanceStatus(gameObject).ToString(),
                ["objectOverrides"] = overrides,
                ["propertyModifications"] = propertyModifications,
                ["addedComponents"] = addedComponents,
                ["addedGameObjects"] = addedGameObjects
            };
        }

        private static JToken ApplyPrefabOverrides(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var root = PrefabUtility.GetNearestPrefabInstanceRoot(gameObject);
            if (root == null)
            {
                throw new ArgumentException("Target is not a prefab instance: " + GetPath(gameObject));
            }

            PrefabUtility.ApplyPrefabInstance(root, InteractionMode.AutomatedAction);
            return new JObject
            {
                ["ok"] = true,
                ["path"] = GetPath(root),
                ["assetPath"] = PrefabUtility.GetPrefabAssetPathOfNearestInstanceRoot(root)
            };
        }

        private static JToken RevertPrefabOverrides(JObject parameters)
        {
            var gameObject = RequireGameObject(parameters.Value<string>("targetPath"));
            var root = PrefabUtility.GetNearestPrefabInstanceRoot(gameObject);
            if (root == null)
            {
                throw new ArgumentException("Target is not a prefab instance: " + GetPath(gameObject));
            }

            PrefabUtility.RevertPrefabInstance(root, InteractionMode.AutomatedAction);
            EditorSceneManagerMarkDirty();
            return new JObject { ["ok"] = true, ["path"] = GetPath(root) };
        }

        private static JToken ExecuteBatch(JObject parameters)
        {
            var dryRun = parameters.Value<bool?>("dryRun") ?? false;
            var operations = parameters["operations"] as JArray;
            if (operations == null)
            {
                throw new ArgumentException("operations array is required.");
            }

            if (dryRun)
            {
                return new JObject { ["dryRun"] = true, ["operations"] = operations };
            }

            var group = Undo.GetCurrentGroup();
            Undo.SetCurrentGroupName(parameters.Value<string>("name") ?? "Unity Bridge Batch");
            var results = new JArray();
            foreach (var operation in operations.OfType<JObject>())
            {
                var method = operation.Value<string>("method");
                if (method == "unity_execute_batch")
                {
                    throw new InvalidOperationException("Nested unity_execute_batch is not supported.");
                }
                results.Add(new JObject
                {
                    ["method"] = method,
                    ["result"] = Dispatch(method, operation["params"] as JObject ?? new JObject())
                });
            }
            Undo.CollapseUndoOperations(group);
            return new JObject { ["ok"] = true, ["results"] = results };
        }

        private static JObject DescribeSelection()
        {
            return new JObject
            {
                ["activeObject"] = Selection.activeObject != null ? DescribeObject(Selection.activeObject) : null,
                ["objects"] = new JArray(Selection.objects.Select(DescribeObject))
            };
        }

        private static JObject DescribeObject(Object target)
        {
            var json = new JObject
            {
                ["name"] = target.name,
                ["type"] = target.GetType().FullName,
                ["instanceId"] = GetObjectId(target)
            };

            if (target is GameObject gameObject)
            {
                json["kind"] = "gameObject";
                json["path"] = GetPath(gameObject);
            }
            else
            {
                var assetPath = AssetDatabase.GetAssetPath(target);
                json["kind"] = string.IsNullOrWhiteSpace(assetPath) ? "object" : "asset";
                json["assetPath"] = assetPath;
            }

            return json;
        }

        private static JObject DescribeObjectOverride(ObjectOverride objectOverride)
        {
            var sourceObject = objectOverride.instanceObject != null
                ? PrefabUtility.GetCorrespondingObjectFromSource(objectOverride.instanceObject)
                : null;

            return new JObject
            {
                ["instanceObject"] = objectOverride.instanceObject != null ? DescribeObject(objectOverride.instanceObject) : null,
                ["sourceObject"] = sourceObject != null ? DescribeObject(sourceObject) : null
            };
        }

        private static JObject DescribePropertyModification(PropertyModification modification)
        {
            return new JObject
            {
                ["target"] = modification.target != null ? DescribeObject(modification.target) : null,
                ["sourceTarget"] = modification.target != null ? DescribeCorrespondingSourceObject(modification.target) : null,
                ["propertyPath"] = modification.propertyPath,
                ["value"] = modification.value,
                ["objectReference"] = modification.objectReference != null ? DescribeObject(modification.objectReference) : null,
                ["sourceObjectReference"] = modification.objectReference != null ? DescribeCorrespondingSourceObject(modification.objectReference) : null
            };
        }

        private static JToken DescribeCorrespondingSourceObject(Object instanceObject)
        {
            var sourceObject = PrefabUtility.GetCorrespondingObjectFromSource(instanceObject);
            return sourceObject != null ? DescribeObject(sourceObject) : JValue.CreateNull();
        }

        private static JToken DescribeOptionalUnityObjectMember(object source, string memberName)
        {
            var type = source.GetType();
            var property = type.GetProperty(memberName, BindingFlags.Instance | BindingFlags.Public);
            var value = property != null ? property.GetValue(source, null) as Object : null;
            if (value == null)
            {
                var field = type.GetField(memberName, BindingFlags.Instance | BindingFlags.Public);
                value = field != null ? field.GetValue(source) as Object : null;
            }

            if (value == null)
            {
                return JValue.CreateNull();
            }

            return new JObject
            {
                ["name"] = value.name,
                ["type"] = value.GetType().FullName,
                    ["instanceId"] = GetObjectId(value),
                ["assetPath"] = AssetDatabase.GetAssetPath(value)
            };
        }

        private static int ResolveLayer(JToken token)
        {
            if (token.Type == JTokenType.Integer)
            {
                return token.Value<int>();
            }

            var layerName = token.Value<string>();
            var layer = LayerMask.NameToLayer(layerName);
            if (layer < 0)
            {
                throw new ArgumentException("Layer not found: " + layerName);
            }
            return layer;
        }

        private static string ResolveAssetPath(string assetPathOrGuid)
        {
            if (string.IsNullOrWhiteSpace(assetPathOrGuid))
            {
                throw new ArgumentException("Asset path or GUID is required.");
            }

            if (assetPathOrGuid.StartsWith("Assets/") || assetPathOrGuid.StartsWith("Packages/"))
            {
                return assetPathOrGuid;
            }

            var path = AssetDatabase.GUIDToAssetPath(assetPathOrGuid);
            if (string.IsNullOrWhiteSpace(path))
            {
                throw new ArgumentException("Asset path or GUID not found: " + assetPathOrGuid);
            }
            return path;
        }

        private static void EnsureAssetFolder(string assetPath)
        {
            var directory = System.IO.Path.GetDirectoryName(assetPath)?.Replace('\\', '/');
            if (string.IsNullOrWhiteSpace(directory) || AssetDatabase.IsValidFolder(directory))
            {
                return;
            }

            var parts = directory.Split('/');
            var current = parts[0];
            if (current != "Assets")
            {
                throw new ArgumentException("Can only create asset folders under Assets/: " + assetPath);
            }

            for (var i = 1; i < parts.Length; i++)
            {
                var next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, parts[i]);
                }
                current = next;
            }
        }

        private static Type RequireType(string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
            {
                throw new ArgumentException("typeName is required.");
            }

            var type = Type.GetType(typeName);
            if (type != null)
            {
                return type;
            }

            type = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(assembly =>
                {
                    try
                    {
                        return assembly.GetTypes();
                    }
                    catch (ReflectionTypeLoadException ex)
                    {
                        return ex.Types.Where(item => item != null);
                    }
                })
                .FirstOrDefault(candidate => candidate.FullName == typeName || candidate.Name == typeName);

            if (type == null)
            {
                throw new ArgumentException("Type not found: " + typeName);
            }

            return type;
        }

        private static GameObject FindBestPrefabAsset(string query, string[] folders)
        {
            var terms = string.IsNullOrWhiteSpace(query)
                ? new string[0]
                : query.Split(new[] { ' ', '_', '-' }, StringSplitOptions.RemoveEmptyEntries);
            var filter = "t:Prefab";
            if (terms.Length > 0)
            {
                filter = string.Join(" ", terms.Select(term => term)) + " t:Prefab";
            }

            var guids = folders != null && folders.Length > 0
                ? AssetDatabase.FindAssets(filter, folders)
                : AssetDatabase.FindAssets(filter);

            var candidates = guids
                .Select(guid => AssetDatabase.GUIDToAssetPath(guid))
                .Select(path => AssetDatabase.LoadAssetAtPath<GameObject>(path))
                .Where(asset => asset != null)
                .OrderByDescending(asset => AssetMatchScore(asset.name, query))
                .ThenBy(asset => asset.name)
                .ToList();

            return candidates.FirstOrDefault();
        }

        private static int AssetMatchScore(string assetName, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return 0;
            }
            var score = 0;
            var normalizedName = assetName.ToLowerInvariant();
            foreach (var term in query.ToLowerInvariant().Split(new[] { ' ', '_', '-' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (normalizedName == term)
                {
                    score += 10;
                }
                else if (normalizedName.Contains(term))
                {
                    score += 3;
                }
            }
            return score;
        }

        private static GameObject CreatePrimitiveOrEmpty(string primitiveType)
        {
            switch ((primitiveType ?? "cube").ToLowerInvariant())
            {
                case "cube":
                    return GameObject.CreatePrimitive(PrimitiveType.Cube);
                case "sphere":
                    return GameObject.CreatePrimitive(PrimitiveType.Sphere);
                case "capsule":
                    return GameObject.CreatePrimitive(PrimitiveType.Capsule);
                case "cylinder":
                    return GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                case "plane":
                    return GameObject.CreatePrimitive(PrimitiveType.Plane);
                case "quad":
                    return GameObject.CreatePrimitive(PrimitiveType.Quad);
                case "empty":
                    return new GameObject();
                default:
                    throw new ArgumentException("Unsupported fallbackPrimitive: " + primitiveType);
            }
        }

        private static Vector3 LayoutPosition(int index, int count, int columns, float spacing, string layout)
        {
            if (layout == "line")
            {
                return new Vector3(index * spacing, 0, 0);
            }
            if (layout == "scatter")
            {
                var row = index / columns;
                var col = index % columns;
                var offset = ((index * 37) % 100) / 100f;
                return new Vector3((col + offset) * spacing, 0, (row + (1f - offset)) * spacing);
            }

            var gridRow = index / columns;
            var gridCol = index % columns;
            return new Vector3(gridCol * spacing, 0, gridRow * spacing);
        }

        private static Vector3 ScaleForLayoutItem(Vector3 baseScale, int index, string primitiveType, string query)
        {
            if (!string.IsNullOrWhiteSpace(query) && query.ToLowerInvariant().Contains("building") && (primitiveType ?? "cube").ToLowerInvariant() == "cube")
            {
                var height = 2f + (index % 5) * 1.25f;
                return new Vector3(baseScale.x, baseScale.y * height, baseScale.z);
            }
            return baseScale;
        }

        private static void AssignMaterialToGameObject(GameObject gameObject, string materialPath, int materialIndex)
        {
            var renderer = gameObject.GetComponent<Renderer>();
            if (renderer == null)
            {
                return;
            }

            var resolved = ResolveAssetPath(materialPath);
            var material = AssetDatabase.LoadAssetAtPath<Material>(resolved);
            if (material == null)
            {
                throw new ArgumentException("Material not found: " + resolved);
            }

            Undo.RecordObject(renderer, "Assign Material");
            var materials = renderer.sharedMaterials;
            if (materialIndex >= materials.Length)
            {
                Array.Resize(ref materials, materialIndex + 1);
            }
            materials[materialIndex] = material;
            renderer.sharedMaterials = materials;
            EditorUtility.SetDirty(renderer);
        }

        private static GameObject ResolveUiParent(string parentPath)
        {
            if (!string.IsNullOrWhiteSpace(parentPath))
            {
                return RequireGameObject(parentPath);
            }

            var canvas = Object.FindObjectOfType<Canvas>();
            if (canvas != null)
            {
                return canvas.gameObject;
            }

            var canvasObject = new GameObject("Canvas", typeof(RectTransform));
            Undo.RegisterCreatedObjectUndo(canvasObject, "Create Canvas");
            var canvasComponent = canvasObject.AddComponent<Canvas>();
            canvasComponent.renderMode = RenderMode.ScreenSpaceOverlay;
            TryAddComponent(canvasObject, "CanvasScaler");
            TryAddComponent(canvasObject, "GraphicRaycaster");
            return canvasObject;
        }

        private static void EnsureEventSystem()
        {
            if (Object.FindObjectOfType<UnityEngine.EventSystems.EventSystem>() != null)
            {
                return;
            }

            var eventSystem = new GameObject("EventSystem");
            Undo.RegisterCreatedObjectUndo(eventSystem, "Create EventSystem");
            eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
            TryAddComponent(eventSystem, "StandaloneInputModule");
        }

        private static GameObject CreateDefaultGridCell(string name, Sprite sprite, bool includeLabel, bool useButton, int index)
        {
            var imageType = RequireComponentType("Image");
            var cell = new GameObject(name, typeof(RectTransform));
            var rect = cell.GetComponent<RectTransform>();
            rect.sizeDelta = new Vector2(96, 96);
            TryAddComponent(cell, "CanvasRenderer");
            var image = cell.AddComponent(imageType);
            SetObjectMember(image, "color", new Color(0.18f, 0.18f, 0.2f, 0.92f));
            if (sprite != null)
            {
                SetObjectMember(image, "sprite", sprite);
            }
            if (useButton)
            {
                TryAddComponent(cell, "Button");
            }

            var icon = new GameObject("Icon", typeof(RectTransform));
            icon.transform.SetParent(cell.transform, false);
            var iconRect = icon.GetComponent<RectTransform>();
            iconRect.anchorMin = new Vector2(0.5f, 0.5f);
            iconRect.anchorMax = new Vector2(0.5f, 0.5f);
            iconRect.pivot = new Vector2(0.5f, 0.5f);
            iconRect.sizeDelta = new Vector2(56, 56);
            iconRect.anchoredPosition = includeLabel ? new Vector2(0, 12) : Vector2.zero;
            TryAddComponent(icon, "CanvasRenderer");
            var iconImage = icon.AddComponent(imageType);
            SetObjectMember(iconImage, "color", new Color(1f, 1f, 1f, sprite != null ? 1f : 0.35f));
            if (sprite != null)
            {
                SetObjectMember(iconImage, "sprite", sprite);
            }

            if (includeLabel)
            {
                var textType = TryFindComponentType("Text");
                if (textType != null)
                {
                    var label = new GameObject("Label", typeof(RectTransform));
                    label.transform.SetParent(cell.transform, false);
                    var labelRect = label.GetComponent<RectTransform>();
                    labelRect.anchorMin = new Vector2(0, 0);
                    labelRect.anchorMax = new Vector2(1, 0);
                    labelRect.pivot = new Vector2(0.5f, 0);
                    labelRect.sizeDelta = new Vector2(0, 24);
                    labelRect.anchoredPosition = Vector2.zero;
                    TryAddComponent(label, "CanvasRenderer");
                    var text = label.AddComponent(textType);
                    SetObjectMember(text, "text", index.ToString());
                    SetObjectMember(text, "alignment", "MiddleCenter");
                    SetObjectMember(text, "color", Color.white);
                    SetObjectMember(text, "fontSize", 12);
                    SetObjectMember(text, "font", Resources.GetBuiltinResource<Font>("Arial.ttf"));
                }
            }

            return cell;
        }

        private static Vector2 ToVector2(JObject value, Vector2 fallback)
        {
            if (value == null)
            {
                return fallback;
            }
            return new Vector2(value.Value<float?>("x") ?? fallback.x, value.Value<float?>("y") ?? fallback.y);
        }

        private static Component TryAddComponent(GameObject gameObject, string componentType)
        {
            var type = TryFindComponentType(componentType);
            if (type == null)
            {
                return null;
            }
            var existing = gameObject.GetComponent(type);
            if (existing != null)
            {
                return existing;
            }
            return Undo.AddComponent(gameObject, type);
        }

        private static void SetObjectMember(object target, string memberName, object value)
        {
            var type = target.GetType();
            var property = type.GetProperty(memberName, BindingFlags.Instance | BindingFlags.Public);
            if (property != null && property.CanWrite)
            {
                property.SetValue(target, ConvertObjectValue(value, property.PropertyType), null);
                return;
            }

            var field = type.GetField(memberName, BindingFlags.Instance | BindingFlags.Public);
            if (field != null)
            {
                field.SetValue(target, ConvertObjectValue(value, field.FieldType));
                return;
            }

            throw new ArgumentException("Writable member not found: " + type.FullName + "." + memberName);
        }

        private static object ConvertObjectValue(object value, Type targetType)
        {
            if (value == null)
            {
                return null;
            }
            var nullableType = Nullable.GetUnderlyingType(targetType);
            if (nullableType != null)
            {
                targetType = nullableType;
            }
            if (targetType.IsInstanceOfType(value))
            {
                return value;
            }
            if (targetType.IsEnum)
            {
                return Enum.Parse(targetType, value.ToString(), true);
            }
            return Convert.ChangeType(value, targetType);
        }

        private static JObject DescribeAnimatorController(AnimatorController controller)
        {
            var parameters = new JArray();
            foreach (var parameter in controller.parameters)
            {
                parameters.Add(new JObject
                {
                    ["name"] = parameter.name,
                    ["type"] = parameter.type.ToString()
                });
            }

            var layers = new JArray();
            foreach (var layer in controller.layers)
            {
                var states = new JArray();
                foreach (var childState in layer.stateMachine.states)
                {
                    states.Add(new JObject
                    {
                        ["name"] = childState.state.name,
                        ["motion"] = childState.state.motion != null ? childState.state.motion.name : null,
                        ["motionPath"] = childState.state.motion != null ? AssetDatabase.GetAssetPath(childState.state.motion) : null,
                        ["isDefault"] = layer.stateMachine.defaultState == childState.state
                    });
                }

                layers.Add(new JObject
                {
                    ["name"] = layer.name,
                    ["stateCount"] = states.Count,
                    ["states"] = states
                });
            }

            return new JObject
            {
                ["ok"] = true,
                ["path"] = AssetDatabase.GetAssetPath(controller),
                ["name"] = controller.name,
                ["parameters"] = parameters,
                ["layers"] = layers
            };
        }

        private static string BridgeStatus()
        {
            if (!running)
            {
                return SessionState.GetBool(ServerPreferenceKey, false) ? "reconnecting" : "stopped";
            }
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                return "busy";
            }
            if (EditorApplication.isPlayingOrWillChangePlaymode && !EditorApplication.isPlaying)
            {
                return "transitioning";
            }
            return "running";
        }

        private static string RequireString(JObject parameters, string name)
        {
            var value = parameters.Value<string>(name);
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException(name + " is required.");
            }
            return value;
        }

        private static Component FindInputTestBridgeComponent(string targetPath, string componentType, bool throwIfMissing)
        {
            if (!string.IsNullOrWhiteSpace(targetPath))
            {
                return RequireComponent(targetPath, componentType);
            }

            var type = TryFindComponentType(componentType);
            if (type == null)
            {
                if (throwIfMissing)
                {
                    throw new ArgumentException("Component type not found: " + componentType);
                }
                return null;
            }

            var component = Resources.FindObjectsOfTypeAll(type)
                .OfType<Component>()
                .FirstOrDefault(item => item != null && item.gameObject.scene.IsValid());
            if (component == null && throwIfMissing)
            {
                throw new InvalidOperationException("Component " + componentType + " was not found in the active Unity project.");
            }
            return component;
        }

        private static Type TryFindComponentType(string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
            {
                return null;
            }

            var type = Type.GetType(typeName);
            if (IsInputTestBridgeTypeName(typeName) && (type == null || !HasInputTestBridgeApi(type)))
            {
                type = TypeCache.GetTypesDerivedFrom<Component>()
                    .Where(candidate => candidate.FullName == typeName || candidate.Name == typeName)
                    .Where(IsRuntimeSceneComponentType)
                    .FirstOrDefault(HasInputTestBridgeApi);
            }
            if (type == null)
            {
                type = TypeCache.GetTypesDerivedFrom<Component>()
                    .Where(IsRuntimeSceneComponentType)
                    .FirstOrDefault(candidate => candidate.FullName == typeName || candidate.Name == typeName);
            }
            return type != null && typeof(Component).IsAssignableFrom(type) ? type : null;
        }

        private static bool IsRuntimeSceneComponentType(Type type)
        {
            if (type == null)
            {
                return false;
            }
            return !type.Assembly.GetName().Name.EndsWith("-Editor", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsInputTestBridgeTypeName(string typeName)
        {
            return typeName == "AInvilInputTestBridge"
                || typeName == "Codex.UnityBridge.AInvilInputTestBridge"
                || typeName == "AInvilRuntimeInputTestBridge"
                || typeName == "Codex.UnityBridge.AInvilRuntimeInputTestBridge";
        }

        private static bool HasInputTestBridgeApi(Type type)
        {
            return type != null
                && type.GetMethod("GetInputDebugState", BindingFlags.Instance | BindingFlags.Public) != null
                && type.GetMethod("PressKey", BindingFlags.Instance | BindingFlags.Public) != null
                && type.GetMethod("ReleaseKey", BindingFlags.Instance | BindingFlags.Public) != null
                && type.GetMethod("ClearInputTrace", BindingFlags.Instance | BindingFlags.Public) != null;
        }

        private static bool MethodNameAllowedForDebug(string methodName, JArray allowedPrefixes)
        {
            if (string.IsNullOrWhiteSpace(methodName))
            {
                return false;
            }
            var prefixes = allowedPrefixes != null && allowedPrefixes.Count > 0
                ? allowedPrefixes.Values<string>().Where(value => !string.IsNullOrWhiteSpace(value)).ToArray()
                : new[] { "Get", "Reset", "Set", "Simulate", "Validate", "Debug" };
            return prefixes.Any(prefix => methodName.StartsWith(prefix, StringComparison.Ordinal));
        }

        private static bool? ReadBoolProperty(Component component, string propertyName)
        {
            var property = component.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public);
            if (property != null && property.PropertyType == typeof(bool))
            {
                return (bool)property.GetValue(component, null);
            }
            var field = component.GetType().GetField(propertyName, BindingFlags.Instance | BindingFlags.Public);
            if (field != null && field.FieldType == typeof(bool))
            {
                return (bool)field.GetValue(component);
            }
            return null;
        }

        private static int? ReadPersistentListenerCount(object unityEvent)
        {
            if (unityEvent == null)
            {
                return null;
            }
            var method = unityEvent.GetType().GetMethod("GetPersistentEventCount", BindingFlags.Instance | BindingFlags.Public, null, Type.EmptyTypes, null);
            if (method == null)
            {
                return null;
            }
            try
            {
                return Convert.ToInt32(method.Invoke(unityEvent, null));
            }
            catch
            {
                return null;
            }
        }

        private static Component FindComponentByName(GameObject gameObject, string componentType)
        {
            if (gameObject == null || string.IsNullOrWhiteSpace(componentType))
            {
                return null;
            }
            var exactType = TryFindComponentType(componentType);
            if (exactType != null)
            {
                var exactComponent = gameObject.GetComponent(exactType);
                if (exactComponent != null)
                {
                    return exactComponent;
                }
            }
            return gameObject.GetComponents<Component>()
                .FirstOrDefault(component => component != null && (component.GetType().FullName == componentType || component.GetType().Name == componentType));
        }

        private static Component FindTextComponent(GameObject gameObject, string componentType)
        {
            if (gameObject == null)
            {
                return null;
            }
            if (!string.IsNullOrWhiteSpace(componentType) && componentType != "auto")
            {
                var requested = FindComponentByName(gameObject, componentType);
                return requested != null && ReadTextFromComponent(requested) != null ? requested : null;
            }
            foreach (var preferredType in new[] { "UnityEngine.UI.Text", "TMPro.TMP_Text" })
            {
                var component = FindComponentByName(gameObject, preferredType);
                if (component != null && ReadTextFromComponent(component) != null)
                {
                    return component;
                }
            }
            return gameObject.GetComponents<Component>()
                .FirstOrDefault(component => component != null && ReadTextFromComponent(component) != null);
        }

        private static string ReadTextFromComponent(Component component)
        {
            if (component == null)
            {
                return null;
            }
            var property = component.GetType().GetProperty("text", BindingFlags.Instance | BindingFlags.Public);
            if (property != null && property.CanRead)
            {
                return property.GetValue(component, null)?.ToString();
            }
            var field = component.GetType().GetField("text", BindingFlags.Instance | BindingFlags.Public);
            return field?.GetValue(component)?.ToString();
        }

        private static Component FindDebugStateComponent(GameObject gameObject, string methodName)
        {
            return gameObject.GetComponents<Component>()
                .FirstOrDefault(component => component != null && FindDebugStateMethod(component, methodName) != null);
        }

        private static MethodInfo FindDebugStateMethod(Component component, string requestedMethodName)
        {
            if (component == null)
            {
                return null;
            }
            var candidates = string.IsNullOrWhiteSpace(requestedMethodName)
                ? new[] { "GetDebugStateJson", "GetDebugState", "GetInputDebugState" }
                : new[] { requestedMethodName };
            return candidates
                .Select(name => component.GetType().GetMethod(name, BindingFlags.Instance | BindingFlags.Public, null, Type.EmptyTypes, null))
                .FirstOrDefault(method => method != null);
        }

        private static JToken DebugStateToJson(object rawResult, string format, out string raw)
        {
            raw = rawResult as string;
            if (rawResult == null)
            {
                return JValue.CreateNull();
            }
            if (format == "string")
            {
                raw = rawResult.ToString();
                return new JValue(raw);
            }
            if (rawResult is string text)
            {
                raw = text;
                if (format == "json")
                {
                    try
                    {
                        return string.IsNullOrWhiteSpace(text) ? JValue.CreateNull() : JToken.Parse(text);
                    }
                    catch (JsonException ex)
                    {
                        throw new InvalidOperationException("DebugStateParseFailed: " + ex.Message);
                    }
                }
                return new JValue(text);
            }
            return MethodResultToJson(rawResult);
        }

        private static object InvokePublicComponentMethod(Component component, string methodName, JArray args)
        {
            var methods = component.GetType()
                .GetMethods(BindingFlags.Instance | BindingFlags.Public)
                .Where(method => method.Name == methodName && method.GetParameters().Length == args.Count)
                .ToArray();

            foreach (var method in methods)
            {
                try
                {
                    return method.Invoke(component, ConvertMethodArgs(method, args));
                }
                catch (Exception ex) when (ex is ArgumentException || ex is JsonException || ex is FormatException || ex is InvalidCastException)
                {
                    // Try the next overload.
                }
            }

            throw new InvalidOperationException("No compatible public method found: " + component.GetType().FullName + "." + methodName + " with " + args.Count + " argument(s).");
        }

        private static void OnLogMessageReceived(string condition, string stackTrace, LogType type)
        {
            var level = type == LogType.Warning ? "warning" : type == LogType.Log ? "log" : "error";
            lock (ConsoleLock)
            {
                ConsoleEntries.Add(new ConsoleEntry
                {
                    Time = DateTimeOffset.Now.ToString("o"),
                    Level = level,
                    Type = type.ToString(),
                    Message = condition,
                    StackTrace = stackTrace
                });

                if (ConsoleEntries.Count > 1000)
                {
                    ConsoleEntries.RemoveRange(0, ConsoleEntries.Count - 1000);
                }
            }
        }

        private static GameObject RequireGameObject(string path)
        {
            var gameObject = FindGameObjectByPath(path);
            if (gameObject == null)
            {
                throw new ArgumentException("GameObject not found: " + path);
            }
            return gameObject;
        }

        private static GameObject FindGameObjectByPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return null;
            }

            if (int.TryParse(path, out var instanceId))
            {
                return ObjectFromId(instanceId) as GameObject;
            }

            var parts = path.Trim('/').Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0)
            {
                return null;
            }

            var current = SceneManager.GetActiveScene().GetRootGameObjects().FirstOrDefault(go => go.name == parts[0]);
            for (var i = 1; current != null && i < parts.Length; i++)
            {
                current = current.transform.Cast<Transform>().FirstOrDefault(child => child.name == parts[i])?.gameObject;
            }

            return current;
        }

        private static Component RequireComponent(string gameObjectPath, string componentType)
        {
            var gameObject = RequireGameObject(gameObjectPath);
            var type = RequireComponentType(componentType);
            var component = gameObject.GetComponent(type);
            if (component == null)
            {
                throw new ArgumentException("Component " + componentType + " not found on " + gameObjectPath);
            }
            return component;
        }

        private static Type RequireComponentType(string typeName)
        {
            if (string.IsNullOrWhiteSpace(typeName))
            {
                throw new ArgumentException("componentType is required.");
            }

            var type = Type.GetType(typeName);
            if (type == null)
            {
                type = TypeCache.GetTypesDerivedFrom<Component>()
                    .FirstOrDefault(candidate => candidate.FullName == typeName || candidate.Name == typeName);
            }

            if (type == null || !typeof(Component).IsAssignableFrom(type))
            {
                throw new ArgumentException("Component type not found: " + typeName);
            }

            return type;
        }

        private static string GetPath(GameObject gameObject)
        {
            var names = new Stack<string>();
            var current = gameObject.transform;
            while (current != null)
            {
                names.Push(current.name);
                current = current.parent;
            }
            return "/" + string.Join("/", names);
        }

        private static JArray DescribeSerializedFields(Object target)
        {
            var fields = new JArray();
            var serializedObject = new SerializedObject(target);
            var iterator = serializedObject.GetIterator();
            var enterChildren = true;
            while (iterator.NextVisible(enterChildren))
            {
                enterChildren = false;
                fields.Add(new JObject
                {
                    ["name"] = iterator.name,
                    ["displayName"] = iterator.displayName,
                    ["propertyPath"] = iterator.propertyPath,
                    ["type"] = iterator.propertyType.ToString(),
                    ["value"] = SerializedPropertyValue(iterator)
                });
            }
            return fields;
        }

        private static JToken SerializedPropertyValue(SerializedProperty property)
        {
            switch (property.propertyType)
            {
                case SerializedPropertyType.Integer:
                    return property.intValue;
                case SerializedPropertyType.Boolean:
                    return property.boolValue;
                case SerializedPropertyType.Float:
                    return property.floatValue;
                case SerializedPropertyType.String:
                    return property.stringValue;
                case SerializedPropertyType.Color:
                    return ToJson(property.colorValue);
                case SerializedPropertyType.ObjectReference:
                    return property.objectReferenceValue != null ? property.objectReferenceValue.name : null;
                case SerializedPropertyType.Enum:
                    return property.enumDisplayNames[property.enumValueIndex];
                case SerializedPropertyType.Vector2:
                    return new JObject { ["x"] = property.vector2Value.x, ["y"] = property.vector2Value.y };
                case SerializedPropertyType.Vector3:
                    return ToJson(property.vector3Value);
                case SerializedPropertyType.Vector4:
                    return new JObject { ["x"] = property.vector4Value.x, ["y"] = property.vector4Value.y, ["z"] = property.vector4Value.z, ["w"] = property.vector4Value.w };
                default:
                    return property.hasVisibleChildren ? "<complex>" : null;
            }
        }

        private static void SetSerializedProperty(SerializedProperty property, JToken value)
        {
            switch (property.propertyType)
            {
                case SerializedPropertyType.Integer:
                    property.intValue = value.Value<int>();
                    break;
                case SerializedPropertyType.Boolean:
                    property.boolValue = value.Value<bool>();
                    break;
                case SerializedPropertyType.Float:
                    property.floatValue = value.Value<float>();
                    break;
                case SerializedPropertyType.String:
                    property.stringValue = value.Value<string>();
                    break;
                case SerializedPropertyType.Color:
                    property.colorValue = value.ToObject<Color>();
                    break;
                case SerializedPropertyType.Enum:
                    var enumText = value.Value<string>();
                    var enumIndex = Array.IndexOf(property.enumDisplayNames, enumText);
                    if (enumIndex < 0 && int.TryParse(enumText, out var parsedIndex))
                    {
                        enumIndex = parsedIndex;
                    }
                    if (enumIndex < 0)
                    {
                        throw new ArgumentException("Enum value not found: " + enumText);
                    }
                    property.enumValueIndex = enumIndex;
                    break;
                case SerializedPropertyType.Vector2:
                    property.vector2Value = value.ToObject<Vector2>();
                    break;
                case SerializedPropertyType.Vector3:
                    property.vector3Value = value.ToObject<Vector3>();
                    break;
                case SerializedPropertyType.Vector4:
                    property.vector4Value = value.ToObject<Vector4>();
                    break;
                default:
                    throw new ArgumentException("Unsupported serialized property type: " + property.propertyType);
            }
        }

        private static bool TrySetTransformShortcut(Component component, string propertyName, JToken value)
        {
            var transform = component as Transform;
            if (transform == null)
            {
                return false;
            }

            switch (propertyName)
            {
                case "position":
                case "localPosition":
                    transform.localPosition = value.ToObject<Vector3>();
                    return true;
                case "rotation":
                case "localEulerAngles":
                    transform.localEulerAngles = value.ToObject<Vector3>();
                    return true;
                case "scale":
                case "localScale":
                    transform.localScale = value.ToObject<Vector3>();
                    return true;
                default:
                    return false;
            }
        }

        private static object ConvertToken(JToken value, Type targetType)
        {
            if (value == null || value.Type == JTokenType.Null)
            {
                if (targetType.IsValueType && Nullable.GetUnderlyingType(targetType) == null)
                {
                    throw new ArgumentException("Cannot assign null to value type " + targetType.Name + ".");
                }
                return null;
            }
            var nullableType = Nullable.GetUnderlyingType(targetType);
            if (nullableType != null)
            {
                targetType = nullableType;
            }
            if (targetType.IsEnum)
            {
                return Enum.Parse(targetType, value.Value<string>());
            }
            return value.ToObject(targetType);
        }

        private static object[] ConvertMethodArgs(MethodInfo method, JArray args)
        {
            var parameters = method.GetParameters();
            if (parameters.Length != args.Count)
            {
                throw new ArgumentException("Argument count mismatch.");
            }

            var convertedArgs = new object[parameters.Length];
            for (var i = 0; i < parameters.Length; i++)
            {
                convertedArgs[i] = ConvertToken(args[i], parameters[i].ParameterType);
            }
            return convertedArgs;
        }

        private static JToken MethodResultToJson(object result)
        {
            if (result == null)
            {
                return JValue.CreateNull();
            }
            if (result is Object unityObject)
            {
                return DescribeObject(unityObject);
            }
            var type = result.GetType();
            if (type.IsPrimitive || result is string || result is decimal)
            {
                return JToken.FromObject(result);
            }
            if (type.IsEnum)
            {
                return new JValue(result.ToString());
            }
            return JToken.FromObject(result);
        }

        private static Event CreateKeyEvent(EventType eventType, KeyCode keyCode, EventModifiers modifiers)
        {
            return new Event
            {
                type = eventType,
                keyCode = keyCode,
                modifiers = modifiers,
                character = KeyCodeToCharacter(keyCode, modifiers)
            };
        }

        private static KeyCode ParseKeyCode(string key)
        {
            var normalized = key.Trim();
            switch (normalized.ToLowerInvariant())
            {
                case "esc":
                    return KeyCode.Escape;
                case "enter":
                    return KeyCode.Return;
                case "return":
                    return KeyCode.Return;
                case "spacebar":
                    return KeyCode.Space;
                case "space":
                    return KeyCode.Space;
                case "left":
                    return KeyCode.LeftArrow;
                case "right":
                    return KeyCode.RightArrow;
                case "up":
                    return KeyCode.UpArrow;
                case "down":
                    return KeyCode.DownArrow;
                case "0":
                    return KeyCode.Alpha0;
                case "1":
                    return KeyCode.Alpha1;
                case "2":
                    return KeyCode.Alpha2;
                case "3":
                    return KeyCode.Alpha3;
                case "4":
                    return KeyCode.Alpha4;
                case "5":
                    return KeyCode.Alpha5;
                case "6":
                    return KeyCode.Alpha6;
                case "7":
                    return KeyCode.Alpha7;
                case "8":
                    return KeyCode.Alpha8;
                case "9":
                    return KeyCode.Alpha9;
                default:
                    return (KeyCode)Enum.Parse(typeof(KeyCode), normalized, true);
            }
        }

        private static EventModifiers ParseEventModifiers(JArray modifiers)
        {
            var result = EventModifiers.None;
            if (modifiers == null)
            {
                return result;
            }
            foreach (var modifier in modifiers.Values<string>())
            {
                if (string.IsNullOrWhiteSpace(modifier))
                {
                    continue;
                }
                result |= (EventModifiers)Enum.Parse(typeof(EventModifiers), modifier, true);
            }
            return result;
        }

        private static char KeyCodeToCharacter(KeyCode keyCode, EventModifiers modifiers)
        {
            if (keyCode >= KeyCode.A && keyCode <= KeyCode.Z)
            {
                var offset = (int)keyCode - (int)KeyCode.A;
                var character = (char)('a' + offset);
                return (modifiers & EventModifiers.Shift) != 0 ? char.ToUpperInvariant(character) : character;
            }
            if (keyCode >= KeyCode.Alpha0 && keyCode <= KeyCode.Alpha9)
            {
                return (char)('0' + ((int)keyCode - (int)KeyCode.Alpha0));
            }
            if (keyCode == KeyCode.Space)
            {
                return ' ';
            }
            if (keyCode == KeyCode.Return)
            {
                return '\n';
            }
            return '\0';
        }

        private static EditorWindow FocusGameView()
        {
            var gameViewType = Type.GetType("UnityEditor.GameView,UnityEditor.dll") ?? Type.GetType("UnityEditor.GameView,UnityEditor");
            if (gameViewType == null)
            {
                throw new InvalidOperationException("UnityEditor.GameView type was not found.");
            }
            var window = EditorWindow.GetWindow(gameViewType);
            window.Focus();
            return window;
        }

        private static void SetTransformValues(Transform transform, JObject parameters)
        {
            if (parameters["position"] != null)
            {
                transform.localPosition = parameters["position"].ToObject<Vector3>();
            }
            if (parameters["rotation"] != null)
            {
                transform.localEulerAngles = parameters["rotation"].ToObject<Vector3>();
            }
            if (parameters["scale"] != null)
            {
                transform.localScale = parameters["scale"].ToObject<Vector3>();
            }
        }

        private static JObject ToJson(Vector3 vector)
        {
            return new JObject { ["x"] = vector.x, ["y"] = vector.y, ["z"] = vector.z };
        }

        private static JObject ToJson(Color color)
        {
            return new JObject { ["r"] = color.r, ["g"] = color.g, ["b"] = color.b, ["a"] = color.a };
        }

        private static void WriteJson(HttpListenerContext context, int statusCode, JObject payload)
        {
            var json = JsonConvert.SerializeObject(payload);
            var bytes = Encoding.UTF8.GetBytes(json);
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.Close();
        }

        private static void EditorSceneManagerMarkDirty()
        {
            UnityEditor.SceneManagement.EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());
        }

        private static int GetObjectId(Object unityObject)
        {
#if UNITY_6000_0_OR_NEWER
            return unchecked((int)EntityId.ToULong(unityObject.GetEntityId()));
#else
            return unityObject.GetInstanceID();
#endif
        }

        private static Object ObjectFromId(int id)
        {
#if UNITY_6000_0_OR_NEWER
            return EditorUtility.EntityIdToObject(EntityId.FromULong(unchecked((ulong)(uint)id)));
#else
            return EditorUtility.InstanceIDToObject(id);
#endif
        }

        private class ConsoleEntry
        {
            public string Time;
            public string Level;
            public string Type;
            public string Message;
            public string StackTrace;
        }
    }
}
