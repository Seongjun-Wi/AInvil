#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import {
  existsAInvilArtifact,
  findLatestAInvilFile,
  loadBenchmarkCases,
  loadKpiArtifacts,
  loadProductionIntelligenceReport,
  loadProductionStateGraph,
  loadReviewRecords,
  loadWorkflowExecutionRecords,
  loadValidationEvidence,
  loadJsonArtifact
} from "../core/loaders.mjs";
import {
  formatFinding,
  formatNode,
  formatRelativePath,
  formatRisk,
  summarizeBenchmarks,
  summarizeGraph,
  summarizeHealth,
  summarizeIntelligenceReport,
  summarizeKpi,
  summarizeReviews,
  summarizeStatus,
  summarizeValidationCoverage
} from "../core/summaries.mjs";
import { checkRequiredArtifacts } from "../core/artifact-checks.mjs";
import { pluginRoot, relativeAInvilPath, resolveAInvilPath } from "../core/ainvil-paths.mjs";
import { createWorkflowRuntimeReport } from "../core/workflow-report.mjs";
import { createWorkflowTransitionPlan } from "../core/workflow-transitions.mjs";
import { createWorkflowTransitionApproval } from "../core/workflow-approvals.mjs";
import { executeApprovedTransition } from "../core/workflow-executor.mjs";
import { runGuardedWorkflowRuntime } from "../core/workflow-runtime.mjs";
import { createTraceabilityView } from "../core/traceability-view.mjs";
import { createProjectDashboard } from "../core/project-dashboard.mjs";
import { createSyncReport } from "../core/sync-report.mjs";
import { runOnboardingDoctor } from "../core/workspace-manager.mjs";
import { createReleaseReadinessReport } from "../core/release-readiness.mjs";
import { createInitialProductionGraph, createProductizationStatusReport } from "../core/productization-status.mjs";
import { evaluateProductionCoreReview } from "../core/production-core-review.mjs";
import { createRcBaselineManifest } from "../core/rc-baseline.mjs";

const command = process.argv[2] || "help";

const commands = new Map([
  ["help", showHelp],
  ["status", showStatus],
  ["graph", showGraph],
  ["intelligence", showIntelligence],
  ["reviews", showReviews],
  ["benchmark", showBenchmark],
  ["kpi", showKpi],
  ["workflow", showWorkflow],
  ["transitions", showTransitions],
  ["approvals", showApprovals],
  ["executions", showExecutions],
  ["evidence", showEvidence],
  ["traceability", showTraceability],
  ["dashboard", showDashboard],
  ["sync", showSync],
  ["productization", showProductization],
  ["init-production-graph", initProductionGraph],
  ["gate", showGate],
  ["review", showReviewEvaluation],
  ["release", showRelease],
  ["rc", showRcBaseline],
  ["regression", runRegression],
  ["execute-transition", runTransitionExecution],
  ["execute", runRuntime],
  ["doctor", runDoctor]
]);

if (!commands.has(command)) {
  console.error(`Unknown command: ${command}`);
  console.error("Run: node plugins/ainvil/cli/ainvil-cli.mjs help");
  process.exit(1);
}

await commands.get(command)();

function showHelp() {
  console.log(`AInvil CLI Prototype

Usage:
  node plugins/ainvil/cli/ainvil-cli.mjs <command>

Commands:
  status        Summarize current project state.
  graph         Validate references and summarize the Production State Graph.
  intelligence  Read the Production Intelligence Report.
  reviews       Summarize review records.
  benchmark     Summarize benchmark datasets and report availability.
  kpi           Summarize KPI framework and dashboard availability.
  workflow      Generate an in-memory Workflow Runtime Report summary.
  transitions   Generate an in-memory Workflow Transition Plan summary.
  approvals     Generate an in-memory Workflow Transition Approval summary.
  executions    List workflow execution records.
  evidence      List validation evidence records.
  traceability  Show generated or in-memory traceability view.
  dashboard     Show generated or in-memory project dashboard.
  sync          Show generated or in-memory sync report.
  productization  Generate and show productization/E2E status.
  init-production-graph  Reset state/production_state_graph.json to the operational AInvil productization graph.
  gate          Show Production Core gate decision.
  review        Reevaluate the Production Core review against current evidence.
  release       Generate and show the launch readiness decision.
  rc            Generate and show the Core Release Candidate baseline manifest.
  regression    Run the offline regression suite. Pass --live-smoke, --product-mvp, --playability, or --build for live/product gates.
  execute-transition  Execute or dry-run a guarded transition. Use --transition <id> and optional --apply.
  execute       Run guarded workflow synchronization and persist runtime artifacts.
  doctor        Run onboarding health checks and write workspace/doctor reports.

Most commands are read-only. The doctor command writes state/workspace_manifest.json and reports/onboarding_doctor_report.json. The productization command writes reports/productization_status_report.*. The execute command writes workflow reports, a run record, generated dashboard/traceability views, and a graph next-action sync. It does not modify Unity or promote validation without evidence.`);
}

