import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");

const DEFAULT_UNITY_URL = "http://127.0.0.1:17777/rpc";
const unityUrl = process.env.UNITY_BRIDGE_URL || DEFAULT_UNITY_URL;
const healthUrl = process.env.UNITY_HEALTH_URL || unityUrl.replace(/\/rpc$/, "/health");
const inputBridgeTarget = {
  targetPath: "/Debug/AInvilInputTestBridge",
  componentType: "Codex.UnityBridge.AInvilRuntimeInputTestBridge"
};

const options = parseArgs(process.argv.slice(2));
const startedAt = new Date().toISOString();

const scenarios = await loadScenarios(options.scenario, { includeExamples: options.includeExamples });
const report = {
  schemaVersion: "1.0.0",
  runner: "AInvil Live Harness",
  mode: options.mode,
  unityUrl,
  healthUrl,
  startedAt,
  finishedAt: null,
  summary: {
    total: scenarios.length,
    passed: 0,
    failed: 0,
    blocked: 0,
    warning: 0
  },
  scenarios: []
};

for (const scenario of scenarios) {
  const result = await runScenario(scenario);
  report.scenarios.push(result);
  report.summary[result.status.toLowerCase()]++;
}

report.finishedAt = new Date().toISOString();

if (options.report) {
  const reportPath = path.resolve(pluginRoot, options.report);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

const evidenceOutputPath = options.evidenceOut || (scenarios.length === 1 ? scenarios[0].evidenceOutputPath : null);
if (evidenceOutputPath) {
  await writeEvidence(report, evidenceOutputPath);
}

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printHumanReport(report);
}

if (report.summary.failed > 0 && !options.allowFailures) {
  process.exit(1);
}

async function runScenario(scenario) {
  const checks = [];
  const unityTargets = [];
  const validationResults = [];
  const validationDesigns = await loadValidationDesignsForScenario(scenario);
  let status = "Passed";

  const health = await getHealth();
  checks.push(health);
  if (!health.ok) {
    return scenarioResult("Blocked", scenario, checks, unityTargets, [
      "Unity Bridge is not reachable. Review bridgeDiagnostics in the evidence/report, open Unity, install the canonical bridge package, and start Tools > Codex Unity Bridge > Start Server."
    ]);
  }

  const bridgeStatus = await callUnityCheck("unity_get_status", {});
  checks.push(bridgeStatus);
  if (!bridgeStatus.ok) {
    return scenarioResult("Blocked", scenario, checks, unityTargets, [
      "Unity Bridge health endpoint responded, but unity_get_status failed."
    ]);
  }

  if (scenario.id === "dungeon_recovery_first_playable_e2e") {
    return await runDungeonRecoveryFirstPlayableScenario(scenario, checks, unityTargets);
  }

  if (options.prepareSample) {
    checks.push(...(await prepareSampleScenario(scenario)));
  }

  checks.push(await callUnityCheck("unity_compile_status", {}));
  checks.push(await callUnityCheck("unity_get_console_logs", { level: "error", limit: 25 }));

  const hierarchyCheck = await callUnityCheck("unity_get_hierarchy", { includeInactive: true });
  checks.push(hierarchyCheck);

  if (scenario.id === "ainvil_bridge_smoke_operational") {
    checks.push(await callUnityCheck("unity_probe_validation_observation", {
      observation: {
        name: "activeSceneLoaded",
        type: "activeScene",
        field: "isLoaded"
      }
    }));
  }

  const artifactChecks = await inspectScenarioArtifacts(scenario);
  checks.push(...artifactChecks);
  unityTargets.push(...artifactChecks.map((check) => check.target).filter(Boolean));

  if (!scenario.interactive && validationDesigns.length > 0) {
    for (const validationDesign of validationDesigns) {
      const validationCheck = await runValidationDesign(validationDesign);
      checks.push(validationCheck);
      validationResults.push(validationCheck.validationResult);
    }
  }

  if (scenario.interactive) {
    if (options.mode === "apply") {
      if (validationDesigns.length > 0) {
        for (const validationDesign of validationDesigns) {
          const validationCheck = await runValidationDesign(validationDesign);
          checks.push(validationCheck);
          validationResults.push(validationCheck.validationResult);
        }
      } else {
        checks.push(await runInteractiveApplyChecks());
      }
    } else {
      checks.push({
        id: "live.interactive.apply_skipped",
        type: "PlayMode",
        target: scenario.id,
        status: "Warning",
        failureClass: "ValidationNotRun",
        message: "Interactive Play Mode checks require --mode apply."
      });
    }
  }

  const failed = checks.filter((check) => check.status === "Failed");
  const blocked = checks.filter((check) => check.status === "Blocked");
  const warnings = checks.filter((check) => check.status === "Warning");

  if (failed.length > 0) {
    status = "Failed";
  } else if (blocked.length > 0) {
    status = "Blocked";
  } else if (warnings.length > 0) {
    status = "Warning";
  }

  return scenarioResult(status, scenario, checks, unityTargets, nextActionsFor(status, scenario), validationResults);
}

