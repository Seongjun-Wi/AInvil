import { loadBenchmarkCases } from "./loaders.mjs";

const expectedCategories = [
  "Design Review",
  "GDD Completion",
  "Technical Translation",
  "Production Planning",
  "Unity Production",
  "Validation",
  "Project Management",
  "Director Quality"
];

export async function createBenchmarkReport(options = {}) {
  const benchmarkFiles = await loadBenchmarkCases({ strict: true });
  const generatedAt = options.generatedAt || new Date().toISOString();
  const runDate = generatedAt.slice(0, 10);
  const cases = benchmarkFiles.map((file) => summarizeCase(file));
  const categoriesPresent = new Set(cases.map((item) => item.category));
  const missingCategories = expectedCategories.filter((category) => !categoriesPresent.has(category));
  const structuralFailures = cases.flatMap((item) => item.structuralFailures);

  return {
    schemaVersion: "1.0.0",
    reportId: options.reportId || `BR-AInvil-Baseline-${runDate}`,
    generatedAt,
    runMode: options.runMode || "DatasetBaseline",
    evaluator: options.evaluator || "AInvil static benchmark generator",
    summary: summarizeReport(cases, missingCategories, structuralFailures),
    dataset: {
      caseCount: cases.length,
      categoriesPresent: [...categoriesPresent].sort(),
      missingCategories,
      versions: [...new Set(cases.map((item) => item.version).filter(Boolean))].sort()
    },
    scores: createUnscoredDimensions(),
    categoryResults: expectedCategories.map((category) => ({
      category,
      status: categoriesPresent.has(category) ? "DatasetReady" : "MissingDataset",
      caseCount: cases.filter((item) => item.category === category).length,
      notes: categoriesPresent.has(category)
        ? "Dataset exists; runtime agent output evaluation is still required."
        : "No seed dataset exists for this category yet."
    })),
    cases,
    criticalFailures: structuralFailures.map((failure) => ({
      failure: failure.summary,
      severity: failure.severity,
      evidence: failure.evidence,
      requiredFix: failure.requiredFix
    })),
    versionComparison: {
      comparedVersion: options.comparedVersion || null,
      status: options.comparedVersion ? "ComparisonPending" : "NoPreviousReport",
      notes: options.comparedVersion
        ? "Previous report comparison is not implemented in the baseline generator."
        : "Generate and retain future benchmark reports to enable regression comparison."
    },
    recommendations: createRecommendations(missingCategories, structuralFailures)
  };
}