async function showStatus() {
  const graph = await loadProductionStateGraph();
  const report = await loadProductionIntelligenceReport();
  const kpiDashboard = await findLatestAInvilFile("reports", /kpi.*\.(md|json)$/i);

  printHeader("AInvil Status");
  if (!graph.exists) {
    printMissing("Production State Graph", graph.path);
    return;
  }

  const summary = summarizeStatus(graph.data, report.exists ? report.data : null, kpiDashboard);
  printField("Project", summary.project);
  printField("Vision", formatNode(summary.vision));
  printField("Milestone", formatNode(summary.milestone));
  printField("Active feature", formatNode(summary.activeFeature));
  printField("Health", summarizeHealth(summary.healthSummary));
  printField("Blocked tasks", summary.blockedNodes.length ? `${summary.blockedNodes.length}` : "None found");
  printField("Next recommended action", summary.nextAction?.title || "Unknown");
  if (summary.nextAction?.reason) printField("Reason", summary.nextAction.reason);

  if (report.exists) {
    printField("Intelligence summary", summary.intelligenceSummary || "No summary");
    printField("Validation coverage", summarizeValidationCoverage(summary.validationCoverage));
  } else {
    printField("Intelligence summary", `Missing (${relativeAInvilPath(report.path)})`);
  }

  printField("KPI dashboard", summary.kpiDashboardPath ? formatRelativePath(summary.kpiDashboardPath) : "No KPI dashboard values found");
}

async function showGraph() {
  const graph = await loadProductionStateGraph();
  printHeader("Production State Graph");
  if (!graph.exists) {
    printMissing("Production State Graph", graph.path);
    return;
  }

  const summary = summarizeGraph(graph.data);
  printField("Graph ID", summary.graphId);
  printField("Nodes", `${summary.nodeCount}`);
  printCounts("Node counts by type", summary.nodeCountsByType);
  printField("Edges", `${summary.edgeCount}`);
  printCounts("Edge counts by type", summary.edgeCountsByType);
  printField("Invalid edge references", summary.invalidEdgeReferences.length ? `${summary.invalidEdgeReferences.length}` : "None found");
  for (const edge of summary.invalidEdgeReferences) {
    console.log(`  - ${edge.id || "(missing id)"}: ${edge.from} -> ${edge.to}`);
  }
  printField("Missing links", summary.missingLinks.length ? `${summary.missingLinks.length}` : "None found");
  for (const link of summary.missingLinks) console.log(`  - ${link}`);
  printField("Open questions", summary.openQuestions.length ? `${summary.openQuestions.length}` : "None found");
  for (const node of summary.openQuestions) console.log(`  - ${formatNode(node)}`);
  printField("Blocked nodes", summary.blockedNodes.length ? `${summary.blockedNodes.length}` : "None found");
  for (const node of summary.blockedNodes) console.log(`  - ${formatNode(node)}`);
}

async function showIntelligence() {
  const report = await loadProductionIntelligenceReport();
  printHeader("Production Intelligence");
  if (!report.exists) {
    printMissing("Production Intelligence Report", report.path);
    console.log("This CLI is read-only and will not generate the report.");
    return;
  }

  const summary = summarizeIntelligenceReport(report.data);
  printField("Report ID", summary.reportId);
  printField("Generated at", summary.generatedAt);
  printField("Summary", summary.summary);
  printList("Health", summary.health.map((item) => `${item.category}: ${item.status} - ${item.reason}`));
  printList("Coverage gaps", summary.coverageGaps.map(formatFinding));
  printList("Risks", summary.risks.map(formatFinding));
  printList("Recommendations", summary.recommendations.map((item) => `${item.recommendationId || "Recommendation"}: ${item.title || item.summary || item.reason || "No summary"}`));
  printField("Validation coverage", summarizeValidationCoverage(summary.validationCoverage));
}

