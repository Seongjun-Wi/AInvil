import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { loadJsonArtifact, loadJsonDirectory } from "./loaders.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";

const STATUS = {
  VERIFIED: "Verified",
  PARTIAL: "Partial",
  BLOCKED: "Blocked",
  SPEC_ONLY: "Spec-only",
  DEPRECATED_SAMPLE: "Deprecated/Sample"
};

const DEFAULT_JSON = "reports/productization_status_report.json";
const DEFAULT_MARKDOWN = "reports/productization_status_report.md";

export async function createInitialProductionGraph(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const projectName = options.projectName || "AInvil Productization";
  const graph = {
    schemaVersion: "1.0.0",
    graphId: "GRAPH-AInvil-Productization",
    projectId: "PROJECT-AInvil-Productization",
    projectName,
    version: "0.2.0",
    createdAt: generatedAt,
    updatedAt: generatedAt,
    currentVisionNodeId: "VISION-AInvil-Productization",
    currentMilestoneNodeId: "MILESTONE-E2E-Recovery",
    activeFeatureNodeId: "FEAT-E2E-HappyPath-001",
    healthSummary: {
      designHealth: "Yellow",
      implementationHealth: "Yellow",
      documentationHealth: "Yellow",
      validationCoverage: "Red",
      technicalDebt: "Yellow",
      productionRisk: "Yellow",
      summary: "Operational source-of-truth has been reset from the example graph. Unity Bridge and Play Mode evidence remain blocked until live Unity connectivity is restored."
    },
    nextRecommendedAction: {
      actionId: "NEXT-Restore-Unity-Bridge",
      title: "Restore Unity Bridge connectivity and rerun productization checks.",
      owner: "Unity Agent",
      status: "Planned",
      reason: "The minimum E2E happy path cannot reach compile or Play Mode validation while Unity Bridge is unreachable.",
      referencesNodeId: "TASK-E2E-004",
      requiredValidationLevel: "Compile Verified"
    },
    nodes: [
      {
        id: "VISION-AInvil-Productization",
        type: "Vision",
        title: "AInvil reliable game production workflow",
        summary: "AInvil should present a trustworthy requirement-first workflow from user intent to Unity validation evidence without mixing example fixtures into operational state.",
        status: "Confirmed",
        owner: "Director Layer",
        refs: [{ kind: "Plugin README", path: "README.md" }]
      },
      {
        id: "MILESTONE-E2E-Recovery",
        type: "Milestone",
        title: "Productization cleanup and E2E validation recovery",
        summary: "Separate examples from operational state, establish canonical Unity Bridge package paths, and expose an executable dry-run E2E status report.",
        status: "In Progress",
        owner: "Orchestrator"
      },
      {
        id: "FEAT-E2E-HappyPath-001",
        type: "Feature",
        title: "Minimum AInvil E2E happy path",
        summary: "Track the minimum production workflow: user request, requirement graph, dry-run Unity change, bridge apply, compile check, Play Mode validation, evidence, traceability, dashboard.",
        status: "In Progress",
        owner: "Orchestrator"
      },
      {
        id: "REQ-E2E-001",
        type: "Requirement",
        title: "Operational state must not depend on example fixtures",
        summary: "Runtime reports and release readiness must identify example graph, sample harness, and placeholder evidence as non-operational.",
        status: "Confirmed",
        owner: "GDD Agent"
      },
      {
        id: "REQ-E2E-002",
        type: "Requirement",
        title: "Minimum E2E status must be reportable without mutating Unity",
        summary: "A CLI-accessible report must classify each happy-path step as Verified, Partial, Blocked, Spec-only, or Deprecated/Sample.",
        status: "Confirmed",
        owner: "Orchestrator"
      },
      {
        id: "REQ-E2E-003",
        type: "Requirement",
        title: "Unity Bridge package and input bridge roles must be explicit",
        summary: "A canonical Unity Bridge package path and preferred runtime input bridge component must be documented and surfaced in productization reports.",
        status: "Confirmed",
        owner: "Unity Agent"
      },
      {
        id: "FS-E2E-HappyPath",
        type: "FeatureSpec",
        title: "AInvil E2E productization status feature spec",
        summary: "Operational feature spec represented by productization status reports and CLI commands.",
        status: "Implemented",
        owner: "Orchestrator",
        refs: [{ kind: "Report", path: "reports/productization_status_report.json" }]
      },
      {
        id: "TASK-E2E-001",
        type: "ImplementationTask",
        title: "Separate example fixtures from operational source of truth",
        summary: "Copy example graph and sample scenario to examples and reset state/production_state_graph.json to AInvil productization state.",
        status: "Implemented",
        owner: "Orchestrator"
      },
      {
        id: "TASK-E2E-002",
        type: "ImplementationTask",
        title: "Generate productization status report",
        summary: "Create JSON and Markdown reports showing feature statuses, E2E step statuses, release blockers, package roles, and input bridge roles.",
        status: "Implemented",
        owner: "Orchestrator"
      },
      {
        id: "TASK-E2E-003",
        type: "ImplementationTask",
        title: "Expose productization report through CLI",
        summary: "Add a CLI command that writes and summarizes productization status.",
        status: "Implemented",
        owner: "Orchestrator"
      },
      {
        id: "TASK-E2E-004",
        type: "ImplementationTask",
        title: "Restore live Unity Bridge connectivity",
        summary: "Open Unity, import the canonical bridge package, start the bridge server, and rerun doctor/productization checks.",
        status: "Blocked",
        owner: "Unity Agent"
      },
      {
        id: "UNITY-Bridge-Package",
        type: "UnityTarget",
        title: "Canonical Unity Bridge package",
        summary: "Plugin-local package used as canonical install source.",
        status: "Implemented",
        owner: "Unity Agent",
        metadata: {
          unityKind: "Package",
          path: "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge"
        }
      },
      {
        id: "INPUT-Runtime-Test-Bridge",
        type: "InputSpec",
        title: "Runtime-safe input validation bridge",
        summary: "Codex.UnityBridge.AInvilRuntimeInputTestBridge is the preferred runtime validation component; AInvilInputTestBridge remains compatibility/sample surface.",
        status: "Implemented",
        owner: "Input Agent"
      },
      {
        id: "AC-E2E-001",
        type: "AcceptanceCriterion",
        title: "Productization report classifies the E2E path",
        summary: "Given AInvil is run from the plugin workspace, when the productization report command runs, then each minimum E2E step has a concrete status and next action.",
        status: "Needs validation",
        owner: "Orchestrator",
        validationLevel: "Static Analysis"
      },
      {
        id: "AC-E2E-002",
        type: "AcceptanceCriterion",
        title: "Unity live checks reach compile and Play Mode evidence",
        summary: "Given Unity Bridge is reachable, when doctor and live harness run, then compile status and Play Mode validation evidence are recorded.",
        status: "Blocked",
        owner: "Input Agent",
        validationLevel: "Not Checked"
      },
      {
        id: "EVID-E2E-Static-Report",
        type: "ValidationEvidence",
        title: "Static productization status report",
        summary: "Static report generation can run without Unity and records live Unity blockers separately.",
        status: "Needs validation",
        owner: "Orchestrator",
        validationLevel: "Static Analysis",
        evidence: {
          evidenceId: "EVID-E2E-Static-Report",
          validationLevel: "Static Analysis",
          status: "Not tested",
          source: "reports/productization_status_report.json",
          summary: "Generated by productization report command; live Unity validation remains separate.",
          timestamp: null
        }
      },
      {
        id: "RISK-Example-Contamination",
        type: "Risk",
        title: "Example fixtures contaminate operational state",
        summary: "Example graph and top_down_collectible scenario can make AInvil look more validated than it is for a real project.",
        status: "In Progress",
        owner: "Orchestrator"
      },
      {
        id: "NEXT-Restore-Unity-Bridge",
        type: "NextAction",
        title: "Restore Unity Bridge connectivity and rerun productization checks.",
        summary: "Unity Bridge health, compile check, and Play Mode evidence are currently blocked.",
        status: "Planned",
        owner: "Orchestrator",
        nextAction: {
          actionId: "NEXT-Restore-Unity-Bridge",
          title: "Restore Unity Bridge connectivity and rerun productization checks.",
          owner: "Unity Agent",
          status: "Planned",
          reason: "The minimum E2E happy path cannot complete until Unity Bridge is reachable.",
          referencesNodeId: "TASK-E2E-004",
          requiredValidationLevel: "Compile Verified"
        }
      }
    ],
    edges: [
      { id: "EDGE-MILESTONE-DERIVES-VISION", type: "derives_from", from: "MILESTONE-E2E-Recovery", to: "VISION-AInvil-Productization" },
      { id: "EDGE-FEAT-DERIVES-MILESTONE", type: "derives_from", from: "FEAT-E2E-HappyPath-001", to: "MILESTONE-E2E-Recovery" },
      { id: "EDGE-REQ1-DERIVES-FEAT", type: "derives_from", from: "REQ-E2E-001", to: "FEAT-E2E-HappyPath-001" },
      { id: "EDGE-REQ2-DERIVES-FEAT", type: "derives_from", from: "REQ-E2E-002", to: "FEAT-E2E-HappyPath-001" },
      { id: "EDGE-REQ3-DERIVES-FEAT", type: "derives_from", from: "REQ-E2E-003", to: "FEAT-E2E-HappyPath-001" },
      { id: "EDGE-FS-MAPS-FEAT", type: "maps_to", from: "FS-E2E-HappyPath", to: "FEAT-E2E-HappyPath-001" },
      { id: "EDGE-TASK1-IMPLEMENTS-REQ1", type: "implements", from: "TASK-E2E-001", to: "REQ-E2E-001" },
      { id: "EDGE-TASK2-IMPLEMENTS-REQ2", type: "implements", from: "TASK-E2E-002", to: "REQ-E2E-002" },
      { id: "EDGE-TASK3-IMPLEMENTS-REQ2", type: "implements", from: "TASK-E2E-003", to: "REQ-E2E-002" },
      { id: "EDGE-TASK4-IMPLEMENTS-REQ3", type: "implements", from: "TASK-E2E-004", to: "REQ-E2E-003" },
      { id: "EDGE-UNITY-MAPS-TASK4", type: "maps_to", from: "UNITY-Bridge-Package", to: "TASK-E2E-004" },
      { id: "EDGE-INPUT-MAPS-AC2", type: "maps_to", from: "INPUT-Runtime-Test-Bridge", to: "AC-E2E-002" },
      { id: "EDGE-AC1-DERIVES-REQ2", type: "derives_from", from: "AC-E2E-001", to: "REQ-E2E-002" },
      { id: "EDGE-AC2-DERIVES-REQ3", type: "derives_from", from: "AC-E2E-002", to: "REQ-E2E-003" },
      { id: "EDGE-EVID-VALIDATES-AC1", type: "validates", from: "EVID-E2E-Static-Report", to: "AC-E2E-001" },
      { id: "EDGE-RISK-AFFECTS-FEAT", type: "affects", from: "RISK-Example-Contamination", to: "FEAT-E2E-HappyPath-001" },
      { id: "EDGE-NEXT-FOR-TASK4", type: "next_step_for", from: "NEXT-Restore-Unity-Bridge", to: "TASK-E2E-004" }
    ]
  };

  if (options.write !== false) {
    const outputPath = resolveAInvilPath(options.outputPath || "state/production_state_graph.json");
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
    return { path: outputPath, data: graph };
  }
  return { path: null, data: graph };
}

