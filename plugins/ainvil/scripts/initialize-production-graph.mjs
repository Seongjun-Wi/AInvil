#!/usr/bin/env node
import { createInitialProductionGraph } from "../core/productization-status.mjs";
import { relativeAInvilPath } from "../core/ainvil-paths.mjs";

const write = !process.argv.includes("--dry-run");
const result = await createInitialProductionGraph({ write });

if (write) {
  console.log(`Production graph initialized: ${relativeAInvilPath(result.path)}`);
} else {
  console.log(JSON.stringify(result.data, null, 2));
}
