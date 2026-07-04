import { loadProductionStateGraph, loadValidationEvidence } from "./loaders.mjs";
import { countBy } from "./summaries.mjs";

export async function createTraceabilityView(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const graph = options.graph || (await loadProductionStateGraph({ strict: true })).data;
  const evidenceRecords = options.evidenceRecords || (await loadValidationEvidence()).map((item) => item.data);
  const rows = buildRows(graph, { evidenceRecords });
  const proposedLinks = proposedEvidenceLinks(graph, evidenceRecords);
  return {
    schemaVersion: "1.0.0",
    viewId: `TRACE-${graph.graphId || "Graph"}-${generatedAt.slice(0, 10)}`,
    generatedAt,
    sourceGraphId: graph.graphId,
    rows,
    proposedLinks,
    summary: {
      rowCount: rows.length,
      countsByStatus: countBy(rows, "status"),
      missingLinkCount: rows.reduce((sum, row) => sum + row.missingLinks.length, 0),
      proposedLinkCount: proposedLinks.length
    }
  };
}

export function buildRows(graph, options = {}) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const evidenceRecords = options.evidenceRecords || [];
  const features = nodes.filter((node) => node.type === "Feature");
  const rows = [];
  for (const feature of features) {
    const specs = linked(nodes, edges, feature.id, "FeatureSpec");
    const requirements = linked(nodes, edges, feature.id, "Requirement");
    if (requirements.length === 0) {
      rows.push(row(feature, null, specs[0], null, null, null, null, null, "Needs Requirement Definition", ["Requirement"]));
      continue;
    }
    for (const requirement of requirements) {
      const tasks = linked(nodes, edges, requirement.id, "ImplementationTask");
      const criteria = linked(nodes, edges, requirement.id, "AcceptanceCriterion");
      if (tasks.length === 0) {
        rows.push(row(feature, requirement, specs[0], null, null, null, criteria[0], null, "Needs Implementation Task", ["ImplementationTask"]));
        continue;
      }
      for (const task of tasks) {
        const targets = linked(nodes, edges, task.id, "UnityTarget");
        const taskCriteria = merge(criteria, linked(nodes, edges, task.id, "AcceptanceCriterion"));
        if (targets.length === 0) {
          rows.push(row(feature, requirement, specs[0], task, null, null, taskCriteria[0], null, "Needs Technical Mapping", ["UnityTarget"]));
          continue;
        }
        for (const target of targets) {
          const inputs = linked(nodes, edges, target.id, "InputSpec").length ? linked(nodes, edges, target.id, "InputSpec") : nodes.filter((node) => node.type === "InputSpec");
          const usableCriteria = taskCriteria.length ? taskCriteria : [null];
          for (const criterion of usableCriteria) {
            const evidence = criterion ? evidenceForCriterion(criterion.id, nodes, edges, evidenceRecords) : [];
            const bestEvidence = evidence[0] || null;
            const missing = [];
            if (specs.length === 0) missing.push("FeatureSpec");
            if (inputs.length === 0) missing.push("InputSpec");
            if (!criterion) missing.push("AcceptanceCriterion");
            if (!bestEvidence || !isPassedEvidence(bestEvidence)) missing.push("ValidationEvidence");
            const status = missing.includes("AcceptanceCriterion")
              ? "Needs Acceptance Criteria"
              : missing.includes("ValidationEvidence")
                ? "Needs Validation"
                : missing.includes("InputSpec")
                  ? "Needs Input Spec"
                  : missing.length
                    ? "Needs Feature Spec"
                    : "Complete";
            rows.push(row(feature, requirement, specs[0], task, target, inputs[0], criterion, bestEvidence, status, missing));
          }
        }
      }
    }
  }
  for (const target of nodes.filter((node) => node.type === "UnityTarget")) {
    if (!hasRequirementPath(target.id, nodes, edges)) {
      rows.push(row(null, null, null, null, target, null, null, null, "Orphan Implementation", ["Requirement"]));
    }
  }
  return rows;
}

