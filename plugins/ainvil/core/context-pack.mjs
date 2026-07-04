export function createContextPack({
  gddSummary = "",
  technicalDesignSummary = "",
  unityState = null,
  recentChanges = [],
  openQuestions = []
} = {}) {
  return {
    schemaVersion: "1.0.0",
    gddSummary,
    technicalDesignSummary,
    unityState,
    recentChanges,
    openQuestions
  };
}

export function formatContextPack(pack) {
  return [
    "# AInvil Context Pack",
    "",
    "## GDD Summary",
    pack.gddSummary || "None",
    "",
    "## Technical Design Summary",
    pack.technicalDesignSummary || "None",
    "",
    "## Unity State",
    pack.unityState ? JSON.stringify(pack.unityState, null, 2) : "Unknown",
    "",
    "## Recent Changes",
    ...(pack.recentChanges || []).map((item) => `- ${item}`),
    "",
    "## Open Questions",
    ...(pack.openQuestions || []).map((item) => `- ${item}`)
  ].join("\n");
}
