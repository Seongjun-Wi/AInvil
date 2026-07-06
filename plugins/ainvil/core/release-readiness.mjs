import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadJsonArtifact } from "./loaders.mjs";
import { relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";

const DEFAULT_OUTPUT = "reports/release_readiness_report.json";

export async function createReleaseReadinessReport(options = {}) {
  const doctor = await loadJsonArtifact("reports/onboarding_doctor_report.json");
  const dashboard = await loadJsonArtifact("reports/project_dashboard.json");
  const gate = await loadJsonArtifact("reviews/production_core_readiness_review.json");
  const productization = await loadJsonArtifact("reports/productization_status_report.json");
  const compileGate = await loadJsonArtifact("reports/unity_compile_gate_report.json");
  const compileGateSafetyEvidence = await loadJsonArtifact("validation/evidence/EVID-ainvil-compile-gate-blocks-playmode-latest.json");
  const operationalEvidencePath = "validation/evidence/EVID-ainvil-bridge-smoke-operational-latest.json";
  const evidence = await loadJsonArtifact(operationalEvidencePath);
  const doctorChecks = new Map((doctor.data?.checks || []).map((check) => [check.id, check]));
  const productizationBlockers = productization.data?.releaseBlockers || [];
  const graphOperational = productization.exists && productization.data.graphClassification === "Operational";
  const latestOperationalEvidence = evidence.exists ? {
    classification: evidence.data?.classification,
    status: evidence.data?.status
  } : null;
  const operationalEvidencePassed = productization.exists
    && latestOperationalEvidence?.classification === "Operational"
    && latestOperationalEvidence?.status === "Passed";
  const hasExampleGraphContamination = productization.exists && (
    (productization.data.exampleContamination || []).some((item) => item.kind === "ExampleGraph" && item.status === "Blocked")
    || productizationBlockers.some((item) => ["BLOCKER-GRAPH-001", "BLOCKER-CONTAMINATION-001"].includes(item.id))
  );
  const productMvp = productization.data?.productMvpWorkflow || null;
  const procedural = productization.data?.proceduralRecoveryJob || null;
  const visualValidation = productization.data?.visualValidation || null;
  const spaceQuality = productization.data?.spaceQuality || null;
  const compileGatePassed = !compileGate.exists || compileGate.data?.status === "Passed";
  const compileGateSafetyPassed = !compileGateSafetyEvidence.exists || compileGateSafetyEvidence.data?.status === "Passed";

  const gates = [
    gateResult("GATE-ENV-001", "Onboarding environment", doctor.exists && ["Ready For Next Gate", "Needs Attention"].includes(doctor.data.releaseReadiness), doctor.exists ? doctor.data.releaseReadiness : "Missing doctor report", "Run `ainvil doctor` and resolve failed or blocked checks."),
    gateResult("GATE-DOC-001", "Korean product/technical documents", doctor.exists && hasPassedCheck(doctor.data, "ainvil.docs.ko"), "Korean docs index check", "Keep docs/ko/README.md and linked Korean planning documents available."),
    gateResult("GATE-SOT-001", "Operational source of truth", graphOperational, productization.exists ? `Graph classification: ${productization.data.graphClassification}` : "Missing productization status report", "Run `ainvil productization` and initialize a non-example production graph if needed."),
    gateResult("GATE-UNITY-BRIDGE-001", "Unity Bridge health", doctor.exists && hasPassedCheck(doctor.data, "unity.bridge.health"), doctorChecks.get("unity.bridge.health")?.message || "Unity Bridge health not checked", "Open Unity, import the canonical bridge package, start Tools > Codex Unity Bridge > Start Server, then rerun doctor."),
    gateResult("GATE-UNITY-COMPILE-001", "Unity compile check", doctor.exists && hasPassedCheck(doctor.data, "unity.compile"), doctorChecks.get("unity.compile")?.message || "Compile not checked", "Restore Unity Bridge connectivity and resolve compile errors before claiming Compile Verified."),
    compileGateResult(compileGate, compileGatePassed),
    compileGateSafetyGate(compileGateSafetyEvidence),
    gateResult("GATE-VALIDATION-001", "Operational Play Mode validation", operationalEvidencePassed, evidence.exists ? `${evidence.data.status} (${evidence.data.validationLevel})` : "Missing operational validation evidence", "Create a project-specific scenario and run live harness apply until non-sample Passed evidence exists."),
    gateResult("GATE-TRACE-001", "Resume dashboard", dashboard.exists && Boolean(dashboard.data.nextRecommendedAction), dashboard.exists ? dashboard.data.nextRecommendedAction?.title || "Dashboard exists" : "Missing dashboard", "Generate project dashboard and confirm next recommended action."),
    reviewGateResult(gate),
    gateResult("GATE-CONTAMINATION-001", "Example fixture contamination", productization.exists && !hasExampleGraphContamination, productization.exists ? `${hasExampleGraphContamination ? 1 : 0} operational graph contamination blocker(s)` : "Missing productization status report", "Keep example fixtures under examples/ and use operational graph/scenario/evidence for release gates.")
  ];

  const blockers = gates.filter((gate) => gate.status === "Blocked");
  const warnings = gates.filter((gate) => gate.status === "Warning");
  const decision = blockers.length > 0 ? "Not Release Ready" : warnings.length > 0 ? "Release Candidate With Warnings" : "Release Ready";

  const report = {
    schemaVersion: "1.0.0",
    reportId: `REL-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    generatedAt: new Date().toISOString(),
    product: "AInvil",
    decision,
    confidence: blockers.length > 0 ? "High" : "Medium",
    releaseLevel: {
      coreReleaseReady: decision === "Release Ready",
      coreRcReproducibilityVerified: productization.data?.releaseLevel?.coreRcReproducibilityVerified === true,
      canonicalUnityBridgePackageVerified: productization.data?.releaseLevel?.canonicalUnityBridgePackageVerified === true,
      productMvpWorkflow: productMvp?.status || "Unknown",
      humanPlayabilityReview: productMvp?.humanPlayabilityReview?.status || "Unknown",
      buildVerification: productMvp?.buildVerification?.status || "Unknown",
      productMvpReadyCandidate: productMvp?.readyCandidate === true,
      humanPlayableFirstBuildCandidate: productMvp?.humanPlayableFirstBuildCandidate === true,
      productMvpFirstPlayableVerified: productMvp?.productMvpFirstPlayableVerified === true,
      firstGameplayLoop: productization.data?.releaseLevel?.firstGameplayLoop || "Unknown",
      proceduralRecoveryJob: procedural?.status || "Unknown",
      proceduralGenerationVerified: procedural?.proceduralGenerationVerified === true,
      visualValidation: visualValidation?.status || "Unknown",
      proceduralSpaceQuality: spaceQuality?.status || "Unknown",
      compileGate: compileGate.exists ? compileGate.data?.status || "Unknown" : "Not Run",
      compileGateSafety: compileGateSafetyEvidence.exists ? compileGateSafetyEvidence.data?.status || "Not Run" : "Not Run",
      playModeBlockedOnCompileError: compileGateSafetyEvidence.data?.playModeAttempted === false
        && compileGateSafetyEvidence.data?.downstreamValidationSkipped === true
        && compileGateSafetyEvidence.data?.blockerType === "CompileBlocked",
      screenshotEvidenceAvailable: visualValidation?.screenshotEvidenceAvailable === true,
      missingShaderSuspected: visualValidation?.missingShaderSuspected === true,
      cameraFramingCheck: visualValidation?.cameraFramingCheck || "Unknown",
      publicReleaseReady: false,
      revalidationStatus: productization.data?.summary?.revalidationStatus || (gate.data?.decision === "Revalidation Required" ? "Revalidation Required" : "Current"),
      publicReleaseNote: "Public Release Ready is not claimed by the core release gate or Product MVP smoke evidence."
    },
    productMvpWorkflow: productMvp,
    proceduralRecoveryJob: procedural,
    visualValidation,
    spaceQuality,
    compileGate: compileGate.exists ? compileGate.data : null,
    compileGateSafety: compileGateSafetyEvidence.exists ? {
      status: compileGateSafetyEvidence.data?.status || "Unknown",
      evidencePath: relativeAInvilPath(compileGateSafetyEvidence.path),
      playModeBlockedOnCompileError: compileGateSafetyEvidence.data?.playModeAttempted === false
        && compileGateSafetyEvidence.data?.downstreamValidationSkipped === true
        && compileGateSafetyEvidence.data?.blockerType === "CompileBlocked",
      compileGateStatusWithError: compileGateSafetyEvidence.data?.compileGateStatusWithError || "Not Run",
      compileGateStatusAfterCleanup: compileGateSafetyEvidence.data?.compileGateStatusAfterCleanup || "Not Run",
      publicReleaseReady: false
    } : null,
    gates,
    blockers,
    blockerDetails: [
      ...blockers.map((gate) => ({
        blockerId: gate.gateId,
        category: gate.title,
        evidence: gate.evidence,
        nextAction: gate.nextAction
      })),
      ...productizationBlockers.map((item) => ({
        blockerId: item.id,
        category: item.title,
        evidence: item.evidence,
        nextAction: item.nextAction
      }))
    ],
    warnings,
    evidenceRefs: [
      doctor.exists ? relativeAInvilPath(doctor.path) : null,
      dashboard.exists ? relativeAInvilPath(dashboard.path) : null,
      gate.exists ? relativeAInvilPath(gate.path) : null,
      evidence.exists ? relativeAInvilPath(evidence.path) : null,
      compileGate.exists ? relativeAInvilPath(compileGate.path) : null,
      compileGateSafetyEvidence.exists ? relativeAInvilPath(compileGateSafetyEvidence.path) : null
    ].filter(Boolean),
    nextActions: blockers.map((gate) => ({
      gateId: gate.gateId,
      summary: gate.nextAction
    }))
  };

  if (options.write !== false) {
    const outputPath = resolveAInvilPath(options.outputPath || DEFAULT_OUTPUT);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    return { path: outputPath, data: report };
  }

  return { path: null, data: report };
}

function gateResult(gateId, title, passed, evidence, nextAction) {
  return {
    gateId,
    title,
    status: passed ? "Passed" : "Blocked",
    evidence,
    nextAction: passed ? null : nextAction
  };
}

function compileGateResult(compileGate, compileGatePassed) {
  const environmentBlocked = compileGate.exists && compileGate.data?.blockerType === "BridgeDisconnected";
  if (compileGatePassed) {
    return gateResult("GATE-UNITY-COMPILE-GATE-001", "Unity compile gate before Play Mode", true, compileGate.exists ? `${compileGate.data.status}: compile gate report exists` : "Compile gate not required", null);
  }
  return {
    gateId: "GATE-UNITY-COMPILE-GATE-001",
    title: "Unity compile gate before Play Mode",
    status: "Blocked",
    blockerType: environmentBlocked ? "EnvironmentBlocked" : "CompileBlocked",
    evidence: compileGate.exists ? `${compileGate.data.status}: ${compileGate.data.failureReason || "compile gate report exists"}` : "Compile gate has not been run yet",
    nextAction: environmentBlocked
      ? "Restart Unity Bridge and rerun compile-check before live validation."
      : "Run `node plugins/ainvil/cli/ainvil-cli.mjs compile-check --unity-project <UnityProjectPath>` and fix compile errors before runtime validation."
  };
}

function reviewGateResult(gate) {
  if (gate.exists && gate.data?.decision === "Approved") {
    return gateResult("GATE-REVIEW-001", "Production Core review", true, "Approved", "None");
  }
  if (gate.exists && gate.data?.decision === "Revalidation Required") {
    return {
      gateId: "GATE-REVIEW-001",
      title: "Production Core review",
      status: "Warning",
      evidence: "Revalidation Required",
      nextAction: "Restore Unity Bridge stability and rerun operational live harness validation."
    };
  }
  return gateResult("GATE-REVIEW-001", "Production Core review", false, gate.exists ? gate.data.decision : "Missing readiness review", "Resolve changes requested in the Production Core readiness review.");
}

function compileGateSafetyGate(evidence) {
  if (!evidence.exists) {
    return {
      gateId: "GATE-UNITY-COMPILE-GATE-SAFETY-001",
      title: "Compile gate safety regression",
      status: "Warning",
      evidence: "Compile gate safety has not been run yet",
      nextAction: "Run `node plugins/ainvil/cli/ainvil-cli.mjs regression --compile-gate-safety --unity-project <UnityProjectPath>`."
    };
  }
  return gateResult(
    "GATE-UNITY-COMPILE-GATE-SAFETY-001",
    "Compile gate safety regression",
    evidence.data?.status === "Passed",
    `${evidence.data?.status || "Unknown"}: playModeAttempted=${evidence.data?.playModeAttempted}`,
    "Run `node plugins/ainvil/cli/ainvil-cli.mjs regression --compile-gate-safety --unity-project <UnityProjectPath>` and inspect the compile gate safety report."
  );
}

function hasPassedCheck(report, checkId) {
  return Array.isArray(report?.checks) && report.checks.some((check) => check.id === checkId && check.status === "Passed");
}