function row(feature, requirement, featureSpec, task, unityTarget, inputSpec, acceptance, evidence, status, missingLinks) {
  const rowId = `TRACE-${[feature?.id, requirement?.id, task?.id, unityTarget?.id, acceptance?.id].filter(Boolean).join("-") || unityTarget?.id || "Unknown"}`;
  return {
    rowId,
    featureId: feature?.id || null,
    requirementId: requirement?.id || null,
    featureSpecId: featureSpec?.id || null,
    taskId: task?.id || null,
    unityTargetId: unityTarget?.id || null,
    inputSpecId: inputSpec?.id || null,
    acceptanceId: acceptance?.id || null,
    validationEvidenceId: evidenceId(evidence),
    validationLevel: evidenceValidationLevel(evidence),
    validationEvidenceStatus: evidenceStatus(evidence),
    status,
    missingLinks,
    nextAction: missingLinks.length ? `Resolve missing ${missingLinks[0]}.` : "Continue validation or milestone review."
  };
}

function evidenceForCriterion(criterionId, nodes, edges, evidenceRecords) {
  const graphEvidence = linked(nodes, edges, criterionId, "ValidationEvidence", "validates");
  const externalEvidence = evidenceRecords.filter((evidence) => acceptanceIdsFor(evidence).includes(criterionId));
  return [...graphEvidence, ...externalEvidence].sort(compareEvidenceRecency);
}

function proposedEvidenceLinks(graph, evidenceRecords) {
  const existing = new Set((graph.edges || []).filter((edge) => edge.type === "validates").map((edge) => `${edge.from}->${edge.to}`));
  return evidenceRecords.flatMap((evidence) => acceptanceIdsFor(evidence).map((acceptanceId) => {
    const from = evidenceId(evidence);
    return {
      type: "validates",
      from,
      to: acceptanceId,
      status: existing.has(`${from}->${acceptanceId}`) ? "Existing" : "Proposed",
      evidenceStatus: evidence.status || "Unknown",
      validationLevel: evidence.validationLevel || "Not Checked"
    };
  }));
}

function acceptanceIdsFor(evidence) {
  const values = Array.isArray(evidence?.acceptanceIds) ? [...evidence.acceptanceIds] : [];
  if (evidence?.acceptanceId) values.push(evidence.acceptanceId);
  return [...new Set(values.filter(Boolean))];
}

function evidenceId(evidence) {
  return evidence?.evidenceId || evidence?.id || evidence?.evidence?.evidenceId || null;
}

function evidenceStatus(evidence) {
  return evidence?.status || evidence?.evidence?.status || "Not Checked";
}

function evidenceValidationLevel(evidence) {
  return evidence?.validationLevel || evidence?.evidence?.validationLevel || "Not Checked";
}

function isPassedEvidence(evidence) {
  return evidenceStatus(evidence) === "Passed" && !["Not Checked", "Document Review"].includes(evidenceValidationLevel(evidence));
}

function compareEvidenceRecency(left, right) {
  return evidenceTime(right) - evidenceTime(left);
}

function evidenceTime(evidence) {
  return Date.parse(evidence?.finishedAt || evidence?.startedAt || evidence?.evidence?.timestamp || "") || 0;
}

function linked(nodes, edges, id, type, edgeType = null) {
  const ids = new Set(edges.filter((edge) => (edge.from === id || edge.to === id) && (!edgeType || edge.type === edgeType)).flatMap((edge) => [edge.from, edge.to]).filter((value) => value !== id));
  return nodes.filter((node) => node.type === type && ids.has(node.id));
}

function merge(...groups) {
  return [...new Map(groups.flat().filter(Boolean).map((node) => [node.id, node])).values()];
}

function hasRequirementPath(startId, nodes, edges) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set();
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    if (byId.get(id)?.type === "Requirement") return true;
    for (const edge of edges.filter((item) => item.from === id || item.to === id)) stack.push(edge.from === id ? edge.to : edge.from);
  }
  return false;
}
