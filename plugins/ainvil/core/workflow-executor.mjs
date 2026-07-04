import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenchmarkReport, formatBenchmarkReportMarkdown } from "./benchmark-report.mjs";
import { loadJsonArtifact } from "./loaders.mjs";
import { relativeAInvilPath, resolveAInvilPath } from "./ainvil-paths.mjs";
import { createWorkflowRuntimeReport } from "./workflow-report.mjs";
import { createWorkflowTransitionPlan } from "./workflow-transitions.mjs";
import { createWorkflowTransitionApproval } from "./workflow-approvals.mjs";

const executionVersion = "0.1.0";

export async function dryRunApprovedTransition(options = {}) {
  return executeApprovedTransition({ ...options, mode: "dryRun", allowMutations: false });
}

export async function executeApprovedTransition(options = {}) {
  const startedAt = options.startedAt || new Date().toISOString();
  const mode = options.mode || "dryRun";
  const allowMutations = Boolean(options.allowMutations);
  const report = options.report || (await createWorkflowRuntimeReport({ generatedAt: startedAt }));
  const plan = options.plan || (await createWorkflowTransitionPlan({ generatedAt: startedAt, workflowReport: report }));
  const approval = options.approval || (await createWorkflowTransitionApproval({ generatedAt: startedAt, transitionPlan: plan }));
  const transitionId = options.transitionId || firstExecutableTransitionId(approval) || plan.safestNextTransition?.transitionId;
  const transition = (plan.transitionCandidates || []).find((item) => item.transitionId === transitionId);
  const approvalRecord = (approval.approvalRecords || []).find((item) => item.transitionId === transitionId);

  if (!transition || !approvalRecord) {
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId: transitionId || "UNKNOWN",
        transitionType: "Unknown",
        approvalClass: "Blocked",
        status: "Blocked",
        inputs: baseInputs(report, plan, approval, mode, allowMutations),
        outputs: { createdFiles: [], updatedFiles: [], graphPatchPlan: null, summary: "Transition was not found in the current plan or approval report." },
        errors: [`Transition not found: ${transitionId || "none"}`],
        blockedReason: "TransitionMissing",
        nextAction: report.nextAction
      })
    );
  }

  if (!isExecutable(approvalRecord)) {
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId,
        transitionType: transition.transitionType,
        approvalClass: approvalRecord.approvalClass,
        status: "Blocked",
        inputs: baseInputs(report, plan, approval, mode, allowMutations, transition),
        outputs: { createdFiles: [], updatedFiles: [], graphPatchPlan: null, summary: approvalRecord.userFacingMessage },
        evidenceRefs: approvalRecord.evidenceRefs || [],
        errors: [...(approvalRecord.missingEvidence || []), ...(approvalRecord.missingReviews || [])],
        blockedReason: approvalRecord.reason,
        nextAction: report.nextAction
      })
    );
  }

  if (transition.transitionType !== "RunBenchmark") {
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId,
        transitionType: transition.transitionType,
        approvalClass: approvalRecord.approvalClass,
        status: "Blocked",
        inputs: baseInputs(report, plan, approval, mode, allowMutations, transition),
        outputs: { createdFiles: [], updatedFiles: [], graphPatchPlan: null, summary: "Only RunBenchmark is executable in the first guarded executor." },
        evidenceRefs: approvalRecord.evidenceRefs || [],
        errors: ["Unsupported executable transition type."],
        blockedReason: "UnsupportedTransition",
        nextAction: report.nextAction
      })
    );
  }

  if (mode === "dryRun" || !allowMutations) {
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId,
        transitionType: transition.transitionType,
        approvalClass: approvalRecord.approvalClass,
        status: "DryRun",
        inputs: baseInputs(report, plan, approval, mode, allowMutations, transition),
        outputs: {
          createdFiles: [],
          updatedFiles: [],
          graphPatchPlan: null,
          summary: "RunBenchmark would regenerate benchmark Markdown and JSON reports."
        },
        evidenceRefs: approvalRecord.evidenceRefs || [],
        errors: [],
        blockedReason: null,
        nextAction: report.nextAction
      })
    );
  }

  try {
    const benchmark = await createBenchmarkReport({ generatedAt: startedAt });
    const mdPath = "benchmarks/reports/latest-benchmark-report.md";
    const jsonPath = "benchmarks/reports/latest-benchmark-report.json";
    await writeText(mdPath, formatBenchmarkReportMarkdown(benchmark));
    await writeText(jsonPath, `${JSON.stringify(benchmark, null, 2)}\n`);
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId,
        transitionType: transition.transitionType,
        approvalClass: approvalRecord.approvalClass,
        status: "Succeeded",
        inputs: baseInputs(report, plan, approval, mode, allowMutations, transition),
        outputs: {
          createdFiles: [mdPath, jsonPath],
          updatedFiles: [mdPath, jsonPath],
          graphPatchPlan: null,
          summary: `Benchmark report generated: ${benchmark.reportId}`
        },
        evidenceRefs: [
          ...(approvalRecord.evidenceRefs || []),
          { kind: "BenchmarkReport", id: benchmark.reportId, path: jsonPath }
        ],
        errors: [],
        blockedReason: null,
        nextAction: report.nextAction
      })
    );
  } catch (error) {
    return writeExecutionRecord(
      record({
        startedAt,
        transitionId,
        transitionType: transition.transitionType,
        approvalClass: approvalRecord.approvalClass,
        status: "Failed",
        inputs: baseInputs(report, plan, approval, mode, allowMutations, transition),
        outputs: { createdFiles: [], updatedFiles: [], graphPatchPlan: null, summary: "RunBenchmark transition failed." },
        evidenceRefs: approvalRecord.evidenceRefs || [],
        errors: [error.message],
        blockedReason: "ExecutionError",
        nextAction: report.nextAction
      })
    );
  }
}

