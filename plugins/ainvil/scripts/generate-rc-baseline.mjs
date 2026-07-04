#!/usr/bin/env node
import { createRcBaselineManifest } from "../core/rc-baseline.mjs";
import { relativeAInvilPath } from "../core/ainvil-paths.mjs";

const result = await createRcBaselineManifest();
console.log(`RC baseline manifest generated: ${relativeAInvilPath(result.path)}`);
console.log(`RC baseline markdown generated: ${relativeAInvilPath(result.markdownPath)}`);
console.log("Environment audit generated: reports/environment_dependency_audit.json");