export function formatBenchmarkReportMarkdown(report) {
  const lines = [];
  lines.push(`# AInvil Benchmark Report: ${report.reportId}`);
  lines.push("");
  lines.push("## 1. Run Metadata");
  lines.push("");
  lines.push(`- Benchmark run id: ${report.reportId}`);
  lines.push("- AInvil version: current plugin workspace");
  lines.push(`- Benchmark dataset: ${report.dataset.caseCount} case(s)`);
  lines.push(`- Dataset version: ${report.dataset.versions.join(", ") || "Unknown"}`);
  lines.push(`- Date: ${report.generatedAt}`);
  lines.push(`- Evaluator: ${report.evaluator}`);
  lines.push(`- Run mode: ${report.runMode}`);
  lines.push(`- Compared version: ${report.versionComparison.comparedVersion || "None"}`);
  lines.push("");
  lines.push("## 2. Overall Capability");
  lines.push("");
  lines.push(`- Overall assessment: ${report.summary}`);
  lines.push(`- Major strengths: ${report.dataset.categoriesPresent.length} benchmark categor${report.dataset.categoriesPresent.length === 1 ? "y" : "ies"} have seed data.`);
  lines.push(`- Major weaknesses: ${report.dataset.missingCategories.length} benchmark categor${report.dataset.missingCategories.length === 1 ? "y is" : "ies are"} missing seed data; runtime output scoring is not implemented in this baseline report.`);
  lines.push(`- Regression summary: ${report.versionComparison.status}`);
  lines.push("- Improvement summary: Baseline report generation now produces a durable artifact for future comparison.");
  lines.push("");
  lines.push("## 3. Scores");
  lines.push("");
  lines.push("| dimension | score 0-5 | evidence | notes |");
  lines.push("| --- | --- | --- | --- |");
  for (const score of report.scores) {
    lines.push(`| ${score.dimension} | ${score.score} | ${score.evidence} | ${score.notes} |`);
  }
  lines.push("");
  lines.push("## 4. Category Results");
  lines.push("");
  lines.push("| benchmark category | result | notes |");
  lines.push("| --- | --- | --- |");
  for (const result of report.categoryResults) {
    lines.push(`| ${result.category} | ${result.status} | ${result.notes} |`);
  }
  lines.push("");
  lines.push("## 5. Expected vs Actual");
  lines.push("");
  lines.push("| expected observation/recommendation | actual output | pass/fail | notes |");
  lines.push("| --- | --- | --- | --- |");
  for (const item of report.cases.flatMap((testCase) => testCase.expectedSamples)) {
    lines.push(`| ${escapeTable(item.expected)} | Not evaluated | NotRun | ${escapeTable(item.notes)} |`);
  }
  lines.push("");
  lines.push("## 6. Critical Failures");
  lines.push("");
  lines.push("| failure | severity | evidence | required fix |");
  lines.push("| --- | --- | --- | --- |");
  if (report.criticalFailures.length === 0) {
    lines.push("| None detected by structural baseline | None | Dataset structure | Run live agent evaluation next |");
  } else {
    for (const failure of report.criticalFailures) {
      lines.push(`| ${escapeTable(failure.failure)} | ${failure.severity} | ${escapeTable(failure.evidence)} | ${escapeTable(failure.requiredFix)} |`);
    }
  }
  lines.push("");
  lines.push("## 7. Version Comparison");
  lines.push("");
  lines.push("| area | previous | current | regression/improvement |");
  lines.push("| --- | --- | --- | --- |");
  lines.push(`| Benchmark report availability | ${report.versionComparison.comparedVersion || "None"} | ${report.reportId} | Baseline artifact available |`);
  lines.push("");
  lines.push("## 8. Recommendations");
  lines.push("");
  for (const recommendation of report.recommendations) {
    lines.push(`- ${recommendation}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function summarizeCase(file) {
  const data = file.data;
  const structuralFailures = [];
  for (const field of ["expectedObservations", "expectedRecommendations", "scoringCriteria", "failureModes"]) {
    if (!Array.isArray(data[field]) || data[field].length === 0) {
      structuralFailures.push({
        severity: "High",
        summary: `${data.benchmarkId || file.name} is missing ${field}.`,
        evidence: file.name,
        requiredFix: `Add non-empty ${field} entries.`
      });
    }
  }

  const expectedSamples = [
    ...(data.expectedObservations || []).slice(0, 2).map((expected) => ({
      expected,
      notes: `${data.benchmarkId}: expected observation`
    })),
    ...(data.expectedRecommendations || []).slice(0, 2).map((expected) => ({
      expected,
      notes: `${data.benchmarkId}: expected recommendation`
    }))
  ];

  return {
    benchmarkId: data.benchmarkId,
    category: data.category,
    title: data.title,
    version: data.version,
    status: structuralFailures.length ? "NeedsDatasetFix" : "DatasetReady",
    expectedObservationCount: (data.expectedObservations || []).length,
    expectedRecommendationCount: (data.expectedRecommendations || []).length,
    scoringCriterionCount: (data.scoringCriteria || []).length,
    failureModeCount: (data.failureModes || []).length,
    structuralFailures,
    expectedSamples
  };
}

function createUnscoredDimensions() {
  return [
    "Design Quality",
    "Technical Accuracy",
    "Production Quality",
    "Consistency",
    "Traceability",
    "Validation",
    "Risk Detection",
    "Creativity Preservation",
    "Hallucination Resistance",
    "Evidence Usage",
    "Unknown Handling"
  ].map((dimension) => ({
    dimension,
    score: "NotRun",
    evidence: "No live agent output evaluated in DatasetBaseline mode.",
    notes: "Attach live benchmark evaluation before using this as a capability score."
  }));
}

function summarizeReport(cases, missingCategories, structuralFailures) {
  if (structuralFailures.length > 0) {
    return `${cases.length} benchmark case(s) loaded with ${structuralFailures.length} structural failure(s).`;
  }
  if (missingCategories.length > 0) {
    return `${cases.length} benchmark case(s) loaded; ${missingCategories.length} expected categor${missingCategories.length === 1 ? "y is" : "ies are"} missing.`;
  }
  return `${cases.length} benchmark case(s) loaded across all expected categories.`;
}

function createRecommendations(missingCategories, structuralFailures) {
  const recommendations = [];
  if (structuralFailures.length > 0) {
    recommendations.push("Fix structural dataset failures before running live agent evaluation.");
  }
  if (missingCategories.length > 0) {
    recommendations.push(`Add seed datasets for missing categories: ${missingCategories.join(", ")}.`);
  }
  recommendations.push("Run live agent outputs against each benchmark case and replace NotRun scores with evidence-backed scores.");
  recommendations.push("Compare this report against the previous release before claiming capability improvement.");
  recommendations.push("Feed benchmark regressions into the Production State Graph as risks or next actions.");
  return recommendations;
}

function escapeTable(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}