async function showReviews() {
  const reviewFiles = await loadReviewRecords();
  printHeader("Review Records");
  if (reviewFiles.length === 0) {
    console.log("No review records found.");
    return;
  }

  const summary = summarizeReviews(reviewFiles);
  printField("Review records", `${summary.count}`);
  printCounts("Review count by type", summary.countsByType);
  printField("Pending reviews", `${summary.pending.length}`);
  printField("Changes requested", `${summary.changesRequested.length}`);
  printField("Approved reviews", `${summary.approved.length}`);
  printList("Major risks", summary.majorRisks.map(formatRisk));
}

async function showBenchmark() {
  const benchmarkFiles = await loadBenchmarkCases();
  const summary = summarizeBenchmarks(benchmarkFiles, {
    scoringRubricAvailable: await existsAInvilArtifact("templates/scoring_rubric.md"),
    benchmarkReportTemplateAvailable: await existsAInvilArtifact("templates/benchmark_report.md"),
    latestBenchmarkReportPath: await findLatestAInvilFile("benchmarks/reports", /\.(md|json)$/i)
  });

  printHeader("Capability Benchmark");
  printField("Benchmark cases", `${summary.count}`);
  printCounts("Case count by category", summary.countsByCategory);
  printList("Missing expected outputs", summary.missingExpectedOutputs);
  printField("Scoring rubric", summary.scoringRubricAvailable ? "Available" : "Missing");
  printField("Benchmark report template", summary.benchmarkReportTemplateAvailable ? "Available" : "Missing");
  printField("Latest benchmark report", summary.latestBenchmarkReportPath ? formatRelativePath(summary.latestBenchmarkReportPath) : "No benchmark report found");
}

async function showKpi() {
  const summary = summarizeKpi(await loadKpiArtifacts());
  printHeader("Studio KPI");
  printList("Known KPI categories", summary.categories);
  printField("Collection strategy", summary.collectionStrategyAvailable ? "Available" : "Missing");
  printField("Review process", summary.reviewProcessAvailable ? "Available" : "Missing");
  printField("Dashboard template", summary.dashboardTemplateAvailable ? "Available" : "Missing");
  printField("Dashboard values", summary.latestDashboardPath ? formatRelativePath(summary.latestDashboardPath) : "No KPI dashboard values found");
  printList("Available evidence sources", summary.evidenceSources);
  printList("Missing KPI data", summary.missingData);
}

async function showWorkflow() {
  const report = await createWorkflowRuntimeReport();
  printHeader("Workflow Runtime Report");
  printField("Report ID", report.reportId);
  printField("Generated at", report.generatedAt);
  printField("Current vision", report.currentState.currentVision ? `${report.currentState.currentVision.title} (${report.currentState.currentVision.nodeId})` : "Unknown");
  printField("Current milestone", report.currentState.currentMilestone ? `${report.currentState.currentMilestone.title} (${report.currentState.currentMilestone.nodeId})` : "Unknown");
  printField("Active feature", report.currentState.activeFeature ? `${report.currentState.activeFeature.title} (${report.currentState.activeFeature.nodeId})` : "Unknown");
  printField("Workflow blockers", `${report.workflowBlockers.length}`);
  printList("Top blockers", report.workflowBlockers.slice(0, 5).map((item) => `${item.kind}: ${item.summary}`));
  printField("Pending reviews", `${report.reviewStatus.pendingReviewIds.length}`);
  printField("Changes requested", `${report.reviewStatus.changesRequestedReviewIds.length}`);
  printField("Missing required reviews", `${report.reviewStatus.missingRequiredReviews.length}`);
  printField("Validation level gaps", `${report.validationStatus.validationLevelGaps.length}`);
  printField("Acceptance criteria without evidence", `${report.validationStatus.acceptanceCriteriaWithoutEvidence.length}`);
  printField("Benchmark report", report.benchmarkKpiStatus.latestBenchmarkReportAvailable ? report.benchmarkKpiStatus.latestBenchmarkReportPath : "Missing");
  printField("KPI dashboard", report.benchmarkKpiStatus.kpiDashboardAvailable ? report.benchmarkKpiStatus.kpiDashboardPath : "Missing");
  printField("Next action", report.nextAction.title);
  printField("Reason", report.nextAction.reason);
  printField("Suggested owner", report.nextAction.suggestedOwner);
  printField("Evidence status", report.nextAction.evidenceStatus);
}

