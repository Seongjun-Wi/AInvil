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
  criterion("MAC-DRC-001", "Within 3 seconds of starting play, the player understands the objective and controls.", "Needs Improvement", "UI text exists, but the user noted this does not feel like a normal tutorial/navigation experience."),
  criterion("MAC-DRC-002", "All three recovery targets are visually distinguishable on screen.", "Needs Improvement", "User could not evaluate target visibility because the camera/framing made gameplay objects unreadable."),
  criterion("MAC-DRC-003", "The target that can be recovered near the player is visually distinguished.", "Needs Improvement", "User said interaction feedback is hard to evaluate because of the camera problem."),
  criterion("MAC-DRC-004", "Recovering all targets clearly transitions the job to complete.", "Passed", "User understood the progress UI and Job Complete text, while noting the presentation is not ideal for a normal game."),
  criterion("MAC-DRC-005", "Manual play remains free of visible errors, freezes, or abnormal behavior.", "Passed", "User reported no visible errors, freezes, or abnormal behavior. Automated console verification is tracked separately.")
];

const reviewItems = [
  item("objectiveClarity", "Player can understand what to do.", "Needs Improvement", "Controls are visible as text, but the user expects a more game-like tutorial/navigation pattern."),
  item("movementFeel", "Movement can be judged.", "Needs Improvement", "User could not judge movement feel because the player was not visible."),
  item("camera", "Camera framing supports play.", "Needs Improvement", "User reported the camera did not show the player or goals clearly."),
  item("targetVisibility", "Three recovery targets are identifiable.", "Needs Improvement", "User reported targets could not be evaluated because they were not visible in the camera view."),
  item("interactableFeedback", "Recoverable state is visually clear.", "Needs Improvement", "Press E text exists, but the user could not evaluate it due to camera/visibility issues."),
  item("recoverResponse", "E-key recovery response is satisfying.", "Needs Improvement", "User said only text changes, so the response feels ambiguous."),
  item("progressUi", "Progress UI is readable.", "Passed", "User said the UI can be understood, while noting it is not recommended as a normal game presentation."),
  item("completion", "Job Complete is clear.", "Passed", "User said Job Complete is understandable."),
  item("stability", "No errors, freezes, or abnormal behavior.", "Passed", "User reported no such symptoms."),
  item("firstPlayableAcceptance", "Overall acceptable as a first playable.", "Needs Improvement", "User said it is not acceptable because nothing meaningful was visible and it feels like a WASD/interaction test.")
];

const manualFeedback = {
  received: true,
  source: "User request on 2026-07-04",
  summary: "Manual playability review found major camera/framing and visibility issues. Progress UI and Job Complete were understandable, and no runtime instability was reported, but the build is not acceptable as a first playable yet.",
  checklistItemsProvided: 12,
  expectedChecklistItems: 12
};

const report = {
  schemaVersion: "1.0.0",
  reportId: `DRC-PLAYABILITY-${generatedAt.replace(/[:.]/g, "-")}`,
  generatedAt,
  product: "DungeonRecoveryCompany",
  scenarioId: "dungeon_recovery_first_playable_e2e",
  playabilityReviewStatus: "Needs Improvement",
  relatedE2eEvidence: evidencePath,
  automatedE2eStatus: evidence?.status || "Unknown",
  automatedValidationLevel: evidence?.validationLevel || "Unknown",
  automatedConsoleCheckStatus,
  consoleErrorCount,
  manualFeedback,
  uxChangesApplied,
  reviewItems,
  manualAcceptanceCriteria,
  remainingPlayabilityIssues: [
    "Retest required after camera, material, player marker, target marker, and objective banner fixes.",
    "The current experience still relies on prototype UI/text and does not yet provide a full game-like tutorial flow.",
    "E-key recovery feedback is still minimal and should eventually receive animation/audio/VFX beyond this generated primitive slice.",
    "User requested broader design improvement; this pass only applies minimal generated-folder UX fixes."
  ],
  nextAction: "Rerun the generated build and confirm whether camera framing, material colors, player visibility, and target visibility are now acceptable."
};

const manualEvidence = {
  schemaVersion: "1.0.0",
  evidenceId: "EVID-dungeon-recovery-first-playable-human-playability-latest",
  source: "Manual",
  scenarioId: "dungeon_recovery_first_playable_e2e",
  classification: "Operational",
  category: "ProductMvp",
  validationType: "HumanPlayabilityReview",
  validationLevel: "Not Checked",
  status: "Warning",
  result: "Warning",
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
    type: "ManualPlayability",
    target: "Human reviewer",
    status: entry.status === "Passed" ? "Passed" : "Warning",
    failureClass: "Unknown",
    message: `${entry.summary} Status: ${entry.status}. ${entry.note || ""}`.trim()
  })),
  checkedSteps: manualAcceptanceCriteria.map((entry) => ({
    checkId: `manual.${entry.id}`,
    type: "ManualPlayability",
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
  validationResults: [],
  observations: null,
  assertions: [],
  sourceValidationDesign: null,
  startedAt: generatedAt,
  finishedAt: generatedAt,
  completedAt: generatedAt,
  timestamp: generatedAt,
  remainingGaps: report.remainingPlayabilityIssues,
  nextActions: [report.nextAction],
  playabilityReviewStatus: report.playabilityReviewStatus,
  buildVerificationStatus: "Not Run",
  manualFeedback,
  uxChangesApplied,
  manualAcceptanceCriteria,
  automatedConsoleCheckStatus,
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
    "## Remaining Issues",
    "",
    ...report.remainingPlayabilityIssues.map((entry) => `- ${entry}`),
    ""
  ].join("\n");
}
