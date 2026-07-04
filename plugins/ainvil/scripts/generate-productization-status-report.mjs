#!/usr/bin/env node
import { createProductizationStatusReport } from "../core/productization-status.mjs";
import { relativeAInvilPath } from "../core/ainvil-paths.mjs";

const result = await createProductizationStatusReport();
console.log(`Productization status report generated: ${relativeAInvilPath(result.path)}`);
console.log(`Productization markdown report generated: ${relativeAInvilPath(result.markdownPath)}`);
