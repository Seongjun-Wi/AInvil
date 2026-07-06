#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const generatedAt = new Date().toISOString();
const evidencePath = "validation/evidence/EVID-dungeon-recovery-first-playable-e2e-latest.json";
const evidence = await readJson(evidencePath);
const consoleErrorCount = evidence?.consoleErrorSummary?.errorCount ?? evidence?.consoleErrorCount ?? null;
const automatedConsoleCheckStatus =
  consoleErrorCount === 0
    ? "Passed"
    : evidence?.consoleErrorSummary?.status === "NotRun" || evidence?.status === "Blocked"
      ? "Not Checked"
      : "Needs Review";

const uxChangesApplied = [
  "Added HUD controls text: WASD / Arrow Keys: Move and E: Recover nearby target.",
  "Added Recover labels and marker spheres above all three recovery targets.",
  "Added nearest-target highlight that changes the marker and label to Press E: Recover.",
  "Changed recovered targets to green/dimmed visual state and Recovered label.",
  "Kept Job Complete visible in the progress UI after all three recoveries.",
  "Switched generated materials to URP-compatible shaders to remove magenta/pink missing-shader rendering.",
  "Reframed the main camera with an orthographic centered view so the player and recovery targets are visible.",
  "Added a player marker/label and enlarged target markers/labels for readability.",
  "Added a simple objective banner separate from the controls text.",
  "Kept generated assets isolated under Assets/AInvilGenerated/DungeonRecoveryFirstPlayable."
];

const manualAcceptanceCriteria = [
  criterion("MAC-DRC-001", "Within 3 seconds of starting play, the player understands the objective and controls.", "Passed", "Manual retest confirmed the objective banner and controls text are clear enough for the first playable."),
  criterion("MAC-DRC-002", "All three recovery targets are visually distinguishable on screen.", "Passed", "Manual retest confirmed all three recovery targets are visible and distinguishable with labels/markers."),
  criterion("MAC-DRC-003", "The target that can be recovered near the player is visually distinguished.", "Passed", "Manual retest confirmed the nearby interaction state and Press E prompt are understandable."),
  criterion("MAC-DRC-004", "Recovering all targets clearly transitions the job to complete.", "Passed", "Manual retest confirmed progress UI and Job Complete are understandable."),
  criterion("MAC-DRC-005", "Manual play remains free of visible errors, freezes, or abnormal behavior.", "Passed", "User reported no visible errors, freezes, or abnormal behavior. Automated console verification is tracked separately.")
];

const reviewItems = [
  item("objectiveClarity", "Player can understand what to do.", "Passed", "Manual retest confirmed the objective and controls are understandable after the UX fixes."),
  item("movementFeel", "Movement can be judged.", "Passed", "Manual retest confirmed the player is visible and movement is acceptable for a first playable."),
  item("camera", "Camera framing supports play.", "Passed", "Manual retest confirmed the camera now frames the player and recovery targets."),
  item("targetVisibility", "Three recovery targets are identifiable.", "Passed", "Manual retest confirmed all three targets are visible and distinguishable."),
  item("interactableFeedback", "Recoverable state is visually clear.", "Passed", "Manual retest confirmed the nearby interaction state and Press E prompt are understandable."),
  item("recoverResponse", "E-key recovery response is satisfying.", "Passed", "Manual retest confirmed E-key recovery response is sufficient for this first playable."),
  item("progressUi", "Progress UI is readable.", "Passed", "Manual retest confirmed recovery progress is understandable."),
  item("completion", "Job Complete is clear.", "Passed", "Manual retest confirmed the completion state is recognizable."),
  item("labelColorDistance", "Labels, colors, and distance cues are readable.", "Passed", "Manual retest confirmed the previous invisible/magenta presentation problem is resolved for first-playable purposes."),
  item("stability", "No errors, freezes, or abnormal behavior.", "Passed", "User reported no runtime errors, freezes, or abnormal behavior."),
  item("firstPlayableAcceptance", "Overall acceptable as a first playable.", "Passed", "Manual retest confirmed this is acceptable as a first playable: not a finished game, but the core loop can be understood and played."),
  item("futureImprovement", "Remaining improvements are future scope.", "Passed", "Art, sound, recovery presentation, tutorial flow, rewards, and the next-job/company loop remain future improvements, not blockers for this first playable.")
];