async function showTransitions() {
  const plan = await createWorkflowTransitionPlan();
  const available = plan.transitionCandidates.filter((item) => item.status === "Available");
  const blocked = plan.transitionCandidates.filter((item) => item.status === "Blocked");
  const needsReview = plan.transitionCandidates.filter((item) => item.status === "Needs Review");
  printHeader("Workflow Transition Plan");
  printField("Plan ID", plan.planId);
  printField("Source report", plan.sourceReportId);
  printField("Execution allowed", `${plan.executionPolicy.executionAllowed}`);
  printField("Available transitions", `${available.length}`);
  printField("Blocked transitions", `${blocked.length}`);
  printField("Needs review", `${needsReview.length}`);
  printList("Available transition candidates", available.map(formatTransition));
  printList("Blocked transition candidates", blocked.map(formatTransition));
  printField("Safest next transition", plan.safestNextTransition.transitionType === "NoSafeTransition" ? "No safe transition available" : formatTransition(plan.safestNextTransition));
  printField("Reason", plan.safestNextTransition.reason);
}

async function showApprovals() {
  const approval = await createWorkflowTransitionApproval();
  const autoEligible = approval.approvalRecords.filter((item) => item.approvalClass === "AutoEligible");
  const approvalRequired = approval.approvalRecords.filter((item) => ["UserApprovalRequired", "ReviewRequired", "EvidenceRequired"].includes(item.approvalClass));
  const blocked = approval.approvalRecords.filter((item) => item.approvalClass === "Blocked");
  const forbidden = approval.approvalRecords.filter((item) => item.approvalClass === "Forbidden");
  printHeader("Workflow Transition Approval");
  printField("Approval ID", approval.approvalId);
  printField("Source plan", approval.sourcePlanId);
  printField("Execution allowed", `${approval.executionPolicy.executionAllowed}`);
  printCounts("Approval classes", approval.summary.byApprovalClass);
  printCounts("Execution readiness", approval.summary.byReadiness);
  printCounts("Safety levels", approval.summary.bySafetyLevel);
  printList("Auto-eligible transitions", autoEligible.map(formatApproval));
  printList("Approval-required transitions", approvalRequired.map(formatApproval));
  printList("Blocked transitions", blocked.map(formatApproval));
  printList("Forbidden transitions", forbidden.map(formatApproval));
  printField("Safest next approved action", approval.safestNextApprovedAction.transitionId);
  printField("Reason", approval.safestNextApprovedAction.reason);
  printField("User-facing message", approval.safestNextApprovedAction.userFacingMessage);
}

async function showExecutions() {
  const records = (await loadWorkflowExecutionRecords()).filter((item) => item.name !== "latest.json");
  printHeader("Workflow Executions");
  if (records.length === 0) {
    console.log("No workflow execution records found.");
    return;
  }
  printField("Records", `${records.length}`);
  for (const item of records.slice(-10)) {
    const record = item.data;
    console.log(`  - ${record.executionId}: ${record.status} ${record.transitionId} (${record.transitionType})`);
  }
}

async function showEvidence() {
  const records = await loadValidationEvidence();
  printHeader("Validation Evidence");
  printField("Records", `${records.length}`);
  for (const item of records) console.log(`  - ${item.data.evidenceId}: ${item.data.status} ${item.data.scenarioId} (${item.data.validationLevel})`);
}

