import { loadJsonArtifact } from "./loaders.mjs";
import { createWorkflowTransitionPlan } from "./workflow-transitions.mjs";

export async function createWorkflowTransitionApproval(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const transitionPlan = options.transitionPlan || (await loadTransitionPlanOrCreate());
  const approvals = transitionPlan.transitionCandidates.map(classifyTransition);
  const safestNextApprovedAction = chooseSafestApprovedAction(approvals);

  return {
    schemaVersion: "1.0.0",
    approvalVersion: "0.1.0",
    approvalId: `WTA-${transitionPlan.planId || "Plan"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    sourcePlanId: transitionPlan.planId,
    sourceFiles: [
      {
        kind: "Workflow Transition Plan",
        path: "reports/workflow_transition_plan.json",
        used: true
      }
    ],
    approvalRecords: approvals,
    summary: summarizeApprovals(approvals),
    safestNextApprovedAction,
    executionPolicy: {
      mode: "ReadOnlyApprovalClassification",
      executionAllowed: false,
      notes: "This approval model classifies transitions only. It does not approve, execute, or mutate workflow state."
    }
  };
}

async function loadTransitionPlanOrCreate() {
  const existing = await loadJsonArtifact("reports/workflow_transition_plan.json");
  if (existing.exists) return existing.data;
  return createWorkflowTransitionPlan();
}

function classifyTransition(transition) {
  if (transition.status === "Blocked") {
    return approvalRecord(transition, {
      approvalClass: "Blocked",
      executionReadiness: "NotReady",
      requiredApprovals: [],
      requiredEvidence: transition.prerequisites,
      missingEvidence: transition.missingPrerequisites,
      requiredReviews: [],
      missingReviews: [],
      safetyLevel: "Unknown",
      reason: transition.reason,
      canBeAutomatedLater: false,
      userFacingMessage: `Blocked: ${transition.reason}`
    });
  }

  if (isForbidden(transition)) {
    return approvalRecord(transition, {
      approvalClass: "Forbidden",
      executionReadiness: "NotReady",
      requiredApprovals: ["Explicit product governance exception"],
      requiredEvidence: [],
      missingEvidence: ["Transition conflicts with AInvil safety policy."],
      requiredReviews: ["Governance Review"],
      missingReviews: ["Governance Review"],
      safetyLevel: "Destructive",
      reason: "This transition type or target state must not be automated.",
      canBeAutomatedLater: false,
      userFacingMessage: "Forbidden: AInvil must not automate this transition."
    });
  }

  switch (transition.transitionType) {
    case "ResolveValidationGap":
      return approvalRecord(transition, {
        approvalClass: "EvidenceRequired",
        executionReadiness: "NotReady",
        requiredApprovals: [],
        requiredEvidence: ["Actual validation evidence for the target artifact.", "Validation level proof matching the target state."],
        missingEvidence: ["Validation evidence has not been produced by this planner."],
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "HighRisk",
        reason: "Validation confidence cannot be promoted without evidence.",
        canBeAutomatedLater: false,
        userFacingMessage: "Validation gap found. Produce real validation evidence before any completion or validation transition."
      });

    case "RequestReview":
      return approvalRecord(transition, {
        approvalClass: "ReviewRequired",
        executionReadiness: "NotReady",
        requiredApprovals: [],
        requiredEvidence: transition.evidenceRefs.map((ref) => `${ref.kind}:${ref.id}`),
        missingEvidence: [],
        requiredReviews: ["Required governance review"],
        missingReviews: ["Required governance review record"],
        safetyLevel: "MediumRisk",
        reason: "Governance requires a review before this transition can proceed.",
        canBeAutomatedLater: true,
        userFacingMessage: "A review must be requested before this transition is eligible."
      });

    case "AddressBlockedNode":
      return approvalRecord(transition, {
        approvalClass: "UserApprovalRequired",
        executionReadiness: "NotReady",
        requiredApprovals: ["User confirmation of unblock strategy"],
        requiredEvidence: transition.evidenceRefs.map((ref) => `${ref.kind}:${ref.id}`),
        missingEvidence: [],
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "MediumRisk",
        reason: "Resolving a blocker may change scope, priority, or implementation direction.",
        canBeAutomatedLater: false,
        userFacingMessage: "User approval is required before resolving this blocker."
      });

    case "ResolveOpenQuestion":
      return approvalRecord(transition, {
        approvalClass: "UserApprovalRequired",
        executionReadiness: "NotReady",
        requiredApprovals: ["User decision"],
        requiredEvidence: transition.evidenceRefs.map((ref) => `${ref.kind}:${ref.id}`),
        missingEvidence: [],
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "HighRisk",
        reason: "Open design or technical questions can affect creative intent or architecture.",
        canBeAutomatedLater: false,
        userFacingMessage: "The user must decide or approve the proposed answer."
      });

    case "ImproveTraceability":
      return approvalRecord(transition, {
        approvalClass: transition.status === "Needs Review" ? "ReviewRequired" : "AutoEligible",
        executionReadiness: transition.status === "Needs Review" ? "NotReady" : "Ready",
        requiredApprovals: [],
        requiredEvidence: ["Existing graph references for both sides of the traceability link."],
        missingEvidence: transition.missingPrerequisites,
        requiredReviews: transition.status === "Needs Review" ? ["Traceability Review"] : [],
        missingReviews: transition.status === "Needs Review" ? ["Traceability Review"] : [],
        safetyLevel: "LowRisk",
        reason: transition.reason,
        canBeAutomatedLater: transition.status !== "Needs Review",
        userFacingMessage: transition.status === "Needs Review" ? "Traceability improvement needs review." : "Traceability improvement is eligible for future automation."
      });

    case "RunBenchmark":
      return approvalRecord(transition, {
        approvalClass: transition.status === "Not Applicable" ? "AutoEligible" : "AutoEligible",
        executionReadiness: transition.status === "Not Applicable" ? "NotApplicable" : "Ready",
        requiredApprovals: [],
        requiredEvidence: ["Benchmark datasets"],
        missingEvidence: transition.missingPrerequisites,
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "LowRisk",
        reason: transition.reason,
        canBeAutomatedLater: transition.status !== "Not Applicable",
        userFacingMessage: transition.status === "Not Applicable" ? "Benchmark report already exists." : "Benchmark validation/reporting is eligible for future automation."
      });

    case "UpdateKpiDashboard":
      return approvalRecord(transition, {
        approvalClass: "EvidenceRequired",
        executionReadiness: "NotReady",
        requiredApprovals: [],
        requiredEvidence: ["Current KPI values", "KPI evidence sources"],
        missingEvidence: transition.missingPrerequisites,
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "LowRisk",
        reason: "KPI values should not be invented.",
        canBeAutomatedLater: false,
        userFacingMessage: "KPI dashboard update requires real KPI evidence."
      });

    default:
      return approvalRecord(transition, {
        approvalClass: "Blocked",
        executionReadiness: "NotReady",
        requiredApprovals: [],
        requiredEvidence: [],
        missingEvidence: ["Unknown transition type."],
        requiredReviews: [],
        missingReviews: [],
        safetyLevel: "Unknown",
        reason: `Unknown transition type: ${transition.transitionType}`,
        canBeAutomatedLater: false,
        userFacingMessage: "Unknown transition type cannot be approved."
      });
  }
}

function isForbidden(transition) {
  return /silently override|delete source-of-truth|validation complete without evidence|play mode verification without actual evidence|replace.*vision/i.test(
    `${transition.transitionType} ${transition.targetState} ${transition.reason} ${transition.safetyNotes}`
  );
}

function approvalRecord(transition, approval) {
  return {
    transitionId: transition.transitionId,
    transitionType: transition.transitionType,
    targetArtifactId: transition.targetArtifactId,
    approvalClass: approval.approvalClass,
    executionReadiness: approval.executionReadiness,
    requiredApprovals: approval.requiredApprovals,
    requiredEvidence: approval.requiredEvidence,
    missingEvidence: approval.missingEvidence,
    requiredReviews: approval.requiredReviews,
    missingReviews: approval.missingReviews,
    safetyLevel: approval.safetyLevel,
    reason: approval.reason,
    evidenceRefs: transition.evidenceRefs || [],
    canBeAutomatedLater: approval.canBeAutomatedLater,
    userFacingMessage: approval.userFacingMessage
  };
}

function summarizeApprovals(records) {
  return {
    total: records.length,
    byApprovalClass: countBy(records, "approvalClass"),
    byReadiness: countBy(records, "executionReadiness"),
    bySafetyLevel: countBy(records, "safetyLevel"),
    autoEligibleCount: records.filter((record) => record.approvalClass === "AutoEligible").length,
    blockedCount: records.filter((record) => record.approvalClass === "Blocked").length,
    forbiddenCount: records.filter((record) => record.approvalClass === "Forbidden").length
  };
}

function chooseSafestApprovedAction(records) {
  const ready = records.filter((record) => record.executionReadiness === "Ready" && record.approvalClass === "AutoEligible");
  if (ready.length === 0) {
    return {
      transitionId: "APPROVAL-NoReadyAutoEligibleTransition",
      approvalClass: "Blocked",
      reason: "No auto-eligible transition is ready from current evidence.",
      canBeAutomatedLater: false,
      userFacingMessage: "No safe automated action is currently available."
    };
  }

  return ready.sort((a, b) => safetyRank(a.safetyLevel) - safetyRank(b.safetyLevel))[0];
}

function countBy(items, field) {
  const counts = {};
  for (const item of items) {
    const key = item[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function safetyRank(level) {
  return { LowRisk: 0, MediumRisk: 1, HighRisk: 2, Unknown: 3, Destructive: 4 }[level] ?? 99;
}