export async function createProductizationStatusReport(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const graph = await loadJsonArtifact("state/production_state_graph.json");
  const doctor = await loadJsonArtifact("reports/onboarding_doctor_report.json");
  const release = await loadJsonArtifact("reports/release_readiness_report.json");
  const latestHarness = await loadJsonArtifact("harness/reports/latest-live-harness-report.json");
  const dashboard = await loadJsonArtifact("reports/project_dashboard.json");
  const traceability = await loadJsonArtifact("reports/traceability_view.json");
  const playabilityReview = await loadJsonArtifact("reports/dungeon_recovery_first_playable_playability_review.json");
  const buildVerification = await loadJsonArtifact("reports/dungeon_recovery_first_playable_build_verification.json");
  const scenarios = await loadJsonDirectory("harness/scenarios");
  const evidence = await loadJsonDirectory("validation/evidence");

  const graphClass = classifyGraph(graph.data);
  const doctorChecks = new Map((doctor.data?.checks || []).map((check) => [check.id, check]));
  const bridgeHealth = doctorChecks.get("unity.bridge.health");
  const compileCheck = doctorChecks.get("unity.compile");
  const hasOperationalScenario = scenarios.some((item) => scenarioClassification(item.data) === "Operational");
  const hasPassedEvidence = evidence.some((item) => item.data?.status === "Passed" && !isSampleEvidence(item.data));
  const packageStatus = await packageInventory();
  const inputBridge = await inputBridgeInventory();
  const exampleContamination = contaminationFindings(graph.data, scenarios, evidence);
  const operationalScenarios = scenarios.filter((item) => scenarioClassification(item.data) === "Operational");
  const latestOperationalEvidence = latestOperationalEvidenceRecord(evidence);
  const productMvp = productMvpWorkflowStatus(scenarios, evidence, latestHarness, playabilityReview, buildVerification);

  const e2eSteps = [
    step("E2E-001", "사용자 요청 수신", "Codex Plugin / Orchestrator", STATUS.SPEC_ONLY, "대화형 에이전트 지침으로 정의되어 있으며 독립 런타임 이벤트로 기록되지는 않습니다.", "제품 이벤트 로그가 필요하면 별도 run log에 사용자 요청 ID를 기록합니다."),
    step("E2E-002", "Feature/Requirement/Task/Acceptance 등록", "Production State Graph", graph.exists && graphClass === "Operational" ? STATUS.PARTIAL : STATUS.BLOCKED, graph.exists ? `현재 그래프 분류: ${graphClass}` : "운영 그래프가 없습니다.", graphClass === "Operational" ? "실제 프로젝트 요구사항을 계속 추가합니다." : "init-production-graph 또는 프로젝트별 그래프 생성을 실행합니다."),
    step("E2E-003", "Unity 변경 dry-run", "Workflow Transition / Executor", STATUS.PARTIAL, "승인 전환 dry-run은 존재하지만 Unity 변경 계획 전용 dry-run은 아직 일반화되지 않았습니다.", "프로젝트별 Unity change set dry-run을 Transition 후보에 연결합니다."),
    step("E2E-004", "Unity Bridge 적용", "MCP Unity Server / Unity Editor Bridge", bridgeHealth?.status === "Passed" ? STATUS.PARTIAL : STATUS.BLOCKED, bridgeHealth?.message || "doctor report가 없거나 Unity Bridge health가 확인되지 않았습니다.", "Unity를 열고 canonical package를 설치한 뒤 Tools > Codex Unity Bridge > Start Server를 실행합니다."),
    step("E2E-005", "Compile check", "Onboarding Doctor / unity_compile_status", compileCheck?.status === "Passed" ? STATUS.VERIFIED : STATUS.BLOCKED, compileCheck?.message || "compile check가 아직 통과하지 않았습니다.", "Bridge 연결 후 ainvil doctor를 다시 실행합니다."),
    step("E2E-006", "Play Mode validation", "Live Harness / Input Agent", hasPassedEvidence ? STATUS.VERIFIED : STATUS.BLOCKED, hasPassedEvidence ? "운영 evidence 중 Passed 항목이 있습니다." : "운영 evidence가 없거나 샘플/blocked evidence만 있습니다.", "프로젝트별 scenario를 등록하고 live harness apply를 실행합니다."),
    step("E2E-007", "Evidence 저장", "validation/evidence", evidence.length > 0 ? (hasPassedEvidence ? STATUS.VERIFIED : STATUS.PARTIAL) : STATUS.BLOCKED, `${evidence.length}개 evidence 파일 감지, 운영 Passed evidence=${hasPassedEvidence}`, "샘플 evidence와 운영 evidence를 분리하고 acceptanceIds를 실제 그래프에 연결합니다."),
    step("E2E-008", "Traceability 갱신", "Traceability View", traceability.exists ? STATUS.PARTIAL : STATUS.BLOCKED, traceability.exists ? "traceability view가 존재하지만 운영 evidence 연결은 별도 확인이 필요합니다." : "traceability view가 없습니다.", "productization report 이후 traceability/dashboard를 재생성합니다."),
    step("E2E-009", "Dashboard 상태 갱신", "Project Dashboard", dashboard.exists ? STATUS.PARTIAL : STATUS.BLOCKED, dashboard.exists ? "dashboard가 존재합니다." : "dashboard가 없습니다.", "generate-project-dashboard를 실행해 productization status를 포함합니다.")
  ];

  const features = [
    feature("Codex Plugin", STATUS.VERIFIED, "plugin.json과 MCP config가 존재합니다.", [".codex-plugin/plugin.json", ".mcp.json"]),
    feature("Agent Skills", STATUS.SPEC_ONLY, "역할 지침은 구현되어 있으나 런타임 검증 기능 자체는 아닙니다.", ["skills/orchestrator", "skills/gdd-agent", "skills/unity-agent", "skills/input-agent"]),
    feature("Director Layer", STATUS.SPEC_ONLY, "제품 판단 규칙과 워크플로우 지침으로 존재합니다.", ["docs/AInvil_Director_Layer.md"]),
    feature("Platform Core", STATUS.PARTIAL, "그래프/리포트/워크플로우 코어는 실행 가능하나 E2E Unity 검증은 막혀 있습니다.", ["core/"]),
    feature("Production State Graph", graph.exists && graphClass === "Operational" ? STATUS.PARTIAL : STATUS.BLOCKED, `현재 그래프 분류: ${graphClass}`, ["state/production_state_graph.json"]),
    feature("Production Intelligence", STATUS.PARTIAL, "보고서 생성기는 존재하지만 live validation gap이 남아 있습니다.", ["reports/production_intelligence_report.json"]),
    feature("Workflow Runtime", STATUS.PARTIAL, "guarded sync와 산출물 생성은 가능하지만 Unity mutation/validation promotion은 하지 않습니다.", ["core/workflow-runtime.mjs"]),
    feature("Transition Planner / Approval / Executor", STATUS.PARTIAL, "전환 후보와 dry-run 실행은 가능하지만 실제 Unity 변경 경로와는 분리되어 있습니다.", ["core/workflow-transitions.mjs", "core/workflow-approvals.mjs", "core/workflow-executor.mjs"]),
    feature("Traceability View", traceability.exists ? STATUS.PARTIAL : STATUS.BLOCKED, traceability.exists ? "보고서는 존재하나 evidence 연결은 미완입니다." : "보고서가 없습니다.", ["reports/traceability_view.json"]),
    feature("Project Dashboard", dashboard.exists ? STATUS.PARTIAL : STATUS.BLOCKED, dashboard.exists ? "대시보드는 존재합니다." : "대시보드가 없습니다.", ["reports/project_dashboard.json"]),
    feature("Onboarding Doctor", doctor.exists ? STATUS.PARTIAL : STATUS.BLOCKED, doctor.exists ? `releaseReadiness=${doctor.data.releaseReadiness}` : "doctor report가 없습니다.", ["reports/onboarding_doctor_report.json"]),
    feature("Release Readiness", release.exists ? STATUS.PARTIAL : STATUS.BLOCKED, release.exists ? `decision=${release.data.decision}` : "release readiness report가 없습니다.", ["reports/release_readiness_report.json"]),
    feature("CLI", STATUS.PARTIAL, "상태 조회와 guarded sync 명령이 존재합니다. productization 리포트 명령으로 E2E 상태를 보강합니다.", ["cli/ainvil-cli.mjs"]),
    feature("MCP Unity Server", bridgeHealth?.status === "Passed" ? STATUS.PARTIAL : STATUS.BLOCKED, bridgeHealth?.message || "Unity Bridge health가 막혀 있습니다.", ["mcp-server/server.mjs"]),
    feature("Unity Editor Bridge", bridgeHealth?.status === "Passed" ? STATUS.PARTIAL : STATUS.BLOCKED, bridgeHealth?.message || "Editor HTTP endpoint에 연결되지 않았습니다.", ["unity-package/Packages/com.codex.unity-bridge"]),
    feature("Input Test Bridge", inputBridge.preferredExists ? STATUS.PARTIAL : STATUS.BLOCKED, inputBridge.summary, inputBridge.files.map((item) => item.path)),
    feature("Benchmark System", STATUS.PARTIAL, "벤치마크 데이터와 리포트는 존재하지만 제품 E2E 검증과는 분리된 평가 체계입니다.", ["benchmarks/"]),
    feature("Sample Harness Fixtures", STATUS.DEPRECATED_SAMPLE, "top_down_collectible 등은 제품 운영 시나리오가 아니라 예제/fixture로 분류해야 합니다.", ["harness/scenarios/top_down_collectible.json", "examples/harness/scenarios/top_down_collectible.example.json"]),
    feature("Root UnityPackage Mirror", packageStatus.rootMirrorExists ? STATUS.DEPRECATED_SAMPLE : STATUS.VERIFIED, packageStatus.rootMirrorExists ? "루트 UnityPackage는 설치 편의 mirror/deprecated artifact로만 취급합니다." : "루트 mirror가 없습니다.", ["UnityPackage/"])
  ];

  const blockers = releaseBlockers({ doctor, release, graphClass, hasOperationalScenario, hasPassedEvidence, exampleContamination });
  const normalizedE2eSteps = createE2eSteps({
    graph,
    graphClass,
    bridgeHealth,
    compileCheck,
    evidence,
    hasPassedEvidence,
    traceability,
    dashboard,
    operationalScenarios,
    latestOperationalEvidence
  });
  const report = {
    schemaVersion: "1.0.0",
    reportId: `PRODSTAT-${generatedAt.replace(/[:.]/g, "-")}`,
    generatedAt,
    product: "AInvil",
    graphClassification: graphClass,
    summary: summarize(features, normalizedE2eSteps, blockers),
    canonicalUnityBridgePackage: packageStatus,
    inputBridge,
    operationalValidation: {
      scenarioCount: operationalScenarios.length,
      scenarios: operationalScenarios.map((item) => ({
        id: item.data.id,
        title: item.data.title,
        evidenceOutputPath: item.data.evidenceOutputPath || null
      })),
      latestEvidence: latestOperationalEvidence ? {
        evidenceId: latestOperationalEvidence.data.evidenceId,
        scenarioId: latestOperationalEvidence.data.scenarioId,
        classification: latestOperationalEvidence.data.classification || "Operational",
        status: latestOperationalEvidence.data.status,
        validationLevel: latestOperationalEvidence.data.validationLevel,
        failureClass: latestOperationalEvidence.data.failureClass,
        path: relativeAInvilPath(latestOperationalEvidence.path)
      } : null
    },
    productMvpWorkflow: productMvp,
    releaseLevel: {
      coreReleaseReady: release.data?.decision === "Release Ready",
      coreRcReproducibilityVerified: await coreRcReproducibilityVerified(),
      canonicalUnityBridgePackageVerified: packageStatus.canonicalExists,
      productMvpWorkflow: productMvp.status,
      humanPlayabilityReview: productMvp.humanPlayabilityReview.status,
      buildVerification: productMvp.buildVerification.status,
      productMvpReadyCandidate: productMvp.readyCandidate,
      publicReleaseReady: false
    },
    exampleContamination,
    e2eHappyPath: normalizedE2eSteps,
    featureStatuses: features,
    releaseBlockers: blockers,
    nextCommands: [
      "node plugins/ainvil/cli/ainvil-cli.mjs productization",
      "node plugins/ainvil/cli/ainvil-cli.mjs doctor",
      "node plugins/ainvil/cli/ainvil-cli.mjs release",
      "node plugins/ainvil/scripts/run-ainvil-live-harness.mjs --mode probe --scenario <project-scenario-id>",
      "node plugins/ainvil/scripts/run-ainvil-live-harness.mjs --mode probe --scenario dungeon_recovery_first_playable_e2e"
    ]
  };

  if (options.write !== false) {
    const jsonPath = resolveAInvilPath(options.jsonPath || DEFAULT_JSON);
    const markdownPath = resolveAInvilPath(options.markdownPath || DEFAULT_MARKDOWN);
    await mkdir(path.dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(markdownPath, formatProductizationMarkdown(report), "utf8");
    return { path: jsonPath, markdownPath, data: report };
  }
  return { path: null, markdownPath: null, data: report };
}

function classifyGraph(graph) {
  if (!graph) return "Missing";
  const text = `${graph.graphId || ""} ${graph.projectId || ""} ${graph.projectName || ""}`;
  if (/Example/i.test(text)) return "Example";
  if (/Productization|AInvil/i.test(text)) return "Operational";
  return "Unknown";
}

function scenarioClassification(scenario) {
  if (scenario?.classification) return scenario.classification;
  if (/top_down_collectible|inventory_grid_ui|character_animation_binding/i.test(`${scenario?.id || ""}`)) return "Example";
  return "Operational";
}

function isSampleEvidence(evidence) {
  if (evidence?.classification === "Operational") return false;
  return /top.down.collectible|scenario_top_down_collectible|sample|example/i.test(`${evidence?.scenarioId || ""} ${evidence?.evidenceId || ""}`);
}

function latestOperationalEvidenceRecord(evidenceRecords) {
  const records = evidenceRecords
    .filter((item) => item.data?.classification === "Operational" && !isSampleEvidence(item.data))
    .sort((left, right) => new Date(right.data?.finishedAt || right.data?.timestamp || 0) - new Date(left.data?.finishedAt || left.data?.timestamp || 0));
  return records[0] || null;
}

function productMvpWorkflowStatus(scenarios, evidenceRecords, latestHarness, playabilityReview, buildVerification) {
  const scenario = scenarios.find((item) => item.data?.id === "dungeon_recovery_first_playable_e2e");
  const records = evidenceRecords
    .filter((item) => item.data?.scenarioId === "dungeon_recovery_first_playable_e2e"
      && item.data?.classification === "Operational"
      && (item.data?.validationType === "UnityFeatureE2E" || item.data?.validationLevel === "Play Mode Verified"))
    .sort((left, right) => new Date(right.data?.finishedAt || right.data?.timestamp || 0) - new Date(left.data?.finishedAt || left.data?.timestamp || 0));
  const latestEvidence = records[0] || null;
  const latestHarnessScenario = latestHarness.data?.scenarios?.find((item) => item.id === "dungeon_recovery_first_playable_e2e") || null;
  const status = latestEvidence
    ? latestEvidence.data.status
    : scenario
      ? "Not Run"
      : "Blocked";
  return {
    scenarioExists: Boolean(scenario),
    scenarioId: scenario?.data?.id || null,
    category: scenario?.data?.category || "ProductMvp",
    validationType: scenario?.data?.validationType || "UnityFeatureE2E",
    status,
    humanPlayabilityReview: {
      status: playabilityReview.exists ? playabilityReview.data?.playabilityReviewStatus || "Unknown" : "Not Run",
      reportPath: playabilityReview.exists ? relativeAInvilPath(playabilityReview.path) : null,
      remainingIssues: playabilityReview.data?.remainingPlayabilityIssues || []
    },
    buildVerification: {
      status: buildVerification.exists ? buildVerification.data?.buildVerificationStatus || "Unknown" : "Not Run",
      outputPath: buildVerification.data?.buildOutputPath || null,
      reportPath: buildVerification.exists ? relativeAInvilPath(buildVerification.path) : null,
      failureReason: buildVerification.data?.failureReason || null
    },
    readyCandidate: latestEvidence?.data?.status === "Passed"
      && latestEvidence?.data?.category === "ProductMvp"
      && latestEvidence?.data?.validationLevel === "Play Mode Verified"
      && latestEvidence?.data?.isJobComplete === true,
    latestEvidence: latestEvidence ? {
      evidenceId: latestEvidence.data.evidenceId,
      status: latestEvidence.data.status,
      validationLevel: latestEvidence.data.validationLevel,
      totalRecoveryTargetCount: latestEvidence.data.totalRecoveryTargetCount ?? null,
      afterThirdRecoveryCount: latestEvidence.data.afterThirdRecoveryCount ?? null,
      isJobComplete: latestEvidence.data.isJobComplete ?? null,
      progressText: latestEvidence.data.progressText ?? null,
      path: relativeAInvilPath(latestEvidence.path)
    } : null,
    latestHarness: latestHarnessScenario ? {
      status: latestHarnessScenario.status,
      reportPath: latestHarness.exists ? relativeAInvilPath(latestHarness.path) : null
    } : null,
    nextAction: latestEvidence?.data?.status === "Passed"
      ? "Treat as Product MVP Ready Candidate evidence; continue manual playability and public install gates separately."
      : scenario
        ? "Run the Product MVP live harness scenario in the target Unity project."
        : "Create the dungeon_recovery_first_playable_e2e operational scenario."
  };
}

async function coreRcReproducibilityVerified() {
  const fresh = await loadJsonArtifact("reports/fresh_workspace_verification_report.json");
  return fresh.exists && fresh.data?.status === "Passed"
    && (fresh.data?.canonicalPackageVerified === true || fresh.data?.packageInstallCheck?.canonicalPackageVerified === true);
}

function createE2eSteps({ graph, graphClass, bridgeHealth, compileCheck, evidence, hasPassedEvidence, traceability, dashboard, operationalScenarios, latestOperationalEvidence }) {
  return [
    step("E2E-001", "User request intake", "Codex Plugin / Orchestrator", STATUS.SPEC_ONLY, "Defined by interactive agent instructions; not yet stored as a standalone runtime event.", "Add request IDs to run logs when product telemetry is introduced."),
    step("E2E-002", "Feature/Requirement/Task/Acceptance registration", "Production State Graph", graph.exists && graphClass === "Operational" ? STATUS.PARTIAL : STATUS.BLOCKED, graph.exists ? `Current graph classification: ${graphClass}` : "No production graph exists.", graphClass === "Operational" ? "Continue adding real project requirements." : "Run init-production-graph or create a project-specific graph."),
    step("E2E-003", "Unity change dry-run", "Workflow Transition / Executor", STATUS.PARTIAL, "Guarded transition dry-run exists, but project-specific Unity change-set dry-run is not generalized yet.", "Connect project-specific Unity change sets to transition candidates."),
    step("E2E-004", "Unity Bridge apply/read path", "MCP Unity Server / Unity Editor Bridge", bridgeHealth?.status === "Passed" ? STATUS.PARTIAL : STATUS.BLOCKED, bridgeHealth?.message || "Unity Bridge health has not passed.", "Open Unity, install the canonical package, and run Tools > Codex Unity Bridge > Start Server."),
    step("E2E-005", "Compile check", "Onboarding Doctor / unity_compile_status", compileCheck?.status === "Passed" ? STATUS.VERIFIED : STATUS.BLOCKED, compileCheck?.message || "Compile check has not passed.", "Rerun doctor after Unity Bridge connectivity is restored."),
    step("E2E-006", "Operational validation scenario registration", "Live Harness", operationalScenarios.length > 0 ? STATUS.VERIFIED : STATUS.BLOCKED, `${operationalScenarios.length} operational scenario(s) detected.`, "Keep at least one classification=Operational scenario for release gates."),
    step("E2E-007", "Play Mode or Unity inspection validation", "Live Harness / Input Agent", hasPassedEvidence ? STATUS.VERIFIED : STATUS.BLOCKED, latestOperationalEvidence ? `Latest operational evidence status: ${latestOperationalEvidence.data.status}` : "No operational evidence exists yet.", "Run the operational bridge smoke scenario after Unity Bridge and compile checks pass."),
    step("E2E-008", "Evidence export", "validation/evidence", evidence.length > 0 ? (hasPassedEvidence ? STATUS.VERIFIED : STATUS.PARTIAL) : STATUS.BLOCKED, `${evidence.length} evidence file(s) detected; non-sample Passed evidence=${hasPassedEvidence}.`, "Keep sample evidence separate and link operational evidence to acceptance IDs."),
    step("E2E-009", "Traceability refresh", "Traceability View", traceability.exists ? STATUS.PARTIAL : STATUS.BLOCKED, traceability.exists ? "Traceability view exists; operational evidence linkage still depends on a Passed run." : "Traceability view is missing.", "Regenerate traceability after operational evidence is captured."),
    step("E2E-010", "Dashboard refresh", "Project Dashboard", dashboard.exists ? STATUS.PARTIAL : STATUS.BLOCKED, dashboard.exists ? "Dashboard exists and can show productization status." : "Dashboard is missing.", "Run generate-project-dashboard after productization report updates.")
  ];
}

function step(id, name, owner, status, evidence, nextAction) {
  return { id, name, owner, status, evidence, nextAction };
}

function feature(name, status, evidence, paths) {
  return { name, status, evidence, paths };
}

async function packageInventory() {
  const canonicalPath = "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge";
  const mirrorPath = "UnityPackage/Packages/com.codex.unity-bridge";
  const canonicalExists = await exists(resolveAInvilPath("unity-package/Packages/com.codex.unity-bridge/package.json"));
  const rootMirrorExists = await exists(path.resolve(pluginRoot, "..", "..", "UnityPackage", "Packages", "com.codex.unity-bridge", "package.json"));
  return {
    canonicalSource: canonicalPath,
    installPathForUsers: "plugins/ainvil/unity-package/Packages/com.codex.unity-bridge/package.json",
    rootMirror: mirrorPath,
    canonicalExists,
    rootMirrorExists,
    rootMirrorRole: rootMirrorExists ? "Deprecated/Mirror install artifact; do not treat as source of truth." : "Not present",
    summary: canonicalExists
      ? "Plugin-local unity-package is the canonical package source."
      : "Canonical plugin-local Unity package is missing."
  };
}

async function inputBridgeInventory() {
  const files = [
    { role: "Preferred runtime bridge", path: "unity-package/Packages/com.codex.unity-bridge/Runtime/AInvilRuntimeInputTestBridge.cs", componentType: "Codex.UnityBridge.AInvilRuntimeInputTestBridge" },
    { role: "Compatibility/sample bridge", path: "unity-package/Packages/com.codex.unity-bridge/Runtime/AInvilInputTestBridge.cs", componentType: "Codex.UnityBridge.AInvilInputTestBridge" }
  ];
  for (const item of files) item.exists = await exists(resolveAInvilPath(item.path));
  return {
    preferredComponentType: "Codex.UnityBridge.AInvilRuntimeInputTestBridge",
    compatibilityComponentType: "Codex.UnityBridge.AInvilInputTestBridge",
    preferredExists: files[0].exists,
    files,
    summary: files[0].exists
      ? "Use AInvilRuntimeInputTestBridge for production validation; keep AInvilInputTestBridge only for compatibility/sample scenes."
      : "Preferred runtime input bridge is missing."
  };
}

function contaminationFindings(graph, scenarios, evidenceRecords) {
  const findings = [];
  if (classifyGraph(graph) === "Example") {
    findings.push({ kind: "ExampleGraph", status: STATUS.BLOCKED, summary: "state/production_state_graph.json still points to Example AInvil Project." });
  }
  for (const item of scenarios) {
    if (scenarioClassification(item.data) === "Example") {
      findings.push({ kind: "ExampleScenario", status: STATUS.DEPRECATED_SAMPLE, summary: `${relativeAInvilPath(item.path)} is an example harness scenario.` });
    }
  }
  for (const item of evidenceRecords) {
    if (isSampleEvidence(item.data)) {
      findings.push({ kind: "SampleEvidence", status: STATUS.DEPRECATED_SAMPLE, summary: `${relativeAInvilPath(item.path)} is sample evidence and must not satisfy operational release gates.` });
    }
  }
  return findings;
}

function releaseBlockers({ doctor, release, graphClass, hasOperationalScenario, hasPassedEvidence, exampleContamination }) {
  const blockers = [];
  if (graphClass !== "Operational") {
    blockers.push(blocker("BLOCKER-GRAPH-001", "Example graph contamination", `Current graph classification is ${graphClass}.`, "Run init-production-graph or create a project-specific graph before release."));
  }
  if (!hasOperationalScenario) {
    blockers.push(blocker("BLOCKER-HARNESS-001", "No operational validation scenario", "Only sample/fixture scenarios are detected.", "Create a project-specific scenario under harness/scenarios with classification=Operational."));
  }
  if (!hasPassedEvidence) {
    blockers.push(blocker("BLOCKER-EVIDENCE-001", "Validation evidence missing", "No non-sample Passed validation evidence is available.", "Run a project-specific live harness apply after Unity Bridge and compile checks pass."));
  }
  for (const check of doctor.data?.checks || []) {
    if (["Blocked", "Failed"].includes(check.status)) {
      blockers.push(blocker(`BLOCKER-DOCTOR-${check.id}`, check.id, check.message, check.nextAction || "Resolve the doctor check."));
    }
  }
  for (const gate of release.data?.blockers || []) {
    blockers.push(blocker(`BLOCKER-RELEASE-${gate.gateId}`, gate.title, gate.evidence, gate.nextAction));
  }
  for (const finding of exampleContamination.filter((item) => item.kind === "ExampleGraph")) {
    blockers.push(blocker("BLOCKER-CONTAMINATION-001", finding.kind, finding.summary, "Keep examples under examples/ and regenerate operational reports from the production graph."));
  }
  return uniqueBlockers(blockers);
}

function blocker(id, title, evidence, nextAction) {
  return { id, title, status: STATUS.BLOCKED, evidence, nextAction };
}

function uniqueBlockers(blockers) {
  const byId = new Map();
  for (const item of blockers) byId.set(item.id, item);
  return [...byId.values()];
}

function summarize(features, steps, blockers) {
  return {
    featureCounts: countByStatus(features),
    e2eCounts: countByStatus(steps),
    blockerCount: blockers.length,
    decision: blockers.length ? "Not Release Ready" : "Release Candidate"
  };
}

function countByStatus(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
}

function formatProductizationMarkdown(report) {
  return [
    "# AInvil Productization Status",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Decision: ${report.summary.decision}`,
    `- Graph classification: ${report.graphClassification}`,
    `- Release blockers: ${report.releaseBlockers.length}`,
    "",
    "## Feature Status",
    "",
    "| Feature | Status | Evidence |",
    "| --- | --- | --- |",
    ...report.featureStatuses.map((item) => `| ${esc(item.name)} | ${item.status} | ${esc(item.evidence)} |`),
    "",
    "## Minimum E2E Happy Path",
    "",
    "| Step | Owner | Status | Evidence | Next action |",
    "| --- | --- | --- | --- | --- |",
    ...report.e2eHappyPath.map((item) => `| ${esc(item.name)} | ${esc(item.owner)} | ${item.status} | ${esc(item.evidence)} | ${esc(item.nextAction)} |`),
    "",
    "## Release Blockers",
    "",
    "| Blocker | Evidence | Next action |",
    "| --- | --- | --- |",
    ...(report.releaseBlockers.length
      ? report.releaseBlockers.map((item) => `| ${esc(item.title)} | ${esc(item.evidence)} | ${esc(item.nextAction)} |`)
      : ["| None | None | None |"]),
    "",
    "## Unity Bridge Package",
    "",
    `- Canonical source: ${report.canonicalUnityBridgePackage.canonicalSource}`,
    `- Root mirror role: ${report.canonicalUnityBridgePackage.rootMirrorRole}`,
    "",
    "## Input Bridge Role",
    "",
    `- Preferred: ${report.inputBridge.preferredComponentType}`,
    `- Compatibility: ${report.inputBridge.compatibilityComponentType}`,
    "",
    "## Product MVP Workflow",
    "",
    `- Scenario: ${report.productMvpWorkflow.scenarioId || "Missing"}`,
    `- Status: ${report.productMvpWorkflow.status}`,
    `- Human Playability Review: ${report.productMvpWorkflow.humanPlayabilityReview.status}`,
    `- Build Verification: ${report.productMvpWorkflow.buildVerification.status}`,
    `- Product MVP Ready Candidate: ${report.productMvpWorkflow.readyCandidate ? "Yes" : "No"}`,
    `- Latest evidence: ${report.productMvpWorkflow.latestEvidence?.path || "Missing"}`,
    `- Public Release Ready: ${report.releaseLevel.publicReleaseReady ? "Yes" : "No"}`,
    ""
  ].join("\n");
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}

async function exists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