async function runDungeonRecoveryFirstPlayableScenario(scenario, checks, unityTargets) {
  const productMvp = {
    category: scenario.category || "ProductMvp",
    validationType: scenario.validationType || "UnityFeatureE2E",
    unityProjectPath: null,
    generatedAssets: [
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_FirstRecoveryJob.unity",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryTarget.cs",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryUiView.cs",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilDungeonRecoveryGameController.cs",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilRecoveryPlayerController.cs",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scripts/AInvilDungeonRecoveryFirstPlayableBuilder.cs",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials/AInvilRecoveryPending.mat",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials/AInvilRecoveryRecovered.mat",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials/AInvilRecoveryPlayer.mat",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials/AInvilRecoveryFloor.mat",
      "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Materials/AInvilRecoveryWall.mat"
    ],
    dryRunReport: "reports/dungeon_recovery_first_playable_dry_run.json",
    compileStatus: null,
    consoleErrorCount: null,
    playModeStatus: null,
    totalRecoveryTargetCount: null,
    initialRecoveredCount: null,
    afterFirstRecoveryCount: null,
    afterThirdRecoveryCount: null,
    isJobComplete: null,
    progressText: null,
    validationHookUsed: "AInvilDungeonRecoveryGameController.ValidationRecoverNextTarget",
    staleEvidenceReused: false
  };

  const statusCheck = checks.find((check) => check.id === "bridge.unity_get_status");
  productMvp.unityProjectPath = statusCheck?.data?.projectPath || statusCheck?.data?.project?.path || null;

  checks.push(await callUnityCheck("unity_clear_console", {}));
  const initialCompile = await waitForCompileStatus("before_product_mvp_scene_build");
  checks.push(initialCompile);
  productMvp.compileStatus = compileStatusForEvidence(initialCompile);
  if (!initialCompile.ok || compileHasErrors(initialCompile)) {
    return scenarioResult("Blocked", scenario, checks, unityTargets, [
      "Resolve Unity compile errors before generating or validating the Product MVP first playable scene."
    ], [], productMvp);
  }

  const builderTarget = await ensureProductMvpBuilderTarget(checks);
  checks.push(await callUnityCheck("unity_invoke_component_method", {
    targetPath: builderTarget,
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryFirstPlayableBuilder",
    methodName: "BuildFirstPlayableScene",
    args: [],
    requirePlaying: false,
    debugOnly: false
  }));

  const openScene = await callUnityCheck("unity_open_scene", {
    scenePath: "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_FirstRecoveryJob.unity",
    saveCurrentIfDirty: true,
    dirtyScenePolicy: "save"
  });
  checks.push(openScene);

  const postBuildCompile = await waitForCompileStatus("after_product_mvp_scene_build");
  checks.push(postBuildCompile);
  productMvp.compileStatus = compileStatusForEvidence(postBuildCompile);

  const consoleBefore = await callUnityCheck("unity_get_console_logs", { level: "error", limit: 50 });
  checks.push(consoleBefore);
  productMvp.consoleErrorCount = consoleErrorCount(consoleBefore);
  checks.push(await callUnityCheck("unity_clear_console", {}));

  const artifactChecks = await inspectScenarioArtifacts(scenario);
  checks.push(...artifactChecks);
  unityTargets.push(...artifactChecks.map((check) => check.target).filter(Boolean));

  if (!openScene.ok || !postBuildCompile.ok || compileHasErrors(postBuildCompile) || productMvp.consoleErrorCount > 0) {
    return scenarioResult("Blocked", scenario, checks, unityTargets, [
      "Fix generated scene, compile, or console errors, then rerun the Product MVP live harness."
    ], [], productMvp);
  }

  const enterPlay = await callUnityCheck("unity_enter_play_mode", {});
  checks.push(enterPlay);
  productMvp.playModeStatus = { entered: enterPlay.status, exited: "NotRun" };
  if (!enterPlay.ok) {
    return scenarioResult("Blocked", scenario, checks, unityTargets, [
      "Unity could not enter Play Mode for Product MVP validation."
    ], [], productMvp);
  }

  await sleep(options.playModeWaitMs);
  checks.push(await waitForUnityBridge("product_mvp_play_mode_enter"));

  const resetCheck = await invokeProductController("ResetValidationState");
  checks.push(resetCheck);
  const initialStateCheck = await invokeProductController("GetValidationStateJson");
  checks.push(initialStateCheck);
  const initialState = parseInvocationJson(initialStateCheck);
  productMvp.totalRecoveryTargetCount = initialState?.totalRecoveryTargetCount ?? null;
  productMvp.initialRecoveredCount = initialState?.recoveredCount ?? null;

  const firstRecovery = await invokeProductController("ValidationRecoverNextTarget");
  checks.push(firstRecovery);
  const afterFirstCheck = await invokeProductController("GetValidationStateJson");
  checks.push(afterFirstCheck);
  const afterFirst = parseInvocationJson(afterFirstCheck);
  productMvp.afterFirstRecoveryCount = afterFirst?.recoveredCount ?? null;

  checks.push(await invokeProductController("ValidationRecoverNextTarget"));
  checks.push(await invokeProductController("ValidationRecoverNextTarget"));
  const afterThirdCheck = await invokeProductController("GetValidationStateJson");
  checks.push(afterThirdCheck);
  const afterThird = parseInvocationJson(afterThirdCheck);
  productMvp.afterThirdRecoveryCount = afterThird?.recoveredCount ?? null;
  productMvp.isJobComplete = afterThird?.isJobComplete ?? null;
  productMvp.progressText = afterThird?.progressText ?? null;

  const assertionCheck = productMvpAssertions(productMvp);
  checks.push(assertionCheck);

  const consoleAfter = await callUnityCheck("unity_get_console_logs", { level: "error", limit: 50 });
  if (consoleErrorCount(consoleAfter) > 0) {
    consoleAfter.status = "Failed";
    consoleAfter.ok = false;
    consoleAfter.failureClass = "ConsoleError";
    consoleAfter.message = `Unity console contains ${consoleErrorCount(consoleAfter)} error(s) after Product MVP Play Mode validation.`;
  }
  checks.push(consoleAfter);
  productMvp.consoleErrorCount = consoleErrorCount(consoleAfter);

  if (options.exitPlayMode) {
    const exitPlay = await callUnityCheck("unity_exit_play_mode", {});
    checks.push(exitPlay);
    productMvp.playModeStatus.exited = exitPlay.status;
    checks.push(await waitForUnityBridge("product_mvp_play_mode_exit"));
  }

  const failed = checks.filter((check) => check.status === "Failed");
  const blocked = checks.filter((check) => check.status === "Blocked");
  const warnings = checks.filter((check) => check.status === "Warning");
  const status = failed.length > 0 ? "Failed" : blocked.length > 0 ? "Blocked" : warnings.length > 0 ? "Warning" : "Passed";
  const validationResults = [productMvpValidationResult(status, productMvp, assertionCheck)];
  const nextActions = status === "Passed"
    ? ["Product MVP first playable evidence is Passed. Keep this as Product MVP Ready Candidate proof, not Public Release proof."]
    : ["Inspect the Product MVP evidence failureReason, fix only generated AInvil first playable assets, and rerun the scenario."];

  return scenarioResult(status, scenario, checks, unityTargets, nextActions, validationResults, productMvp);
}

async function ensureProductMvpBuilderTarget(checks) {
  const sceneVerifier = await tryUnityCheck("unity_get_game_object", {
    path: "/AInvilDungeonRecoveryFirstPlayable/BuildVerifier",
    includeSerializedFields: false
  });
  if (sceneVerifier.ok) {
    checks.push({
      ...sceneVerifier,
      id: "product_mvp.builder.scene_verifier",
      message: "Using generated scene BuildVerifier for Product MVP scene rebuild."
    });
    return "/AInvilDungeonRecoveryFirstPlayable/BuildVerifier";
  }

  const created = await ensureGameObject({ path: "/AInvilFirstPlayableBuilder", name: "AInvilFirstPlayableBuilder", primitiveType: "empty" });
  checks.push(created);
  const component = await ensureComponent({
    path: "/AInvilFirstPlayableBuilder",
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryFirstPlayableBuilder"
  });
  checks.push(component);
  return "/AInvilFirstPlayableBuilder";
}

async function waitForCompileStatus(label) {
  let lastCheck = null;
  for (let attempt = 1; attempt <= Math.max(12, options.retries); attempt++) {
    lastCheck = await callUnityCheck("unity_compile_status", {});
    lastCheck.id = `bridge.unity_compile_status.${slug(label)}`;
    if (lastCheck.ok && !compileInProgress(lastCheck)) {
      lastCheck.status = compileHasErrors(lastCheck) ? "Failed" : "Passed";
      lastCheck.failureClass = compileHasErrors(lastCheck) ? "CompileError" : "Unknown";
      lastCheck.message = compileHasErrors(lastCheck)
        ? "Unity compile status reports compile errors."
        : "Unity compile status is stable and has no compile errors.";
      return lastCheck;
    }
    await sleep(1500);
  }
  return {
    ...(lastCheck || {}),
    id: `bridge.unity_compile_status.${slug(label)}`,
    type: "Compile",
    target: "unity_compile_status",
    status: "Blocked",
    ok: false,
    failureClass: "CompileError",
    message: "Unity compile status did not become stable before timeout."
  };
}

async function invokeProductController(methodName) {
  const check = await callUnityCheck("unity_invoke_component_method", {
    targetPath: "/AInvilDungeonRecoveryFirstPlayable/GameController",
    componentType: "AInvil.DungeonRecoveryFirstPlayable.AInvilDungeonRecoveryGameController",
    methodName,
    args: [],
    requirePlaying: false,
    debugOnly: false
  });
  check.id = `product_mvp.controller.${slug(methodName)}`;
  check.type = "PlayMode";
  check.target = `AInvilDungeonRecoveryGameController.${methodName}`;
  return check;
}

