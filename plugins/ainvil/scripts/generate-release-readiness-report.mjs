import { createReleaseReadinessReport } from "../core/release-readiness.mjs";
import { relativeAInvilPath } from "../core/ainvil-paths.mjs";

const result = await createReleaseReadinessReport();
console.log(`Release readiness report generated: ${relativeAInvilPath(result.path)} (${result.data.decision}).`);