async function showTraceability() {
  const existing = await loadJsonArtifact("reports/traceability_view.json");
  const view = existing.exists ? existing.data : await createTraceabilityView();
  printHeader("Traceability View");
  printField("View ID", view.viewId);
  printField("Rows", `${view.rows.length}`);
  printCounts("Counts by status", view.summary.countsByStatus || {});
  printList("Top gaps", view.rows.filter((row) => row.status !== "Complete").slice(0, 5).map((row) => `${row.rowId}: ${row.status} - ${row.missingLinks.join(", ")}`));
}

async function showDashboard() {
  const existing = await loadJsonArtifact("reports/project_dashboard.json");
  const dashboard = existing.exists ? existing.data : await createProjectDashboard();
  printHeader("Project Dashboard");
  printField("Project", dashboard.projectName);
  printField("Milestone", dashboard.currentMilestone ? `${dashboard.currentMilestone.title} (${dashboard.currentMilestone.status})` : "Unknown");
  printField("Active feature", dashboard.activeFeature ? `${dashboard.activeFeature.title} (${dashboard.activeFeature.status})` : "Unknown");
  printField("Latest benchmark", dashboard.latestBenchmarkReport || "Missing");
  printField("Latest harness", dashboard.latestLiveHarnessReport || "Missing");
  printField("Latest execution", dashboard.latestExecutionRecord || "Missing");
  printField("Next action", dashboard.nextRecommendedAction?.title || "Unknown");
}

async function showSync() {
  const existing = await loadJsonArtifact("reports/sync_report.json");
  const report = existing.exists ? existing.data : await createSyncReport();
  printHeader("Sync Report");
  printField("Report ID", report.syncReportId);
  printField("Drift findings", `${report.driftFindings.length}`);
  printField("Blocked sync items", `${report.blockedSyncItems.length}`);
  printList("Recommended next actions", report.recommendedNextActions.map((action) => `${action.actionId}: ${action.summary}`));
}

async function showProductization() {
  const result = await createProductizationStatusReport();
  const report = result.data;
  printHeader("AInvil Productization Status");
  printField("JSON report", relativeAInvilPath(result.path));
  printField("Markdown report", relativeAInvilPath(result.markdownPath));
  printField("Decision", report.summary.decision);
  printField("Graph classification", report.graphClassification);
  printField("Core Release Ready", report.releaseLevel?.coreReleaseReady ? "Yes" : "No");
  printField("Core RC Reproducibility Verified", report.releaseLevel?.coreRcReproducibilityVerified ? "Yes" : "No");
  printField("Canonical Unity Bridge Package Verified", report.releaseLevel?.canonicalUnityBridgePackageVerified ? "Yes" : "No");
  printField("Product MVP Workflow", report.productMvpWorkflow ? report.productMvpWorkflow.status : "Unknown");
  printField("Human Playability Review", report.productMvpWorkflow?.humanPlayabilityReview?.status || "Unknown");
  printField("Build Verification", report.productMvpWorkflow?.buildVerification?.status || "Unknown");
  printField("Product MVP Ready Candidate", report.productMvpWorkflow?.readyCandidate ? "Yes" : "No");
  printField("Public Release Ready", report.releaseLevel?.publicReleaseReady ? "Yes" : "No");
  printCounts("Feature status counts", report.summary.featureCounts);
  printCounts("E2E status counts", report.summary.e2eCounts);
  printList("Release blockers", report.releaseBlockers.map((item) => `${item.id}: ${item.title} -> ${item.nextAction}`));
  printList("Next commands", report.nextCommands);
}

async function initProductionGraph() {
  const dryRun = process.argv.includes("--dry-run");
  const result = await createInitialProductionGraph({ write: !dryRun });
  printHeader("Production Graph Initialization");
  if (dryRun) {
    printField("Mode", "dry-run");
    printField("Graph ID", result.data.graphId);
    printField("Project", result.data.projectName);
    return;
  }
  printField("Written", relativeAInvilPath(result.path));
  printField("Graph ID", result.data.graphId);
  printField("Project", result.data.projectName);
  printField("Next action", result.data.nextRecommendedAction.title);
}

async function showGate() {
  const review = await loadJsonArtifact("reviews/production_core_readiness_review.json");
  printHeader("Production Core Gate");
  if (!review.exists) {
    console.log("No Production Core readiness review found.");
    return;
  }
  printField("Review ID", review.data.reviewId);
  printField("Decision", review.data.decision);
  printField("Confidence", review.data.confidence);
  printList("Findings", review.data.findings || []);
}