function productMvpAssertions(productMvp) {
  const assertions = [
    assertion("target_count", productMvp.totalRecoveryTargetCount === 3, `Expected 3 targets, actual ${productMvp.totalRecoveryTargetCount}.`),
    assertion("initial_recovered", productMvp.initialRecoveredCount === 0, `Expected initial recovered 0, actual ${productMvp.initialRecoveredCount}.`),
    assertion("after_first_recovery", productMvp.afterFirstRecoveryCount === 1, `Expected recovered 1 after first recovery, actual ${productMvp.afterFirstRecoveryCount}.`),
    assertion("after_third_recovery", productMvp.afterThirdRecoveryCount === 3, `Expected recovered 3 after third recovery, actual ${productMvp.afterThirdRecoveryCount}.`),
    assertion("job_complete", productMvp.isJobComplete === true, `Expected job complete true, actual ${productMvp.isJobComplete}.`),
    assertion("progress_text", /Recovered:\s*3\s*\/\s*3[\s\S]*Job Complete/.test(productMvp.progressText || ""), `Expected Job Complete progress text, actual ${JSON.stringify(productMvp.progressText)}.`)
  ];
  const failed = assertions.filter((item) => item.result !== "Passed");
  return {
    id: "product_mvp.assertions",
    type: "PlayMode",
    target: "DungeonRecoveryFirstPlayable",
    status: failed.length ? "Failed" : "Passed",
    ok: failed.length === 0,
    failureClass: failed.length ? "GameLogicFailed" : "Unknown",
    message: failed.length ? `${failed.length} Product MVP assertion(s) failed.` : `${assertions.length} Product MVP assertion(s) passed.`,
    childChecks: assertions.map((item) => ({
      id: `product_mvp.assert.${item.id}`,
      type: "ValidationAssertion",
      target: item.id,
      status: item.result,
      failureClass: item.result === "Passed" ? "Unknown" : "GameLogicFailed",
      message: item.message
    })),
    assertions
  };
}

function productMvpValidationResult(status, productMvp, assertionCheck) {
  return {
    validationId: "VAL-DRC-MVP-FirstRecoveryJob-E2E",
    requirementId: "REQ-DRC-MVP-001",
    acceptanceIds: ["AC-DRC-MVP-001", "AC-DRC-MVP-002", "AC-DRC-MVP-003"],
    scenario: "dungeon_recovery_first_playable_e2e",
    result: status,
    beforeObservations: [
      {
        name: "initialRecoveredCount",
        type: "debugStateJson",
        phase: "before",
        value: productMvp.initialRecoveredCount,
        status: productMvp.initialRecoveredCount === 0 ? "Passed" : "Failed"
      }
    ],
    afterObservations: [
      {
        name: "afterThirdRecoveryCount",
        type: "debugStateJson",
        phase: "after",
        value: productMvp.afterThirdRecoveryCount,
        status: productMvp.afterThirdRecoveryCount === 3 ? "Passed" : "Failed"
      },
      {
        name: "isJobComplete",
        type: "debugStateJson",
        phase: "after",
        value: productMvp.isJobComplete,
        status: productMvp.isJobComplete === true ? "Passed" : "Failed"
      },
      {
        name: "progressText",
        type: "textValue",
        phase: "after",
        value: productMvp.progressText,
        status: /Job Complete/.test(productMvp.progressText || "") ? "Passed" : "Failed"
      }
    ],
    assertions: assertionCheck.assertions || [],
    sourceValidationDesign: null,
    timestamp: new Date().toISOString()
  };
}

function assertion(id, passed, message) {
  return {
    id,
    result: passed ? "Passed" : "Failed",
    message: passed ? `${id} passed.` : message
  };
}

async function inspectScenarioArtifacts(scenario) {
  const checks = [];
  for (const artifact of scenario.expectedUnityArtifacts || []) {
    if (artifact.status === "Planned") {
      checks.push({
        id: `artifact.${slug(artifact.path)}.planned`,
        type: "Static",
        target: artifact.path,
        status: "Passed",
        failureClass: "Unknown",
        message: "Artifact is planned by the scenario and does not require live existence."
      });
      continue;
    }

    if (["GameObject", "UI", "Component"].includes(artifact.kind) && unityObjectPathFor(artifact)) {
      const objectPath = unityObjectPathFor(artifact);
      const requiredComponents = requiredComponentsFor(artifact);
      const check = await callUnityCheck("unity_get_game_object", { path: objectPath, includeSerializedFields: false });
      const componentResult = check.ok && requiredComponents.length
        ? assertRequiredComponents(check, objectPath, requiredComponents)
        : null;
      checks.push({
        ...check,
        id: `artifact.${slug(artifact.path)}`,
        type: artifact.kind,
        target: artifact.path,
        status: componentResult?.status || check.status,
        ok: componentResult ? componentResult.ok : check.ok,
        failureClass: componentResult?.failureClass || check.failureClass,
        message: componentResult?.message || (check.ok
          ? `Live object check succeeded for ${objectPath}.`
          : `Expected ${artifact.kind} target ${artifact.path} was not found or could not be inspected.`)
      });
      continue;
    }

    if (artifact.path.startsWith("Assets/")) {
      const query = path.basename(artifact.path, path.extname(artifact.path));
      const filter = assetFilterFor(artifact, query);
      const expectedPath = normalizeUnityPath(artifact.path);
      const check = await callUnityCheck("unity_find_assets", { filter, limit: 50 });
      const assets = Array.isArray(check.data?.assets) ? check.data.assets : [];
      const exactMatch = assets.some((asset) => normalizeUnityPath(asset.path) === expectedPath);
      checks.push({
        ...check,
        id: `artifact.${slug(artifact.path)}`,
        type: artifact.kind,
        target: artifact.path,
        status: check.ok && exactMatch ? "Passed" : "Warning",
        failureClass: check.ok && exactMatch ? "Unknown" : "UnityArtifactMissing",
        message: exactMatch
          ? `Found exact asset match for ${artifact.path}.`
          : `Scene/asset probe did not find exact path ${artifact.path} with filter "${filter}".`
      });
      continue;
    }

    checks.push({
      id: `artifact.${slug(artifact.path)}.skipped`,
      type: artifact.kind,
      target: artifact.path,
      status: "Warning",
      failureClass: "ValidationNotRun",
      message: "Live runner has no direct probe for this artifact kind/path yet."
    });
  }
  return checks;
}

async function prepareSampleScenario(scenario) {
  if (scenario.id !== "scenario.top_down_collectible") {
    return [
      {
        id: "prepare.sample.unsupported",
        type: "Static",
        target: scenario.id,
        status: "Warning",
        failureClass: "PreconditionFailed",
        message: "Sample preparation currently supports scenario.top_down_collectible only."
      }
    ];
  }

  const checks = [];
  const openScene = await tryUnityCheck("unity_open_scene", {
    scenePath: "Assets/Scenes/TopDownCollectible.unity",
    saveCurrentIfDirty: true,
    dirtyScenePolicy: "save"
  });
  if (!openScene.ok && /not found|does not exist/i.test(openScene.message || "")) {
    checks.push({
      ...openScene,
      status: "Warning",
      failureClass: "PreconditionFailed",
      message: "TopDownCollectible scene did not exist yet; sample preparation will save the active scene to that path."
    });
  } else {
    checks.push(openScene);
  }
  checks.push(await ensureGameObject({ path: "/Player", name: "Player", primitiveType: "capsule", position: { x: 0, y: 1, z: 0 }, addCharacterController: true }));
  checks.push(await ensureComponent({ path: "/Player", componentType: "Codex.UnityBridge.Sample.PlayerController" }));
  checks.push(await ensureGameObject({ path: "/Main Camera", name: "Main Camera", primitiveType: "empty", position: { x: 0, y: 8, z: -8 } }));
  checks.push(await ensureGameObject({ path: "/Collectibles", name: "Collectibles", primitiveType: "empty" }));
  checks.push(await ensureGameObject({ path: "/Collectibles/Coin_001", name: "Coin_001", parentPath: "/Collectibles", primitiveType: "sphere", position: { x: 2, y: 0.5, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 } }));
  checks.push(await ensureGameObject({ path: "/UI", name: "UI", primitiveType: "empty" }));
  checks.push(await ensureGameObject({ path: "/UI/HUD", name: "HUD", parentPath: "/UI", primitiveType: "empty" }));
  checks.push(await ensureGameObject({ path: "/UI/HUD/ScoreText", name: "ScoreText", parentPath: "/UI/HUD", primitiveType: "empty" }));
  checks.push(await callUnityCheck("unity_create_input_test_bridge", {}));
  checks.push(await tryUnityCheck("unity_save_scene", { saveAsPath: "Assets/Scenes/TopDownCollectible.unity" }));

  return checks.map((check) => ({
    ...check,
    id: check.id.startsWith("prepare.") ? check.id : `prepare.${check.id}`,
    type: check.type || "Scene"
  }));
}