const manualFeedback = {
  received: true,
  source: "User manual retest on 2026-07-05",
  summary: "Manual retest confirmed the previous camera, visibility, and magenta presentation issues are resolved enough for a first playable. The player can understand the objective, move, recover three targets, read progress, and recognize Job Complete without visible runtime instability.",
  checklistItemsProvided: 12,
  expectedChecklistItems: 12
};

const remainingLimitations = [
  "This is not a finished game.",
  "Art, sound, and recovery presentation remain placeholder-level.",
  "Tutorial flow is still simple instructional UI rather than a full game-like onboarding sequence.",
  "Next-job, reward, and company management loops are not implemented yet."
];

const report = {
  schemaVersion: "1.0.0",
  reportId: `DRC-PLAYABILITY-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  product: "DungeonRecoveryCompany",
  scenarioId: "dungeon_recovery_first_playable_e2e",
  playabilityReviewStatus: "Passed",
  previousStatus: "Needs Improvement",
  newStatus: "Passed",
  reviewMethod: "Manual Retest",
  retestResult: "Passed",
  publicReleaseReady: false,
  relatedE2eEvidence: evidencePath,
  automatedE2eStatus: evidence?.status || "Unknown",
  automatedValidationLevel: evidence?.validationLevel || "Unknown",
  automatedConsoleCheckStatus,
  consoleErrorCount,
  manualFeedback,
  uxChangesApplied,
  reviewItems,
  manualAcceptanceCriteria,
  remainingLimitations,
  remainingPlayabilityIssues: remainingLimitations,
  nextAction: "Treat this build as a Human Playable First Build Candidate and continue with art, sound, tutorial, reward, and next-job loop work before any public release claim."
};

const manualEvidence = {
  schemaVersion: "1.0.0",
  evidenceId: "EVID-dungeon-recovery-first-playable-human-playability-latest",
  source: "Manual",
  scenarioId: "dungeon_recovery_first_playable_e2e",
  classification: "Operational",
  category: "ProductMvp",
  validationType: "HumanPlayabilityReview",
  validationLevel: "Runtime Tested",
  status: "Passed",
  result: "Passed",
  validationIds: [],
  validationId: null,
  failureClass: "None",
  acceptanceIds: ["AC-DRC-MVP-001", "AC-DRC-MVP-002", "AC-DRC-MVP-003"],
  requirementIds: ["REQ-DRC-MVP-001"],
  unityTargets: [
    "Assets/AInvilGenerated/DungeonRecoveryFirstPlayable/Scenes/DRC_FirstRecoveryJob.unity"
  ],
  checks: manualAcceptanceCriteria.map((entry) => ({
    checkId: `manual.${entry.id}`,
    type: "Input",
    target: "Human reviewer",
    status: entry.status === "Passed" ? "Passed" : "Warning",
    failureClass: "Unknown",
    message: `${entry.summary} Status: ${entry.status}. ${entry.note || ""}`.trim()
  })),
  checkedSteps: manualAcceptanceCriteria.map((entry) => ({
    checkId: `manual.${entry.id}`,
    type: "Input",
    target: "Human reviewer",
    status: entry.status === "Passed" ? "Passed" : "Warning",
    failureClass: "Unknown",
    message: `${entry.summary} Status: ${entry.status}. ${entry.note || ""}`.trim()
  })),
  bridgeHealthResult: null,
  compileStatusResult: null,
  consoleErrorSummary: null,
  failureReason: null,
  blocker: null,
  bridgeDiagnostics: [],
  validationResults: manualAcceptanceCriteria.map((entry) => ({
    validationId: `manual-retest.${entry.id}`,
    result: entry.status,
    method: "Manual Retest",
    summary: entry.summary,
    note: entry.note
  })),
  observations: null,
  assertions: reviewItems.map((entry) => ({
    assertionId: `manual-retest.${entry.id}`,
    result: entry.status,
    message: entry.finding
  })),
  sourceValidationDesign: null,
  startedAt: generatedAt,
  finishedAt: generatedAt,
  completedAt: generatedAt,
  timestamp: generatedAt,
  remainingGaps: report.remainingPlayabilityIssues,
  nextActions: [report.nextAction],
  playabilityReviewStatus: report.playabilityReviewStatus,
  previousStatus: report.previousStatus,
  newStatus: report.newStatus,
  reviewMethod: report.reviewMethod,
  retestResult: report.retestResult,
  publicReleaseReady: report.publicReleaseReady,
  buildVerificationStatus: "Not Run",
  manualFeedback,
  uxChangesApplied,
  manualAcceptanceCriteria,
  automatedConsoleCheckStatus,
  remainingLimitations,
  buildOutputPath: null,
  remainingPlayabilityIssues: report.remainingPlayabilityIssues
};

await writeJson("reports/dungeon_recovery_first_playable_playability_review.json", report);
await writeText("reports/dungeon_recovery_first_playable_playability_review.md", formatMarkdown(report));
await writeJson("validation/evidence/EVID-dungeon-recovery-first-playable-human-playability-latest.json", manualEvidence);

console.log(`Dungeon Recovery playability review: ${report.playabilityReviewStatus}`);
console.log("Report: reports/dungeon_recovery_first_playable_playability_review.json");
console.log("Evidence: validation/evidence/EVID-dungeon-recovery-first-playable-human-playability-latest.json");

function criterion(id, summary, status, note = "") {
  return { id, summary, status, note };
}

function item(id, question, status, finding) {
  return { id, question, status, finding };
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.resolve(pluginRoot, relativePath), "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(relativePath, data) {
  const filePath = path.resolve(pluginRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeText(relativePath, text) {
  const filePath = path.resolve(pluginRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

function formatMarkdown(report) {
  return [
    "# Dungeon Recovery First Playable Playability Review",
    "",
    `- Generated at: ${report.generatedAt}`,
    `- Status: ${report.playabilityReviewStatus}`,
    `- Previous status: ${report.previousStatus}`,
    `- New status: ${report.newStatus}`,
    `- Review method: ${report.reviewMethod}`,
    `- Retest result: ${report.retestResult}`,
    `- Public Release Ready: ${report.publicReleaseReady ? "Yes" : "No"}`,
    `- Automated E2E: ${report.automatedE2eStatus} (${report.automatedValidationLevel})`,
    `- Automated console check: ${report.automatedConsoleCheckStatus}`,
    `- Console error count: ${report.consoleErrorCount}`,
    "",
    "## Manual Feedback",
    "",
    `- Received: ${report.manualFeedback.received ? "yes" : "no"}`,
    `- Checklist items provided: ${report.manualFeedback.checklistItemsProvided} / ${report.manualFeedback.expectedChecklistItems}`,
    `- Summary: ${report.manualFeedback.summary}`,
    "",
    "## UX Changes Applied",
    "",
    ...report.uxChangesApplied.map((entry) => `- ${entry}`),
    "",
    "## Review Items",
    "",
    "| Item | Status | Finding |",
    "| --- | --- | --- |",
    ...report.reviewItems.map((entry) => `| ${entry.question} | ${entry.status} | ${entry.finding} |`),
    "",
    "## Manual Acceptance Criteria",
    "",
    "| ID | Criterion | Status |",
    "| --- | --- | --- |",
    ...report.manualAcceptanceCriteria.map((entry) => `| ${entry.id} | ${entry.summary} | ${entry.status} |`),
    "",
    "## Remaining Limitations",
    "",
    ...report.remainingLimitations.map((entry) => `- ${entry}`),
    ""
  ].join("\n");
}
