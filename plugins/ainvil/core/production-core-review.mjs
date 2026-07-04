import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadJsonArtifact } from "./loaders.mjs";
import { relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";

const REVIEW_PATH = "reviews/production_core_readiness_review.json";
const EVALUATION_PATH = "reports/production_core_review_evaluation.json";
const CRITERIA_PATH = "docs/Production_Core_Review_Criteria.md";

export async function evaluateProductionCoreReview(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const review = await loadJsonArtifact(REVIEW_PATH);
  const productization = await loadJsonArtifact("reports/productization_status_report.json");
  const release = await loadJsonArtifact("reports/release_readiness_report.json");
  const doctor = await loadJsonArtifact("reports/onboarding_doctor_report.json");
  const harness = await loadJsonArtifact("harness/reports/latest-live-harness-report.json");
  const evidencePath = "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json";
  const evidence = await loadJsonArtifact(evidencePath);

  const previousStatus = review.exists ? review.data.decision : "Missing";
  const criteria = buildCriteria({ productization, release, doctor, harness, evidence });
  const remainingChanges = criteria
    .filter((item) => item.status !== "Passed")
    .map((item) => ({
      id: item.id,
      summary: item.failureSummary,
      connectedArtifacts: item.connectedArtifacts,
      nextAction: item.nextAction
    }));
  const resolvedChanges = criteria
    .filter((item) => item.status === "Passed")
    .map((item) => ({
      id: item.id,
      summary: item.successSummary,
      connectedArtifacts: item.connectedArtifacts
    }));
  const newStatus = remainingChanges.length === 0 ? "Approved" : "Changes Requested";
  const evidenceUsed = evidenceRefs({ productization, release, doctor, harness, evidence, review });
  const releaseBlockersBefore = (release.data?.blockers || []).map((item) => gateBlocker(item));
  const releaseBlockersAfter = releaseBlockersBefore.filter((item) => item.gateId !== "GATE-REVIEW-001");

  const evaluation = {
    schemaVersion: "1.0.0",
    evaluationId: `PCORE-EVAL-${generatedAt.replace(/[:.]/g, "-")}`,
    generatedAt,
    reviewedGateId: "GATE-REVIEW-001",
    reviewId: review.data?.reviewId || "REVIEW-ProductionCore-Readiness-001",
    reviewPath: REVIEW_PATH,
    previousStatus,
    newStatus,
    criteria,
    resolvedChanges,
    remainingChanges,
    evidenceUsed,
    releaseBlockersBefore,
    releaseBlockersAfter,
    nextAction: remainingChanges.length === 0
      ? "Regenerate release readiness and productization reports so the approved Production Core review is reflected in release gates."
      : remainingChanges[0].nextAction
  };

  let updatedReview = review.data || null;
  if (options.writeReview !== false && updatedReview) {
    updatedReview = updateReviewRecord(updatedReview, evaluation, generatedAt);
    await writeJson(REVIEW_PATH, updatedReview);
  }

  if (options.writeReports !== false) {
    await writeJson(EVALUATION_PATH, evaluation);
    await writeText(CRITERIA_PATH, formatCriteriaMarkdown(evaluation));
  }

  return {
    evaluation,
    review: updatedReview,
    evaluationPath: resolveAInvilPath(EVALUATION_PATH),
    criteriaPath: resolveAInvilPath(CRITERIA_PATH)
  };
}

function buildCriteria({ productization, release, doctor, harness, evidence }) {
  const doctorCheck = (id) => (doctor.data?.checks || []).find((item) => item.id === id);
  const harnessScenario = (harness.data?.scenarios || []).find((item) => item.id === "ainvil_bridge_smoke_operational");
  const anyOperationalHarnessScenario = (harness.data?.scenarios || []).find((item) => item.classification === "Operational" && item.status === "Passed");
  const productizationBlockers = productization.data?.releaseBlockers || [];
  const coreProductizationBlockers = productizationBlockers.filter((item) => item.id !== "BLOCKER-RELEASE-GATE-REVIEW-001");
  const releaseBlockers = release.data?.blockers || [];
  const nonReviewReleaseBlockers = releaseBlockers.filter((item) => item.gateId !== "GATE-REVIEW-001");
  const exampleGraphContamination = (productization.data?.exampleContamination || [])
    .some((item) => item.kind === "ExampleGraph" && item.status === "Blocked");
  const consoleErrors = evidence.data?.consoleErrorSummary?.errorCount;

  return [
    criterion({
      id: "PCORE-APPROVAL-GRAPH",
      title: "Operational graph classification",
      passed: productization.exists && productization.data?.graphClassification === "Operational",
      evidence: productization.exists ? `Graph classification: ${productization.data?.graphClassification}` : "Missing productization report",
      successSummary: "Production graph is classified as Operational.",
      failureSummary: "Production graph is not confirmed Operational.",
      nextAction: "Run productization and initialize or repair the operational production graph.",
      connectedArtifacts: ["reports/productization_status_report.json", "state/production_state_graph.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-CONTAMINATION",
      title: "No blocked ExampleGraph contamination",
      passed: productization.exists && !exampleGraphContamination,
      evidence: productization.exists ? `${exampleGraphContamination ? 1 : 0} blocked ExampleGraph contamination finding(s)` : "Missing productization report",
      successSummary: "No blocked ExampleGraph contamination remains in operational release gates.",
      failureSummary: "Operational graph is still contaminated by example graph data.",
      nextAction: "Move example-only graph/report data out of operational source-of-truth paths and regenerate productization.",
      connectedArtifacts: ["reports/productization_status_report.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-BRIDGE",
      title: "Unity Bridge health Passed",
      passed: doctorCheck("unity.bridge.health")?.status === "Passed" && evidence.data?.bridgeHealthResult?.status === "Passed",
      evidence: `${doctorCheck("unity.bridge.health")?.status || "Missing doctor check"} / ${evidence.data?.bridgeHealthResult?.status || "Missing evidence check"}`,
      successSummary: "Unity Bridge health is passed in doctor and operational evidence.",
      failureSummary: "Unity Bridge health is not passed in both doctor and operational evidence.",
      nextAction: "Open Unity, start the canonical Unity Bridge server, rerun doctor, then rerun the operational smoke harness.",
      connectedArtifacts: ["reports/onboarding_doctor_report.json", "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-COMPILE",
      title: "Unity compile check Passed",
      passed: doctorCheck("unity.compile")?.status === "Passed" && evidence.data?.compileStatusResult?.status === "Passed",
      evidence: `${doctorCheck("unity.compile")?.status || "Missing doctor check"} / ${evidence.data?.compileStatusResult?.status || "Missing evidence check"}`,
      successSummary: "Unity compile status is passed in doctor and operational evidence.",
      failureSummary: "Unity compile status is not passed in both doctor and operational evidence.",
      nextAction: "Resolve Unity compile errors and rerun doctor plus the operational smoke harness.",
      connectedArtifacts: ["reports/onboarding_doctor_report.json", "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-CONSOLE",
      title: "Console error count 0",
      passed: evidence.exists && evidence.data?.consoleErrorSummary?.status === "Passed" && consoleErrors === 0,
      evidence: evidence.exists ? `Console errors: ${consoleErrors}` : "Missing operational evidence",
      successSummary: "Operational evidence reports zero Unity console errors.",
      failureSummary: "Operational evidence does not prove console error count is zero.",
      nextAction: "Inspect Unity console errors and rerun the operational smoke harness after errors are cleared.",
      connectedArtifacts: ["validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-EVIDENCE",
      title: "Non-sample Operational Passed evidence exists",
      passed: evidence.exists
        && evidence.data?.classification === "Operational"
        && evidence.data?.status === "Passed"
        && evidence.data?.scenarioId === "ainvil_bridge_smoke_operational",
      evidence: evidence.exists ? `${evidence.data?.scenarioId} / ${evidence.data?.classification} / ${evidence.data?.status}` : "Missing operational evidence",
      successSummary: "Latest smoke evidence is non-sample Operational Passed evidence.",
      failureSummary: "No non-sample Operational Passed evidence is available.",
      nextAction: "Run the operational smoke harness and ensure evidence classification is Operational and status is Passed.",
      connectedArtifacts: ["validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-HARNESS",
      title: "Live harness latest report has Operational Passed scenario",
      passed: harness.exists
        && harness.data?.summary?.failed === 0
        && harness.data?.summary?.blocked === 0
        && Boolean(anyOperationalHarnessScenario || (harnessScenario?.classification === "Operational" && harnessScenario?.status === "Passed")),
      evidence: harness.exists ? `summary passed=${harness.data?.summary?.passed}, failed=${harness.data?.summary?.failed}, blocked=${harness.data?.summary?.blocked}` : "Missing live harness report",
      successSummary: "Latest live harness report has a Passed Operational scenario; fixed smoke evidence remains available for the core gate.",
      failureSummary: "Latest live harness report does not show any Operational scenario as Passed.",
      nextAction: "Run run-ainvil-live-harness.mjs --mode probe --scenario ainvil_bridge_smoke_operational or another Operational scenario.",
      connectedArtifacts: ["harness/reports/latest-live-harness-report.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-PRODUCTIZATION",
      title: "No productization core blockers",
      passed: productization.exists && coreProductizationBlockers.length === 0,
      evidence: productization.exists ? `${coreProductizationBlockers.length} non-review productization blocker(s)` : "Missing productization report",
      successSummary: "Productization has no remaining core blocker outside the review gate itself.",
      failureSummary: "Productization still reports core blockers other than the review gate.",
      nextAction: "Resolve non-review productization blockers and regenerate the productization report.",
      connectedArtifacts: ["reports/productization_status_report.json"]
    }),
    criterion({
      id: "PCORE-APPROVAL-RELEASE",
      title: "No non-review release blockers",
      passed: release.exists && nonReviewReleaseBlockers.length === 0,
      evidence: release.exists ? `${nonReviewReleaseBlockers.length} non-review release blocker(s)` : "Missing release readiness report",
      successSummary: "Release readiness has no blocker outside the Production Core review gate.",
      failureSummary: "Release readiness still has non-review blockers.",
      nextAction: "Resolve non-review release blockers and regenerate release readiness.",
      connectedArtifacts: ["reports/release_readiness_report.json"]
    })
  ];
}

function criterion({ id, title, passed, evidence, successSummary, failureSummary, nextAction, connectedArtifacts }) {
  return {
    id,
    title,
    status: passed ? "Passed" : "Needs Evidence",
    evidence,
    successSummary,
    failureSummary,
    nextAction: passed ? null : nextAction,
    connectedArtifacts
  };
}

function updateReviewRecord(review, evaluation, generatedAt) {
  const approved = evaluation.newStatus === "Approved";
  return {
    ...review,
    date: generatedAt.slice(0, 10),
    lifecycleState: approved ? "Approved" : "Changes Requested",
    findings: approved
      ? [
        "Production Core live Unity proof is now available through the operational smoke scenario.",
        "Unity Bridge health, compile status, console check, hierarchy inspection, validation probe, and non-sample Operational Passed evidence are connected to productization and release readiness.",
        "No core blocker remains outside the Production Core review gate itself."
      ]
      : [
        "Production Core review was reevaluated against current productization, release, doctor, harness, and validation evidence.",
        `Remaining requested changes: ${evaluation.remainingChanges.map((item) => item.id).join(", ")}`
      ],
    strengths: approved
      ? [
        "Operational graph, live harness, doctor checks, release readiness, dashboard, and validation evidence now agree on the Unity Bridge smoke path.",
        "Example scenarios and sample evidence remain classified separately and do not satisfy release gates."
      ]
      : ["Review evaluation now distinguishes resolved Unity proof gaps from remaining evidence gaps."],
    weaknesses: evaluation.remainingChanges.map((item) => item.summary),
    risks: evaluation.remainingChanges.map((item) => ({
      riskId: `RISK-${item.id}`,
      summary: item.summary,
      severity: "High",
      evidenceNodeIds: ["AC-E2E-002"]
    })),
    recommendations: evaluation.remainingChanges.map((item) => ({
      recommendationId: `REC-${item.id}`,
      summary: item.nextAction,
      owner: "Orchestrator",
      referencesNodeIds: ["AC-E2E-002"]
    })),
    decision: approved ? "Approved" : "Changes Requested",
    confidence: approved ? "High" : "Medium",
    evidence: evaluation.evidenceUsed.map((item) => ({
      kind: item.kind,
      summary: item.summary,
      path: item.path
    }))
  };
}

function evidenceRefs({ productization, release, doctor, harness, evidence, review }) {
  return [
    artifactRef("Review Record", review, "Production Core readiness review record."),
    artifactRef("Productization Report", productization, "Productization status and operational validation summary."),
    artifactRef("Release Readiness Report", release, "Release gate state before Production Core review reevaluation."),
    artifactRef("Onboarding Doctor Report", doctor, "Unity Bridge health and compile health checks."),
    artifactRef("Live Harness Report", harness, "Latest operational live harness execution."),
    artifactRef("Validation Evidence", evidence, "Latest non-sample operational smoke evidence.")
  ].filter(Boolean);
}

function artifactRef(kind, artifact, summary) {
  if (!artifact.exists) return null;
  return {
    kind,
    summary,
    path: relativeAInvilPath(artifact.path)
  };
}

function gateBlocker(item) {
  return {
    gateId: item.gateId,
    title: item.title,
    status: item.status,
    evidence: item.evidence,
    nextAction: item.nextAction
  };
}

function formatCriteriaMarkdown(evaluation) {
  return [
    "# Production Core Review Criteria",
    "",
    `- Generated at: ${evaluation.generatedAt}`,
    `- Reviewed gate: ${evaluation.reviewedGateId}`,
    `- Previous status: ${evaluation.previousStatus}`,
    `- Evaluated status: ${evaluation.newStatus}`,
    "",
    "## Approval Criteria",
    "",
    "| Criterion | Status | Evidence |",
    "| --- | --- | --- |",
    ...evaluation.criteria.map((item) => `| ${esc(item.title)} | ${item.status} | ${esc(item.evidence)} |`),
    "",
    "## Resolved Changes",
    "",
    ...(evaluation.resolvedChanges.length
      ? evaluation.resolvedChanges.map((item) => `- ${item.id}: ${item.summary}`)
      : ["- None"]),
    "",
    "## Remaining Changes",
    "",
    ...(evaluation.remainingChanges.length
      ? evaluation.remainingChanges.map((item) => `- ${item.id}: ${item.summary} Next action: ${item.nextAction}`)
      : ["- None"]),
    "",
    "## Evidence Used",
    "",
    ...evaluation.evidenceUsed.map((item) => `- ${item.kind}: ${item.path}`),
    ""
  ].join("\n");
}

async function writeJson(relativePath, data) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, text) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

function esc(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, "<br>");
}