async function ensureComponent({ path: targetPath, componentType }) {
  const added = await tryUnityCheck("unity_add_component", { targetPath, componentType });
  return {
    ...added,
    id: `prepare.component.${slug(targetPath)}.${slug(componentType)}`,
    type: "Component",
    target: `${targetPath}/${componentType}`,
    message: added.ok ? `Prepared ${componentType} on ${targetPath}.` : `Failed to prepare ${componentType} on ${targetPath}: ${added.message}`
  };
}

async function ensureGameObject({ path: targetPath, name, parentPath, primitiveType, position, scale, addCharacterController }) {
  const existing = await tryUnityCheck("unity_get_game_object", { path: targetPath });
  if (existing.ok) {
    return {
      id: `prepare.exists.${slug(targetPath)}`,
      type: "Scene",
      target: targetPath,
      status: "Passed",
      ok: true,
      failureClass: "Unknown",
      message: `${targetPath} already exists.`
    };
  }

  const method = addCharacterController ? "unity_create_asset_based_object" : "unity_create_game_object";
  const params = addCharacterController
    ? { name, parentPath, fallbackPrimitive: primitiveType, addCharacterController: true, position, scale }
    : { name, parentPath, primitiveType, position, scale };
  const created = await tryUnityCheck(method, params);
  return {
    ...created,
    id: `prepare.create.${slug(targetPath)}`,
    target: targetPath,
    message: created.ok ? `Prepared ${targetPath}.` : `Failed to prepare ${targetPath}: ${created.message}`
  };
}

async function runInteractiveApplyChecks() {
  const childChecks = [];
  childChecks.push(await callUnityCheck("unity_create_input_test_bridge", {}));
  childChecks.push(await callUnityCheck("unity_enter_play_mode", {}));
  await sleep(options.playModeWaitMs);
  childChecks.push(await waitForUnityBridge("after_enter_play_mode"));
  childChecks.push(await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "clearTrace" }));
  childChecks.push(await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "pressKey", key: "W" }));
  childChecks.push(await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "releaseKey", key: "W" }));
  childChecks.push(await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "getState" }));

  if (options.exitPlayMode) {
    childChecks.push(await callUnityCheck("unity_exit_play_mode", {}));
    childChecks.push(await waitForUnityBridge("after_exit_play_mode"));
  }

  const failed = childChecks.filter((check) => check.status === "Failed");
  const blocked = childChecks.filter((check) => check.status === "Blocked");
  const status = failed.length > 0 ? "Failed" : blocked.length > 0 ? "Blocked" : "Warning";

  return {
    id: "live.interactive.apply",
    type: "PlayMode",
    target: "AInvilInputTestBridge",
    status,
    failureClass: status === "Passed" ? "Unknown" : "GameLogicFailed",
    message: status === "Warning"
      ? "Interactive apply actions executed, but no Validation Design passCriteria were evaluated."
      : "Interactive apply checks executed.",
    childChecks
  };
}

async function runValidationDesign(design) {
  const childChecks = [];
  const beforeObservations = await collectObservations(design, "before");
  const actionChecks = [];
  for (const action of design.actions || []) {
    actionChecks.push(await runValidationAction(action));
  }
  childChecks.push(...actionChecks);
  const afterObservations = await collectObservations(design, "after");
  const assertions = evaluatePassCriteria(design.passCriteria || [], afterObservations.values);
  const failedActions = actionChecks.filter((check) => check.status === "Failed");
  const blockedActions = actionChecks.filter((check) => check.status === "Blocked");
  const unsupportedActions = actionChecks.filter((check) => check.status === "Warning");
  const failedAssertions = assertions.filter((assertion) => assertion.result !== "Passed");
  const assertionChecks = assertions.map((assertion) => ({
    id: `validation.assert.${slug(design.validationId)}.${slug(assertion.id)}`,
    type: "ValidationAssertion",
    target: assertion.observation,
    status: assertion.result === "Passed" ? "Passed" : "Failed",
    failureClass: assertion.result === "Passed" ? "Unknown" : "GameLogicFailed",
    message: assertion.message
  }));
  childChecks.push(...assertionChecks);

  let status = "Passed";
  if ((design.passCriteria || []).length === 0 || assertions.length === 0) {
    status = "Warning";
  } else if (failedActions.length > 0 || failedAssertions.length > 0) {
    status = "Failed";
  } else if (blockedActions.length > 0) {
    status = "Blocked";
  } else if (unsupportedActions.length > 0) {
    status = "Warning";
  }

  const validationResult = {
    validationId: design.validationId,
    requirementId: design.requirementId || null,
    acceptanceIds: acceptanceIdsForDesign(design),
    scenario: design.scenarioId || null,
    result: status,
    beforeObservations: beforeObservations.records,
    afterObservations: afterObservations.records,
    assertions,
    sourceValidationDesign: design.__sourcePath,
    timestamp: new Date().toISOString()
  };

  return {
    id: `validation.${slug(design.validationId)}`,
    type: "ValidationDesign",
    target: design.validationId,
    status,
    failureClass: status === "Passed" ? "Unknown" : "GameLogicFailed",
    message: status === "Passed"
      ? `Validation Design ${design.validationId} passed with ${assertions.length} evaluated assertion(s).`
      : `Validation Design ${design.validationId} did not pass. Evaluated assertions: ${assertions.length}.`,
    childChecks,
    validationResult
  };
}

async function runValidationAction(action) {
  if (action.type === "openScene") {
    return await callUnityCheck("unity_open_scene", {
      scenePath: action.scene || action.target,
      saveCurrentIfDirty: action.saveCurrentIfDirty ?? true,
      dirtyScenePolicy: action.dirtyScenePolicy || "save"
    });
  }
  if (action.type === "enterPlayMode") {
    const check = await callUnityCheck("unity_enter_play_mode", {});
    if (check.ok) await sleep(action.waitMs ?? options.playModeWaitMs);
    return check;
  }
  if (action.type === "exitPlayMode") {
    return await callUnityCheck("unity_exit_play_mode", {});
  }
  if (action.type === "pressKey") {
    const key = action.key || action.target;
    const press = await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "pressKey", key });
    if (!press.ok) return press;
    if (action.durationMs) await sleep(action.durationMs);
    return await callUnityCheck("unity_input_test_bridge", { ...inputBridgeTarget, action: "releaseKey", key });
  }
  if (action.type === "click") {
    return await callUnityCheck("unity_click_ui_button", {
      targetPath: action.target,
      requireActive: action.requireActive ?? true,
      requireInteractable: action.requireInteractable ?? true,
      includePreflight: action.includePreflight ?? true
    });
  }
  if (action.type === "invoke") {
    return await callUnityCheck("unity_invoke_component_method", {
      targetPath: action.target,
      componentType: action.component || action.componentType,
      methodName: action.methodName,
      args: action.args || [],
      requirePlaying: action.requirePlaying ?? false,
      debugOnly: action.debugOnly ?? true,
      allowedMethodPrefixes: action.allowedMethodPrefixes
    });
  }
  if (action.type === "wait") {
    await sleep(action.durationMs ?? action.ms ?? 500);
    return {
      id: "validation.action.wait",
      type: "Static",
      target: `${action.durationMs ?? action.ms ?? 500}ms`,
      status: "Passed",
      ok: true,
      failureClass: "Unknown",
      message: "Wait action completed."
    };
  }
  return {
    id: `validation.action.${slug(action.type)}`,
    type: "Static",
    target: action.target || action.type,
    status: "Warning",
    ok: false,
    failureClass: "ValidationNotRun",
    message: `Validation action ${action.type} is not implemented in the live harness MVP.`
  };
}

