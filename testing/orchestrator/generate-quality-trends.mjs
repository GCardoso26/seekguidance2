#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeQualityTrendsReportSync } from "./lib/quality-trends.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");
const out = writeQualityTrendsReportSync(testingRoot);
console.log(`✓ Quality trends → ${out}`);
