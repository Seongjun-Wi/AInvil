using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

namespace Codex.UnityBridge
{
    /// <summary>
    /// Runtime-safe input validation bridge with a unique type name to avoid
    /// collisions with project-specific Editor-only AInvilInputTestBridge helpers.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class AInvilRuntimeInputTestBridge : MonoBehaviour
    {
        [Serializable]
        public sealed class StringEvent : UnityEvent<string>
        {
        }

        [Serializable]
        public sealed class SetupHookEvent : UnityEvent<string, string>
        {
        }

        [SerializeField] private bool acceptCommandsOutsidePlayMode;
        [SerializeField] private StringEvent onPressKey = new StringEvent();
        [SerializeField] private StringEvent onReleaseKey = new StringEvent();
        [SerializeField] private StringEvent onClickUiPath = new StringEvent();
        [SerializeField] private SetupHookEvent onSetupHook = new SetupHookEvent();

        private readonly List<InputTraceEntry> trace = new List<InputTraceEntry>();

        public object GetInputDebugState()
        {
            return new InputDebugState
            {
                ok = true,
                isPlaying = Application.isPlaying,
                acceptCommandsOutsidePlayMode = acceptCommandsOutsidePlayMode,
                traceCount = trace.Count,
                lastTrace = trace.Count > 0 ? trace[trace.Count - 1] : null
            };
        }

        public object PressKey(string key)
        {
            EnsureCanAcceptCommand();
            AddTrace("pressKey", key);
            onPressKey.Invoke(key);
            return Result("pressKey", key, true);
        }

        public object ReleaseKey(string key)
        {
            EnsureCanAcceptCommand();
            AddTrace("releaseKey", key);
            onReleaseKey.Invoke(key);
            return Result("releaseKey", key, true);
        }

        public object ClickUiPath(string path)
        {
            EnsureCanAcceptCommand();
            AddTrace("clickUiPath", path);
            onClickUiPath.Invoke(path);
            return Result("clickUiPath", path, true);
        }

        public object InvokeSetupHook(string hookId, string jsonArgs)
        {
            EnsureCanAcceptCommand();
            AddTrace("invokeSetupHook", hookId + " " + jsonArgs);
            onSetupHook.Invoke(hookId, jsonArgs);
            return Result("invokeSetupHook", hookId, true);
        }

        public void ClearInputTrace()
        {
            trace.Clear();
        }

        private void EnsureCanAcceptCommand()
        {
            if (!Application.isPlaying && !acceptCommandsOutsidePlayMode)
            {
                throw new InvalidOperationException("AInvilRuntimeInputTestBridge only accepts commands in Play Mode unless acceptCommandsOutsidePlayMode is enabled.");
            }
        }

        private void AddTrace(string action, string value)
        {
            trace.Add(new InputTraceEntry
            {
                action = action,
                value = value,
                frame = Time.frameCount,
                time = Time.realtimeSinceStartup
            });
        }

        private object Result(string action, string value, bool received)
        {
            return new InputCommandResult
            {
                ok = true,
                action = action,
                value = value,
                received = received,
                frame = Time.frameCount,
                traceCount = trace.Count
            };
        }

        [Serializable]
        public sealed class InputDebugState
        {
            public bool ok;
            public bool isPlaying;
            public bool acceptCommandsOutsidePlayMode;
            public int traceCount;
            public InputTraceEntry lastTrace;
        }

        [Serializable]
        public sealed class InputCommandResult
        {
            public bool ok;
            public string action;
            public string value;
            public bool received;
            public int frame;
            public int traceCount;
        }

        [Serializable]
        public sealed class InputTraceEntry
        {
            public string action;
            public string value;
            public int frame;
            public float time;
        }
    }
}