async function collectObservations(design, phase) {
  const records = [];
  const values = {};
  for (const observation of design.observations || []) {
    const record = await collectObservation(observation, phase);
    records.push(record);
    values[observation.name] = record.value;
  }
  return { records, values };
}

async function collectObservation(observation, phase) {
  try {
    if (observation.type === "activeScene") {
      const status = await callUnity("unity_get_status", {});
      const activeScene = status.activeScene || {};
      const value = observation.field ? activeScene[observation.field] : activeScene.name;
      return observationRecord(observation, phase, value, "Passed");
    }
    if (observation.type === "objectExists" || observation.type === "objectActive") {
      const check = await callUnityCheck("unity_get_game_object", { path: observation.target, includeSerializedFields: false });
      if (observation.type === "objectExists") return observationRecord(observation, phase, check.ok, check.ok ? "Passed" : "Failed", check.message);
      const active = Boolean(check.data?.activeSelf && check.data?.activeInHierarchy);
      return observationRecord(observation, phase, active, check.ok ? "Passed" : "Failed", check.message);
    }
    if (observation.type === "componentExists") {
      const check = await callUnityCheck("unity_get_game_object", { path: observation.target, includeSerializedFields: false });
      const componentResult = check.ok ? assertRequiredComponents(check, observation.target, [observation.component]) : null;
      return observationRecord(observation, phase, Boolean(componentResult?.ok), componentResult?.status || check.status, componentResult?.message || check.message);
    }
    if (observation.type === "editorLogErrors") {
      const logs = await callUnity("unity_get_console_logs", { level: "error", limit: observation.limit || 50 });
      return observationRecord(observation, phase, Array.isArray(logs.logs) ? logs.logs.length : 0, "Passed", "", "LogProbe", "unity_get_console_logs");
    }
    if (observation.type === "textValue") {
      const result = await callUnity("unity_get_ui_text", {
        targetPath: observation.target,
        componentType: observation.componentType || observation.component || "auto",
        includeInactive: observation.includeInactive ?? true
      });
      return observationRecord(observation, phase, result.text ?? null, "Passed", "", "UIProbe", "unity_get_ui_text");
    }
    if (observation.type === "debugStateJson") {
      const result = observation.target
        ? await callUnity("unity_get_debug_state", {
          targetPath: observation.target,
          componentType: observation.component || observation.componentType,
          methodName: observation.methodName,
          format: observation.format || "json"
        })
        : await callUnity("unity_input_test_bridge", { ...inputBridgeTarget, action: "getState" });
      return observationRecord(observation, phase, result.state ?? result.result ?? result, "Passed", "", "DebugStateProbe", observation.target ? "unity_get_debug_state" : "unity_input_test_bridge");
    }
  } catch (error) {
    return observationRecord(observation, phase, null, "Failed", error.message);
  }
  return observationRecord(observation, phase, null, "Warning", `Observation ${observation.type} is not implemented in the live harness MVP.`);
}

function observationRecord(observation, phase, value, status, message = "", probe = probeForObservation(observation.type), sourceRpc = null) {
  return {
    name: observation.name,
    type: observation.type,
    phase,
    target: observation.target || observation.field || null,
    value,
    probe,
    sourceRpc,
    status,
    message
  };
}

function evaluatePassCriteria(criteria, values) {
  return criteria.map((criterion) => {
    const actual = valueAtPath(values, criterion.observation);
    const passed = evaluateCriterion(criterion, actual);
    return {
      id: criterion.id,
      observation: criterion.observation,
      operator: criterion.operator,
      expected: criterion.expected ?? null,
      actual,
      result: passed ? "Passed" : "Failed",
      message: passed
        ? `${criterion.id} passed.`
        : `${criterion.id} failed: expected ${criterion.observation} ${criterion.operator} ${JSON.stringify(criterion.expected)}, actual ${JSON.stringify(actual)}.`
    };
  });
}

function valueAtPath(values, key) {
  if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
  return String(key || "").split(".").reduce((current, part) => current?.[part], values);
}

function probeForObservation(type) {
  const map = {
    activeScene: "SceneProbe",
    objectExists: "SceneProbe",
    objectActive: "SceneProbe",
    componentExists: "ComponentProbe",
    textValue: "UIProbe",
    debugStateJson: "DebugStateProbe",
    editorLogErrors: "LogProbe"
  };
  return map[type] || "UnknownProbe";
}

function evaluateCriterion(criterion, actual) {
  if (criterion.operator === "equals") return actual === criterion.expected;
  if (criterion.operator === "notEquals") return actual !== criterion.expected;
  if (criterion.operator === "greaterThan") return Number(actual) > Number(criterion.expected);
  if (criterion.operator === "lessThan") return Number(actual) < Number(criterion.expected);
  if (criterion.operator === "contains") return String(actual ?? "").includes(String(criterion.expected ?? ""));
  if (criterion.operator === "exists") return actual !== undefined && actual !== null && actual !== false;
  if (criterion.operator === "active") return actual === true;
  if (criterion.operator === "distanceGreaterThan") return Number(actual) > Number(criterion.expected);
  return false;
}

async function waitForUnityBridge(label) {
  const timeoutMs = Math.max(15000, options.playModeWaitMs + 10000);
  const started = Date.now();
  let lastCheck = null;

  while (Date.now() - started <= timeoutMs) {
    const health = await getHealth();
    if (health.ok) {
      const status = await callUnityCheck("unity_get_status", {});
      if (status.ok) {
        return {
          ...status,
          id: `bridge.wait.${slug(label)}`,
          message: `Unity Bridge was reachable after ${Date.now() - started}ms.`
        };
      }
      lastCheck = status;
    } else {
      lastCheck = health;
    }
    await sleep(750);
  }

  return {
    ...(lastCheck || {}),
    id: `bridge.wait.${slug(label)}`,
    type: "Static",
    target: healthUrl,
    status: "Failed",
    ok: false,
    failureClass: "BridgeDisconnected",
    message: `Unity Bridge did not become reachable within ${timeoutMs}ms after ${label}. Last result: ${lastCheck?.message || "no response"}`
  };
}

async function getHealth() {
  try {
    const response = await fetch(healthUrl);
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        id: "bridge.health",
        type: "Static",
        target: healthUrl,
        status: "Blocked",
        ok: false,
        failureClass: "BridgeDisconnected",
        message: `Health endpoint returned non-JSON response: ${text.slice(0, 200)}`
      };
    }

    return {
      id: "bridge.health",
      type: "Static",
      target: healthUrl,
      status: response.ok ? "Passed" : "Blocked",
      ok: response.ok,
      failureClass: response.ok ? "Unknown" : "BridgeDisconnected",
      message: response.ok ? "Unity Bridge health endpoint is reachable." : `Unity Bridge health HTTP ${response.status}.`,
      data
    };
  } catch (error) {
    const diagnostics = await bridgeDiagnostics(error.message);
    return {
      id: "bridge.health",
      type: "Static",
      target: healthUrl,
      status: "Blocked",
      ok: false,
      failureClass: "BridgeDisconnected",
      message: error.message,
      diagnostics
    };
  }
}