async function showReviewEvaluation() {
  const dryRun = process.argv.includes("--dry-run");
  const result = await evaluateProductionCoreReview({ writeReview: !dryRun });
  const evaluation = result.evaluation;
  printHeader("Production Core Review Evaluation");
  printField("Review ID", evaluation.reviewId);
  printField("Gate", evaluation.reviewedGateId);
  printField("Previous status", evaluation.previousStatus);
  printField("New status", evaluation.newStatus);
  printField("Evaluation report", relativeAInvilPath(result.evaluationPath));
  printField("Criteria report", relativeAInvilPath(result.criteriaPath));
  printList("Resolved changes", evaluation.resolvedChanges.map((item) => `${item.id}: ${item.summary}`));
  printList("Remaining changes", evaluation.remainingChanges.map((item) => `${item.id}: ${item.summary} -> ${item.nextAction}`));
  if (dryRun) printField("Mode", "dry-run");
}

async function showRelease() {
  const result = await createReleaseReadinessReport();
  const report = result.data;
  printHeader("Release Readiness");
  printField("Report", relativeAInvilPath(result.path));
  printField("Decision", report.decision);
  printField("Confidence", report.confidence);
  printField("Core Release Ready", report.releaseLevel?.coreReleaseReady ? "Yes" : "No");
  printField("Product MVP Workflow", report.releaseLevel?.productMvpWorkflow || "Unknown");
  printField("Human Playability Review", report.releaseLevel?.humanPlayabilityReview || "Unknown");
  printField("Build Verification", report.releaseLevel?.buildVerification || "Unknown");
  printField("Product MVP Ready Candidate", report.releaseLevel?.productMvpReadyCandidate ? "Yes" : "No");
  printField("Public Release Ready", report.releaseLevel?.publicReleaseReady ? "Yes" : "No");
  printList("Gates", report.gates.map((gate) => `${gate.status}: ${gate.gateId} - ${gate.title} (${gate.evidence})`));
  printList("Next actions", report.nextActions.map((action) => `${action.gateId}: ${action.summary}`));
}

async function showRcBaseline() {
  const result = await createRcBaselineManifest();
  const manifest = result.data;
  printHeader("AInvil RC Baseline");
  printField("Manifest", relativeAInvilPath(result.path));
  printField("Markdown", relativeAInvilPath(result.markdownPath));
  printField("RC", `${manifest.rcName} (${manifest.rcVersion})`);
  printField("Release level", manifest.releaseLevel.current);
  printField("Production Core review", manifest.decisions.productionCoreReview);
  printField("Release readiness", manifest.decisions.releaseReadiness);
  printField("Productization", manifest.decisions.productization);
  printField("Fresh workspace", manifest.freshWorkspaceVerification?.label || "Not Run");
  printField("Canonical Unity Bridge Package Verified", manifest.freshWorkspaceVerification?.canonicalPackageVerified ? "Yes" : "No");
  printList("Operational scenarios", manifest.operationalScenarios.map((item) => `${item.id}: ${item.path}`));
  printList("Known limitations", manifest.knownLimitations);
}

async function runRegression() {
  const passThrough = process.argv.slice(3);
  const result = await runNode("scripts/run-ainvil-regression-suite.mjs", passThrough);
  if (result.output.trim()) console.log(result.output.trim());
  if (result.code !== 0) process.exitCode = result.code;
}

async function runTransitionExecution() {
  const transitionIndex = process.argv.indexOf("--transition");
  const transitionId = transitionIndex >= 0 ? process.argv[transitionIndex + 1] : undefined;
  const apply = process.argv.includes("--apply");
  const result = await executeApprovedTransition({
    transitionId,
    mode: apply ? "apply" : "dryRun",
    allowMutations: apply
  });
  printHeader("Workflow Transition Execution");
  printField("Execution ID", result.executionRecord.executionId);
  printField("Status", result.executionRecord.status);
  printField("Transition", result.executionRecord.transitionId);
  printField("Blocked reason", result.blockedReason || "None");
  printList("Created files", result.createdFiles);
}