export async function loadWorkflowExecutionRecords() {
  const latest = await loadJsonArtifact("workflow/runs/latest.json");
  return latest.exists ? [latest] : [];
}

function firstExecutableTransitionId(approval) {
  return (approval.approvalRecords || []).find((item) => item.executionReadiness === "Ready" && item.approvalClass === "AutoEligible")?.transitionId || null;
}

function isExecutable(approvalRecord) {
  return approvalRecord.approvalClass === "AutoEligible" && approvalRecord.executionReadiness === "Ready";
}

function baseInputs(report, plan, approval, mode, allowMutations, transition = null) {
  return {
    mode,
    allowMutations,
    sourceReportId: report.reportId,
    sourcePlanId: plan.planId,
    sourceApprovalId: approval.approvalId,
    transitionId: transition?.transitionId || null,
    targetArtifactId: transition?.targetArtifactId || null
  };
}

function record(input) {
  const finishedAt = new Date().toISOString();
  return {
    schemaVersion: "1.0.0",
    executionVersion,
    executionId: `WER-${finishedAt.replace(/[:.]/g, "-")}-${input.transitionId}`,
    transitionId: input.transitionId,
    transitionType: input.transitionType,
    approvalClass: input.approvalClass,
    startedAt: input.startedAt,
    finishedAt,
    status: input.status,
    inputs: input.inputs,
    outputs: input.outputs,
    evidenceRefs: input.evidenceRefs || [],
    errors: input.errors || [],
    blockedReason: input.blockedReason,
    nextAction: input.nextAction || null
  };
}

async function writeExecutionRecord(executionRecord) {
  const latestPath = "workflow/runs/latest.json";
  const historyPath = `workflow/runs/${executionRecord.executionId}.json`;
  await writeText(latestPath, `${JSON.stringify(executionRecord, null, 2)}\n`);
  await writeText(historyPath, `${JSON.stringify(executionRecord, null, 2)}\n`);
  return {
    executionRecord,
    createdFiles: [latestPath, historyPath],
    graphPatchPlan: null,
    blockedReason: executionRecord.blockedReason || null,
    nextAction: executionRecord.nextAction
  };
}

async function writeText(relativePath, content) {
  const filePath = resolveAInvilPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}