async function callUnityCheck(method, params) {
  try {
    const data = await callUnity(method, params);
    return {
      id: `bridge.${method}`,
      type: methodToValidationType(method),
      target: method,
      status: "Passed",
      ok: true,
      failureClass: "Unknown",
      message: `${method} succeeded.`,
      data
    };
  } catch (error) {
    return {
      id: `bridge.${method}`,
      type: methodToValidationType(method),
      target: method,
      status: "Failed",
      ok: false,
      failureClass: classifyMethodFailure(method),
      message: error.message
    };
  }
}

async function tryUnityCheck(method, params) {
  try {
    return await callUnityCheck(method, params);
  } catch (error) {
    return {
      id: `bridge.${method}`,
      type: methodToValidationType(method),
      target: method,
      status: "Failed",
      ok: false,
      failureClass: classifyMethodFailure(method),
      message: error.message
    };
  }
}

async function callUnity(method, params) {
  const attempts = method === "unity_enter_play_mode" ? 1 : options.retries;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callUnityOnce(method, params);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await sleep(Math.min(3000, 500 * attempt));
    }
  }
  throw lastError;
}

async function callUnityOnce(method, params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.rpcTimeoutMs);
  let response;
  try {
    response = await fetch(unityUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params: params || {} }),
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Unity Bridge RPC timed out after ${options.rpcTimeoutMs}ms: ${method}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload = {};
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

async function loadScenarios(selectedId, { includeExamples = false } = {}) {
  const scenarioDir = path.join(pluginRoot, "harness", "scenarios");
  const files = (await readdir(scenarioDir)).filter((file) => file.endsWith(".json")).sort();
  const scenarios = [];
  const operationalIds = [];
  const exampleIds = [];

  for (const file of files) {
    const scenarioPath = path.join(scenarioDir, file);
    const scenario = JSON.parse(await readFile(scenarioPath, "utf8"));
    const isExample = ["Example", "Fixture", "Deprecated"].includes(scenario.classification)
      || /top_down_collectible|inventory_grid_ui|character_animation_binding/i.test(scenario.id || "");
    if (isExample) {
      exampleIds.push(scenario.id);
    } else {
      operationalIds.push(scenario.id);
    }
    if (!selectedId && isExample && !includeExamples) {
      continue;
    }
    if (!selectedId || scenario.id === selectedId || file === selectedId) {
      scenarios.push(scenario);
    }
  }

  if (selectedId && scenarios.length === 0) {
    throw new Error(`No harness scenario matched ${selectedId}. Operational scenarios: ${operationalIds.join(", ") || "none"}. Example scenarios: ${exampleIds.join(", ") || "none"}.`);
  }
  if (!selectedId && scenarios.length === 0 && !includeExamples) {
    throw new Error(`No operational harness scenarios found. Add a project-specific scenario with classification="Operational" or pass --include-examples to run sample fixtures. Example scenarios: ${exampleIds.join(", ") || "none"}.`);
  }

  return scenarios;
}

async function loadValidationDesignsForScenario(scenario) {
  const designPath = options.validationDesign || scenario.validationDesignPath;
  if (!designPath) return [];
  const filePath = path.resolve(pluginRoot, designPath);
  const data = JSON.parse(await readFile(filePath, "utf8"));
  const validations = Array.isArray(data.validations) ? data.validations : [data];
  return validations
    .filter((validation) => !validation.scenarioId || validation.scenarioId === scenario.id)
    .map((validation) => ({ ...validation, __sourcePath: path.relative(pluginRoot, filePath).replaceAll("\\", "/") }));
}

function scenarioResult(status, scenario, checks, unityTargets, nextActions, validationResults = [], productMvpEvidence = null) {
  return {
    id: scenario.id,
    title: scenario.title,
    classification: scenario.classification || "Operational",
    category: scenario.category || null,
    validationType: scenario.validationType || null,
    userGoal: scenario.userGoal,
    milestone: scenario.milestone,
    interactive: scenario.interactive,
    requirementIds: idsFromScenario(scenario, "requirementIds", "requirementId"),
    acceptanceIds: idsFromScenario(scenario, "acceptanceIds", "acceptanceId"),
    status,
    checks,
    validationResults,
    productMvpEvidence,
    unityTargets,
    nextActions
  };
}

function nextActionsFor(status, scenario) {
  if (status === "Passed") {
    return ["Record the live harness result in the playtest report and continue the next milestone."];
  }
  if (status === "Warning") {
    return ["Review warnings, decide whether missing artifacts are planned fallbacks, and update documents before claiming validation."];
  }
  if (status === "Blocked") {
    return ["Restore Unity Bridge connectivity and rerun the live harness."];
  }
  return [`Inspect failed checks for ${scenario.id}, fix Unity state or documents, then rerun the live harness.`];
}

function parentObjectPath(componentPath) {
  const parts = componentPath.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return componentPath;
  }
  return `/${parts.slice(0, -1).join("/")}`;
}

function unityObjectPathFor(artifact) {
  if (artifact.gameObjectPath) return artifact.gameObjectPath;
  if (!artifact.path?.startsWith("/")) return null;
  return artifact.kind === "Component" ? parentObjectPath(artifact.path) : artifact.path;
}

function requiredComponentsFor(artifact) {
  if (Array.isArray(artifact.requiredComponents)) return artifact.requiredComponents.filter(Boolean);
  if (artifact.kind !== "Component" || !artifact.path?.startsWith("/")) return [];
  const parts = artifact.path.split("/").filter(Boolean);
  return parts.length > 1 ? [parts.at(-1)] : [];
}

function assertRequiredComponents(check, objectPath, requiredComponents) {
  const components = Array.isArray(check.data?.components) ? check.data.components : [];
  const componentTypes = components.map((component) => typeof component === "string" ? component : component?.type).filter(Boolean);
  const missing = requiredComponents.filter((required) => !componentTypes.some((actual) => componentTypeMatches(actual, required)));
  if (missing.length === 0) {
    return {
      ok: true,
      status: "Passed",
      failureClass: "Unknown",
      message: `Live component check succeeded for ${objectPath}: ${requiredComponents.join(", ")}.`
    };
  }
  return {
    ok: false,
    status: "Failed",
    failureClass: "UnityArtifactMissing",
    message: `Missing required component(s) on ${objectPath}: ${missing.join(", ")}. Present components: ${componentTypes.join(", ") || "none"}.`
  };
}

function componentTypeMatches(actual, required) {
  return actual === required || actual.endsWith(`.${required}`) || actual.split(".").pop() === required;
}

function assetFilterFor(artifact, query) {
  if (artifact.kind === "Scene" || artifact.path.endsWith(".unity")) return `t:Scene ${query}`;
  return query;
}

function normalizeUnityPath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function methodToValidationType(method) {
  if (method.includes("compile")) return "Compile";
  if (method.includes("console")) return "Console";
  if (method.includes("play_mode") || method.includes("input_test") || method.includes("send_key")) return "PlayMode";
  if (method.includes("hierarchy") || method.includes("game_object")) return "Scene";
  if (method.includes("asset")) return "Asset";
  return "Static";
}

function classifyMethodFailure(method) {
  if (method.includes("compile")) return "CompileError";
  if (method.includes("console")) return "ConsoleError";
  if (method.includes("input") || method.includes("key")) return "InputNotReceived";
  if (method.includes("asset")) return "UnityArtifactMissing";
  if (method.includes("game_object") || method.includes("hierarchy")) return "UnityArtifactMissing";
  return "BridgeDisconnected";
}