async function runRuntime() {
  const result = await runGuardedWorkflowRuntime();
  printHeader("Guarded Workflow Runtime");
  printField("Run ID", result.runRecord.runId);
  printField("Mode", result.runRecord.mode);
  printField("Applied operations", `${result.runRecord.appliedOperations.length}`);
  printField("Skipped transitions", `${result.runRecord.skippedTransitions.length}`);
  printField("Next action", result.runRecord.nextAction.title);
  printField("Reason", result.runRecord.nextAction.reason);
  printList("Artifacts", [
    "reports/workflow_runtime_report.json",
    "reports/workflow_transition_plan.json",
    "reports/workflow_transition_approval.json",
    "reports/workflow_run_latest.json",
    "reports/traceability_matrix.generated.md",
    "reports/project_dashboard.generated.md"
  ]);
}

async function runDoctor() {
  printHeader("AInvil Doctor");
  let failed = false;

  const unityProjectIndex = process.argv.indexOf("--unity-project");
  const unityProjectPath = unityProjectIndex >= 0 ? process.argv[unityProjectIndex + 1] : undefined;
  const doctor = await runOnboardingDoctor({ unityProjectPath });
  const doctorReport = doctor.report.data;

  printField("Workspace manifest", relativeAInvilPath(doctor.manifest.path));
  printField("Doctor report", relativeAInvilPath(doctor.report.path));
  printField("Release readiness", doctorReport.releaseReadiness);
  printField("Health checks", `${doctorReport.summary.passed} passed, ${doctorReport.summary.warning} warning, ${doctorReport.summary.failed} failed, ${doctorReport.summary.blocked} blocked`);
  printList("Onboarding next actions", doctorReport.nextActions.map((action) => `${action.checkId}: ${action.summary}`));

  for (const result of await checkRequiredArtifacts()) {
    console.log(`${result.exists ? "OK" : "MISSING"} ${result.relativePath}`);
    if (!result.exists) failed = true;
  }

  const checks = [
    ["Production State Graph", "scripts/validate-production-state-graph.mjs"],
    ["Production Intelligence Report", "scripts/validate-production-intelligence-report.mjs"],
    ["Review Records", "scripts/validate-review-records.mjs"],
    ["Benchmark Datasets", "scripts/validate-benchmark-datasets.mjs"],
    ["Onboarding Doctor", "scripts/validate-onboarding-doctor.mjs"]
  ];

  for (const [label, script] of checks) {
    const result = await runNode(script);
    console.log(`${result.code === 0 ? "OK" : "FAIL"} ${label}`);
    if (result.output.trim()) console.log(indent(result.output.trim()));
    if (result.code !== 0) failed = true;
  }

  console.log("SKIP Full plugin validation: read-only CLI does not run validators that may regenerate reports.");
  if (failed) process.exitCode = 1;
}

function runNode(relativeScript, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [resolveAInvilPath(relativeScript), ...args], {
      cwd: pluginRoot,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.on("error", (error) => resolve({ code: 1, output: error.message }));
    child.on("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

function printHeader(title) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
}

function printField(label, value) {
  console.log(`${label}: ${value}`);
}

function printCounts(label, counts) {
  console.log(`${label}:`);
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    console.log("  - None");
    return;
  }
  for (const [key, value] of entries) console.log(`  - ${key}: ${value}`);
}

function printList(label, items) {
  console.log(`${label}:`);
  if (!items || items.length === 0) {
    console.log("  - None");
    return;
  }
  for (const item of items) console.log(`  - ${item}`);
}

function printMissing(label, filePath) {
  console.log(`${label}: Missing (${relativeAInvilPath(filePath)})`);
}

function formatTransition(transition) {
  return `${transition.transitionId} [${transition.transitionType}, ${transition.status}, ${transition.priority}] -> ${transition.targetArtifactId}: ${transition.reason}`;
}

function formatApproval(record) {
  return `${record.transitionId} [${record.approvalClass}, ${record.executionReadiness}, ${record.safetyLevel}] -> ${record.targetArtifactId}: ${record.reason}`;
}

function indent(text) {
  return text
    .split(/\r?\n/)
    .map((line) => `  ${line}`)
    .join("\n");
}
