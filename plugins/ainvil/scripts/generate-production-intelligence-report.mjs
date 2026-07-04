import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const graphPath = path.resolve(pluginRoot, process.argv[2] || "state/production_state_graph.json");
const reportPath = path.resolve(pluginRoot, process.argv[3] || "reports/production_intelligence_report.json");

const validationLevels = [
  "Not Checked",
  "Document Review",
  "Static Analysis",
  "Unity Inspection",
  "Compile Verified",
  "Play Mode Verified",
  "Runtime Tested",
  "User Confirmed"
];

const graph = JSON.parse(await readFile(graphPath, "utf8"));
const nodes = graph.nodes || [];
const edges = graph.edges || [];
const byId = new Map(nodes.map((node) => [node.id, node]));

const report = createReport();
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Production intelligence report generated: ${path.relative(pluginRoot, reportPath)}`);

function createReport() {
  const coverage = coverageFindings();
  const risks = riskFindings(coverage);
  const recommendations = recommendationFindings(coverage, risks);
  const validationCoverage = countValidationLevels();

  return {
    schemaVersion: "1.0.0",
    reportId: `PI-${graph.graphId || "Graph"}-${new Date().toISOString().slice(0, 10)}`,
    graphId: graph.graphId,
    graphVersion: graph.version,
    generatedAt: new Date().toISOString(),
    currentMilestoneNodeId: graph.currentMilestoneNodeId,
    activeFeatureNodeId: graph.activeFeatureNodeId,
    overallSummary: summarize(risks, coverage),
    health: healthIndicators(coverage, risks, validationCoverage),
    coverage,
    risks,
    recommendations,
    openDesignQuestions: idsByType("OpenQuestion").filter((id) => byId.get(id)?.owner !== "Unity Agent"),
    openTechnicalDecisions: nodes
      .filter((node) => node.type === "DesignDecision" && ["Proposed", "Needs technical confirmation", "Needs design confirmation"].includes(node.status))
      .map((node) => node.id),
    blockedTasks: nodes
      .filter((node) => node.type === "ImplementationTask" && node.status === "Blocked")
      .map((node) => node.id),
    validationCoverage
  };
}

function coverageFindings() {
  const findings = [];
  for (const requirement of nodesOfType("Requirement")) {
    if (!hasPathToType(requirement.id, "FeatureSpec", 3)) {
      findings.push(finding("RequirementWithoutFeatureSpec", requirement.id, "Missing", `${requirement.id} has no linked FeatureSpec node.`));
    }
    if (!hasIncomingOrOutgoing(requirement.id, "implements", "ImplementationTask")) {
      findings.push(finding("RequirementWithoutTask", requirement.id, "Missing", `${requirement.id} has no implementation task.`));
    }
  }

  for (const feature of nodesOfType("Feature")) {
    if (!featureHasUnityTarget(feature.id)) {
      findings.push(finding("FeatureWithoutUnityTarget", feature.id, "Missing", `${feature.id} has no UnityTarget path through requirement/task links.`));
    }
  }

  for (const task of nodesOfType("ImplementationTask")) {
    if (!taskHasValidation(task.id)) {
      findings.push(finding("TaskWithoutValidation", task.id, "Missing", `${task.id} has no ValidationEvidence path.`));
    }
  }

  for (const acceptance of nodesOfType("AcceptanceCriterion")) {
    if (!hasIncomingOrOutgoing(acceptance.id, "validates", "ValidationEvidence")) {
      findings.push(finding("AcceptanceWithoutEvidence", acceptance.id, "Missing", `${acceptance.id} has no validation evidence.`));
    }
  }

  for (const target of nodesOfType("UnityTarget")) {
    if (!unityTargetHasRequirement(target.id)) {
      findings.push(finding("UnityTargetWithoutRequirement", target.id, "Missing", `${target.id} is not traceable to a requirement.`));
    }
  }

  return findings;
}

function riskFindings(coverage) {
  const risks = [];
  for (const node of nodes.filter((entry) => entry.status === "Blocked")) {
    risks.push({
      riskId: `RISK-Blocked-${node.id}`,
      severity: "High",
      reason: `${node.id} is blocked.`,
      impact: "Blocked production work can stop milestone progress.",
      suggestedMitigation: "Resolve the blocker or reroute dependent work.",
      evidenceNodeIds: [node.id]
    });
  }

  const missingValidation = coverage.filter((item) => ["TaskWithoutValidation", "AcceptanceWithoutEvidence"].includes(item.kind));
  if (missingValidation.length > 0) {
    risks.push({
      riskId: "RISK-ValidationCoverage",
      severity: "High",
      reason: "One or more tasks or acceptance criteria have no validation evidence.",
      impact: "AInvil cannot safely claim implemented features are playable or correct.",
      suggestedMitigation: "Route validation gaps to Input Agent or Unity Agent depending on required validation level.",
      evidenceNodeIds: unique(missingValidation.flatMap((item) => item.nodeIds))
    });
  }

  const openQuestions = nodesOfType("OpenQuestion").filter((node) => !["Deferred", "Cut", "Superseded"].includes(node.status));
  if (openQuestions.length >= 3) {
    risks.push({
      riskId: "RISK-OpenQuestions",
      severity: "Medium",
      reason: "Several open questions remain unresolved.",
      impact: "Unresolved design or technical questions can cause rework and design drift.",
      suggestedMitigation: "Ask the user to resolve or defer the highest-impact open questions before major implementation.",
      evidenceNodeIds: openQuestions.map((node) => node.id)
    });
  }

  return risks;
}

function recommendationFindings(coverage, risks) {
  const recommendations = [];
  const firstCoverageGap = coverage.find((item) => item.status === "Missing");
  if (firstCoverageGap) {
    recommendations.push({
      recommendationId: `REC-${firstCoverageGap.kind}`,
      title: recommendationTitle(firstCoverageGap.kind),
      reason: firstCoverageGap.summary,
      referencesNodeIds: firstCoverageGap.nodeIds,
      suggestedOwner: ownerForCoverage(firstCoverageGap.kind),
      priority: ["TaskWithoutValidation", "AcceptanceWithoutEvidence"].includes(firstCoverageGap.kind) ? "High" : "Medium",
      requiredValidationLevel: "Document Review"
    });
  }

  const firstRisk = risks[0];
  if (firstRisk) {
    recommendations.push({
      recommendationId: `REC-${firstRisk.riskId}`,
      title: "Address the highest production risk.",
      reason: firstRisk.reason,
      referencesNodeIds: firstRisk.evidenceNodeIds,
      suggestedOwner: "Orchestrator",
      priority: firstRisk.severity === "Critical" ? "Critical" : "High",
      requiredValidationLevel: "Document Review"
    });
  }

  if (recommendations.length === 0 && graph.nextRecommendedAction?.referencesNodeId) {
    recommendations.push({
      recommendationId: "REC-GraphNextAction",
      title: graph.nextRecommendedAction.title,
      reason: graph.nextRecommendedAction.reason || "Graph nextRecommendedAction is available.",
      referencesNodeIds: [graph.nextRecommendedAction.referencesNodeId],
      suggestedOwner: graph.nextRecommendedAction.owner || "Orchestrator",
      priority: "Medium",
      requiredValidationLevel: graph.nextRecommendedAction.requiredValidationLevel || "Document Review"
    });
  }
  return recommendations;
}

function healthIndicators(coverage, risks, validationCoverage) {
  const visionNodes = nodesOfType("Vision");
  const requirementNodes = nodesOfType("Requirement");
  const taskNodes = nodesOfType("ImplementationTask");
  const featureSpecNodes = nodesOfType("FeatureSpec");
  const blockedNodes = nodes.filter((node) => node.status === "Blocked");
  const evidenceNodes = nodesOfType("ValidationEvidence");

  return [
    {
      category: "Vision Health",
      status: visionNodes.length === 0 ? "Unknown" : risks.some((risk) => /drift/i.test(risk.reason)) ? "Yellow" : "Green",
      reason: visionNodes.length === 0 ? "No Vision node exists." : "Vision node exists in the graph.",
      evidenceNodeIds: visionNodes.map((node) => node.id)
    },
    {
      category: "Design Health",
      status: requirementNodes.length === 0 ? "Unknown" : coverage.some((item) => item.kind === "RequirementWithoutFeatureSpec") ? "Yellow" : "Green",
      reason: requirementNodes.length === 0 ? "No requirements exist." : "Requirements exist; missing design links are reported separately.",
      evidenceNodeIds: requirementNodes.map((node) => node.id)
    },
    {
      category: "Technical Health",
      status: taskNodes.length === 0 ? "Unknown" : blockedNodes.length > 0 ? "Red" : coverage.some((item) => item.kind === "RequirementWithoutTask") ? "Yellow" : "Green",
      reason: taskNodes.length === 0 ? "No implementation tasks exist." : "Implementation task health is based on blockers and requirement-task coverage.",
      evidenceNodeIds: unique([...taskNodes.map((node) => node.id), ...blockedNodes.map((node) => node.id)])
    },
    {
      category: "Documentation Health",
      status: featureSpecNodes.length === 0 ? "Unknown" : coverage.some((item) => item.kind === "RequirementWithoutFeatureSpec") ? "Yellow" : "Green",
      reason: featureSpecNodes.length === 0 ? "No FeatureSpec nodes exist." : "FeatureSpec nodes exist; missing document links are reported separately.",
      evidenceNodeIds: featureSpecNodes.map((node) => node.id)
    },
    {
      category: "Validation Health",
      status: evidenceNodes.length === 0 ? "Unknown" : validationCoverage["Not Checked"] > 0 ? "Red" : coverage.some((item) => item.kind.includes("Validation") || item.kind.includes("Evidence")) ? "Yellow" : "Green",
      reason: evidenceNodes.length === 0 ? "No validation evidence exists." : "Validation health is based on evidence nodes and validation levels.",
      evidenceNodeIds: evidenceNodes.map((node) => node.id)
    },
    {
      category: "Production Health",
      status: risks.some((risk) => ["High", "Critical"].includes(risk.severity)) ? "Red" : risks.length > 0 ? "Yellow" : "Green",
      reason: risks.length === 0 ? "No production risks detected by Phase 1 rules." : "Production risks were detected by Phase 1 rules.",
      evidenceNodeIds: unique([
        ...risks.flatMap((risk) => risk.evidenceNodeIds),
        graph.currentMilestoneNodeId,
        graph.nextRecommendedAction?.referencesNodeId
      ])
    }
  ];
}

function countValidationLevels() {
  const counts = Object.fromEntries(validationLevels.map((level) => [level, 0]));
  for (const node of nodes) {
    const level = node.validationLevel || node.evidence?.validationLevel;
    if (level && counts[level] !== undefined) counts[level]++;
  }
  return counts;
}

function summarize(risks, coverage) {
  if (risks.length > 0) return `${risks.length} production risk(s) detected; ${coverage.length} coverage finding(s) detected.`;
  if (coverage.length > 0) return `${coverage.length} coverage finding(s) detected.`;
  return "No Phase 1 production intelligence risks detected.";
}

function finding(kind, nodeId, status, summary) {
  return {
    findingId: `COVERAGE-${kind}-${nodeId}`,
    kind,
    status,
    nodeIds: [nodeId],
    summary
  };
}

function nodesOfType(type) {
  return nodes.filter((node) => node.type === type);
}

function idsByType(type) {
  return nodesOfType(type).map((node) => node.id);
}

function hasIncomingOrOutgoing(nodeId, edgeType, targetType) {
  return edges.some((edge) => {
    if (edge.type !== edgeType || ![edge.from, edge.to].includes(nodeId)) return false;
    const other = edge.from === nodeId ? edge.to : edge.from;
    return byId.get(other)?.type === targetType;
  });
}

function hasPathToType(nodeId, targetType, maxDepth = 3) {
  const visited = new Set();
  const queue = [{ id: nodeId, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.id) || current.depth > maxDepth) continue;
    visited.add(current.id);
    if (current.id !== nodeId && byId.get(current.id)?.type === targetType) return true;
    for (const edge of edges.filter((item) => item.from === current.id || item.to === current.id)) {
      queue.push({ id: edge.from === current.id ? edge.to : edge.from, depth: current.depth + 1 });
    }
  }
  return false;
}

function featureHasUnityTarget(featureId) {
  const visited = new Set();
  const stack = [featureId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    if (byId.get(current)?.type === "UnityTarget") return true;
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) {
      stack.push(edge.from === current ? edge.to : edge.from);
    }
  }
  return false;
}

function taskHasValidation(taskId) {
  const visited = new Set();
  const stack = [taskId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    if (byId.get(current)?.type === "ValidationEvidence") return true;
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) {
      stack.push(edge.from === current ? edge.to : edge.from);
    }
  }
  return false;
}

function unityTargetHasRequirement(targetId) {
  const visited = new Set();
  const stack = [targetId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    if (byId.get(current)?.type === "Requirement") return true;
    for (const edge of edges.filter((item) => item.from === current || item.to === current)) {
      stack.push(edge.from === current ? edge.to : edge.from);
    }
  }
  return false;
}

function recommendationTitle(kind) {
  return {
    RequirementWithoutFeatureSpec: "Create or link the missing Feature Spec.",
    RequirementWithoutTask: "Create an implementation task for the requirement.",
    FeatureWithoutUnityTarget: "Map the feature to a Unity target.",
    TaskWithoutValidation: "Add validation evidence for the implementation task.",
    AcceptanceWithoutEvidence: "Validate the acceptance criterion.",
    UnityTargetWithoutRequirement: "Link the Unity target back to a requirement."
  }[kind] || "Resolve coverage gap.";
}

function ownerForCoverage(kind) {
  return {
    RequirementWithoutFeatureSpec: "GDD Agent",
    RequirementWithoutTask: "Orchestrator",
    FeatureWithoutUnityTarget: "Unity Agent",
    TaskWithoutValidation: "Input Agent",
    AcceptanceWithoutEvidence: "Input Agent",
    UnityTargetWithoutRequirement: "Unity Agent"
  }[kind] || "Orchestrator";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