function slug(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function parseArgs(args) {
  const parsed = {
    scenario: null,
    mode: "probe",
    report: "harness/reports/latest-live-harness-report.json",
    evidenceOut: null,
    validationDesign: null,
    json: false,
    retries: 8,
    rpcTimeoutMs: 10000,
    playModeWaitMs: 2000,
    exitPlayMode: true,
    allowFailures: false,
    prepareSample: false,
    includeExamples: false
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--scenario") {
      parsed.scenario = args[++index];
    } else if (arg === "--mode") {
      parsed.mode = args[++index];
    } else if (arg === "--report") {
      parsed.report = args[++index];
    } else if (arg === "--evidence-out") {
      parsed.evidenceOut = args[++index];
    } else if (arg === "--validation-design") {
      parsed.validationDesign = args[++index];
    } else if (arg === "--no-report") {
      parsed.report = null;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--retries") {
      parsed.retries = Number(args[++index]);
    } else if (arg === "--rpc-timeout-ms") {
      parsed.rpcTimeoutMs = Number(args[++index]);
    } else if (arg === "--play-mode-wait-ms") {
      parsed.playModeWaitMs = Number(args[++index]);
    } else if (arg === "--no-exit-play-mode") {
      parsed.exitPlayMode = false;
    } else if (arg === "--allow-failures") {
      parsed.allowFailures = true;
    } else if (arg === "--prepare-sample") {
      parsed.prepareSample = true;
    } else if (arg === "--include-examples") {
      parsed.includeExamples = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["probe", "apply"].includes(parsed.mode)) {
    throw new Error("--mode should be probe or apply.");
  }
  if (!Number.isInteger(parsed.retries) || parsed.retries < 1) {
    throw new Error("--retries should be a positive integer.");
  }
  if (!Number.isInteger(parsed.rpcTimeoutMs) || parsed.rpcTimeoutMs < 1000) {
    throw new Error("--rpc-timeout-ms should be an integer >= 1000.");
  }
  if (!Number.isInteger(parsed.playModeWaitMs) || parsed.playModeWaitMs < 0) {
    throw new Error("--play-mode-wait-ms should be a non-negative integer.");
  }

  return parsed;
}

function printHelp() {
  console.log(`AInvil live harness

Usage:
  node scripts/run-ainvil-live-harness.mjs [options]

Options:
  --scenario <id-or-file>      Run one scenario.
  --mode <probe|apply>         probe is non-mutating. apply may enter Play Mode and create AInvilRuntimeInputTestBridge.
  --include-examples           include sample/fixture scenarios when no --scenario is specified.
  --report <path>              Write JSON report path relative to plugin root.
  --evidence-out <path>        Write validation evidence JSON relative to plugin root.
  --validation-design <path>   Execute a Validation Design JSON file relative to plugin root.
  --no-report                  Do not write a report file.
  --json                       Print full JSON report.
  --retries <n>                Retry Unity RPC calls.
  --rpc-timeout-ms <n>         Timeout for each Unity RPC call.
  --play-mode-wait-ms <n>      Wait after entering Play Mode in apply mode.
  --no-exit-play-mode          Leave Unity in Play Mode after apply checks.
  --allow-failures             Exit 0 after exporting classified failure evidence.
  --prepare-sample             Prepare the supported sample scene/artifacts before probing.
`);
}

async function writeEvidence(harnessReport, relativePath) {
  const scenario = harnessReport.scenarios[0];
  const checks = scenario?.checks || [];
  const validationResults = scenario?.validationResults || [];
  const productMvpEvidence = scenario?.productMvpEvidence || null;
  const firstValidation = validationResults[0] || null;
  const status = scenario?.status || "NotRun";
  const failureClass = status === "Passed" ? "None" : firstFailureClass(checks);
  const evidence = {
    schemaVersion: "1.0.0",
    evidenceId: `EVID-${slug(scenario?.id || "live-harness")}-${harnessReport.startedAt.replace(/[:.]/g, "-")}`,
    source: "LiveHarness",
    scenarioId: scenario?.id || "Unknown",
    classification: scenario?.classification || "Operational",
    category: scenario?.category || productMvpEvidence?.category || undefined,
    validationType: scenario?.validationType || productMvpEvidence?.validationType || undefined,
    validationLevel: validationLevelFor(status, checks),
    status,
    result: status,
    validationIds: validationResults.map((result) => result.validationId).filter(Boolean),
    validationId: firstValidation?.validationId || null,
    failureClass,
    acceptanceIds: idsFromValidationResults(validationResults).length ? idsFromValidationResults(validationResults) : idsFromScenario(scenario, "acceptanceIds", "acceptanceId"),
    requirementIds: requirementIdsFromValidationResults(validationResults).length ? requirementIdsFromValidationResults(validationResults) : idsFromScenario(scenario, "requirementIds", "requirementId"),
    unityTargets: scenario?.unityTargets || [],
    checks: flattenChecks(checks),
    checkedSteps: flattenChecks(checks),
    bridgeHealthResult: checkSummary(checks, "bridge.health"),
    compileStatusResult: checkSummary(checks, "bridge.unity_compile_status")
      || checkSummary(checks, "bridge.unity_compile_status.before_product_mvp_scene_build")
      || checkSummary(checks, "bridge.unity_compile_status.after_product_mvp_scene_build"),
    consoleErrorSummary: consoleErrorSummary(checks),
    failureReason: status === "Passed" ? null : firstNonPassedMessage(checks),
    blocker: status === "Passed" ? null : failureClass,
    bridgeDiagnostics: checks.find((check) => check.id === "bridge.health")?.diagnostics || [],
    validationResults,
    observations: firstValidation ? { before: firstValidation.beforeObservations, after: firstValidation.afterObservations } : null,
    assertions: validationResults.flatMap((result) => result.assertions || []),
    sourceValidationDesign: firstValidation?.sourceValidationDesign || null,
    startedAt: harnessReport.startedAt,
    finishedAt: harnessReport.finishedAt,
    completedAt: harnessReport.finishedAt,
    timestamp: harnessReport.finishedAt,
    remainingGaps: evidenceGaps(scenario, status),
    nextActions: scenario?.nextActions || ["Rerun live harness after resolving environment or validation gaps."]
  };
  if (productMvpEvidence) {
    Object.assign(evidence, {
      category: productMvpEvidence.category,
      validationType: productMvpEvidence.validationType,
      unityProjectPath: productMvpEvidence.unityProjectPath,
      generatedAssets: productMvpEvidence.generatedAssets,
      dryRunReport: productMvpEvidence.dryRunReport,
      compileStatus: productMvpEvidence.compileStatus,
      consoleErrorCount: productMvpEvidence.consoleErrorCount,
      playModeStatus: productMvpEvidence.playModeStatus,
      totalRecoveryTargetCount: productMvpEvidence.totalRecoveryTargetCount,
      initialRecoveredCount: productMvpEvidence.initialRecoveredCount,
      afterFirstRecoveryCount: productMvpEvidence.afterFirstRecoveryCount,
      afterThirdRecoveryCount: productMvpEvidence.afterThirdRecoveryCount,
      isJobComplete: productMvpEvidence.isJobComplete,
      progressText: productMvpEvidence.progressText,
      validationHookUsed: productMvpEvidence.validationHookUsed,
      staleEvidenceReused: productMvpEvidence.staleEvidenceReused
    });
  }
  const evidencePath = path.resolve(pluginRoot, relativePath);
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

function checkSummary(checks, id) {
  const check = flattenChecks(checks).find((item) => item.checkId === id);
  return check ? {
    checkId: check.checkId,
    status: check.status,
    failureClass: check.failureClass,
    message: check.message
  } : null;
}

function consoleErrorSummary(checks) {
  const consoleCheck = [...checks].reverse().find((check) => check.id === "bridge.unity_get_console_logs");
  const logs = consoleCheck?.data?.logs;
  return {
    status: consoleCheck?.status || "NotRun",
    errorCount: Array.isArray(logs) ? logs.length : null,
    message: consoleCheck?.message || "Console logs were not checked."
  };
}

function consoleErrorCount(check) {
  const logs = check?.data?.logs;
  if (Array.isArray(logs)) return logs.length;
  if (typeof check?.data?.count === "number") return check.data.count;
  if (typeof check?.data?.errorCount === "number") return check.data.errorCount;
  return check?.ok ? 0 : null;
}

function compileStatusForEvidence(check) {
  return {
    status: check?.status || "NotRun",
    message: check?.message || null,
    isCompiling: compileInProgress(check),
    hasErrors: compileHasErrors(check),
    raw: check?.data || null
  };
}

function compileInProgress(check) {
  const data = check?.data || {};
  return Boolean(data.isCompiling || data.compiling || data.status === "Compiling");
}

function compileHasErrors(check) {
  const data = check?.data || {};
  if (data.hasErrors === true || data.hasCompileErrors === true || data.errorsPresent === true) return true;
  if (typeof data.errorCount === "number") return data.errorCount > 0;
  if (Array.isArray(data.errors)) return data.errors.length > 0;
  if (Array.isArray(data.compilerErrors)) return data.compilerErrors.length > 0;
  return false;
}

function parseInvocationJson(check) {
  const raw = check?.data?.result ?? check?.data?.returnValue ?? check?.data?.value ?? check?.data;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === "object") return raw;
  return null;
}

function firstNonPassedMessage(checks) {
  const failed = flattenChecks(checks).find((check) => check.status !== "Passed");
  return failed?.message || null;
}

function flattenChecks(checks) {
  return checks.flatMap((check) => [
    {
      checkId: check.id,
      type: check.type,
      target: check.target,
      status: check.status,
      failureClass: check.failureClass || "Unknown",
      message: check.message
    },
    ...(check.childChecks || []).map((child) => ({
      checkId: child.id,
      type: child.type,
      target: child.target,
      status: child.status,
      failureClass: child.failureClass || "Unknown",
      message: child.message
    }))
  ]);
}

function firstFailureClass(checks) {
  const failed = flattenChecks(checks).find((check) => check.status !== "Passed");
  return normalizeFailureClass(failed?.failureClass || "Unknown");
}

function normalizeFailureClass(value) {
  const map = {
    UnityArtifactMissing: "ArtifactMissing",
    ValidationNotRun: "PreconditionFailed"
  };
  return map[value] || value || "Unknown";
}

function validationLevelFor(status, checks) {
  if (status === "Blocked" || status === "NotRun") return "Not Checked";
  const flat = flattenChecks(checks);
  if (flat.some((check) => check.type === "PlayMode" && check.status === "Passed")) return "Play Mode Verified";
  if (flat.some((check) => check.type === "Compile" && check.status === "Passed")) return "Compile Verified";
  if (flat.some((check) => ["Scene", "Asset", "Static"].includes(check.type) && check.status === "Passed")) return "Unity Inspection";
  return "Not Checked";
}

function evidenceGaps(scenario, status) {
  const gaps = [];
  if (!scenario) gaps.push("No scenario result was produced.");
  if (status !== "Passed") gaps.push("Scenario did not pass live validation.");
  if ((scenario?.validationResults || []).length === 0 && status === "Passed") {
    gaps.push("No Validation Design assertions were evaluated.");
  }
  if (idsFromScenario(scenario, "acceptanceIds", "acceptanceId").length === 0) {
    gaps.push("Scenario is not linked to acceptance criteria yet.");
  }
  return gaps;
}

function idsFromValidationResults(results) {
  return [...new Set(results.flatMap((result) => result.acceptanceIds || []).filter(Boolean))];
}

function requirementIdsFromValidationResults(results) {
  return [...new Set(results.map((result) => result.requirementId).filter(Boolean))];
}

function idsFromScenario(scenario, arrayField, singleField) {
  const fromArray = Array.isArray(scenario?.[arrayField]) ? scenario[arrayField] : [];
  const fromSingle = scenario?.[singleField] ? [scenario[singleField]] : [];
  return [...new Set([...fromArray, ...fromSingle].filter(Boolean))];
}

function acceptanceIdsForDesign(design) {
  return [...new Set([...(Array.isArray(design.acceptanceIds) ? design.acceptanceIds : []), design.acceptanceId].filter(Boolean))];
}

function printHumanReport(result) {
  console.log(`AInvil live harness (${result.mode})`);
  console.log(`Unity: ${result.unityUrl}`);
  console.log(`Scenarios: ${result.summary.total}, passed: ${result.summary.passed}, warning: ${result.summary.warning}, failed: ${result.summary.failed}, blocked: ${result.summary.blocked}`);
  if (options.report) {
    console.log(`Report: ${options.report}`);
  }
  for (const scenario of result.scenarios) {
    console.log(`- ${scenario.status}: ${scenario.id} - ${scenario.title}`);
    for (const check of scenario.checks) {
      if (check.status !== "Passed") {
        console.log(`  ${check.status}: ${check.id} - ${check.message}`);
        if (Array.isArray(check.diagnostics) && check.diagnostics.length) {
          for (const diagnostic of check.diagnostics) {
            console.log(`    cause: ${diagnostic.cause}`);
            console.log(`    next: ${diagnostic.nextAction}`);
          }
        }
      }
    }
    if (scenario.nextActions?.length) {
      for (const action of scenario.nextActions) console.log(`  next: ${action}`);
    }
  }
}

async function bridgeDiagnostics(errorMessage) {
  const manifest = await readJsonIfExists(path.join(pluginRoot, "state", "workspace_manifest.json"));
  const unityProjectPath = manifest?.unityProjectPath || null;
  const canonicalPackage = path.join(pluginRoot, "unity-package", "Packages", "com.codex.unity-bridge", "package.json");
  const installedPackage = unityProjectPath ? path.join(unityProjectPath, "Packages", "com.codex.unity-bridge", "package.json") : null;
  return [
    {
      cause: "Unity Editor is not running or the configured Unity project is not open.",
      evidence: errorMessage,
      nextAction: "Open the configured Unity project, then rerun the harness."
    },
    {
      cause: "Unity Bridge HTTP server is not started.",
      evidence: healthUrl,
      nextAction: "In Unity, run Tools > Codex Unity Bridge > Start Server."
    },
    {
      cause: "Bridge URL or port mismatch.",
      evidence: `Harness health URL is ${healthUrl}.`,
      nextAction: "Confirm UNITY_BRIDGE_URL points to the same port used by Unity Bridge, normally http://127.0.0.1:17777/rpc."
    },
    {
      cause: "Workspace manifest Unity project path may be missing or incorrect.",
      evidence: unityProjectPath || "No unityProjectPath in state/workspace_manifest.json.",
      nextAction: "Run `node plugins/ainvil/cli/ainvil-cli.mjs doctor --unity-project <UnityProjectPath>` with the real project path."
    },
    {
      cause: "Canonical Unity Bridge package may not be installed in the Unity project.",
      evidence: `Canonical exists=${await exists(canonicalPackage)}; installed package exists=${installedPackage ? await exists(installedPackage) : false}.`,
      nextAction: "Install the package from plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json via Unity Package Manager."
    },
    {
      cause: "Unity compile errors may prevent the Editor bridge script from loading.",
      evidence: "Compile status cannot be checked while the bridge is unreachable.",
      nextAction: "After starting Unity, check the Unity Console and rerun `node plugins/ainvil/cli/ainvil-cli.mjs doctor`."
    }
  ];
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
