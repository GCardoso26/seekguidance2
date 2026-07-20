import fs from "node:fs";
import path from "node:path";
import { readCampaignIndex } from "./campaign-index.mjs";

function saveIndex(testingRoot, index) {
  const dir = historyDir(testingRoot);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(index, null, 2), "utf8");
}

function historyDir(testingRoot) {
  return path.join(testingRoot, "history");
}

function campaignFileName(n) {
  return `campaign-${String(n).padStart(3, "0")}.json`;
}

function resolveEnvironment(audit) {
  const env =
    process.env.JUDGE_TEST_ENV ||
    process.env.TEST_ENV ||
    audit?.checks?.find((c) => c.id === "judge_test_env")?.detail?.replace("inferred=", "") ||
    "LOCAL";
  return String(env).toUpperCase().includes("STAGING")
    ? "STAGING"
    : String(env).toUpperCase().includes("CI")
      ? "CI"
      : "LOCAL";
}

/**
 * Grava campanha imutável em testing/history/. Nunca sobrescreve arquivo existente.
 */
export function archiveCampaign(testingRoot, snapshot) {
  const index = readCampaignIndex(testingRoot);
  const n = index.nextCampaignNumber;
  const id = campaignFileName(n).replace(".json", "");
  const fileName = campaignFileName(n);
  const dir = historyDir(testingRoot);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);

  if (fs.existsSync(filePath)) {
    throw new Error(`Campaign archive conflict: ${fileName} already exists (immutable history)`);
  }

  const record = {
    schemaVersion: 1,
    campaignNumber: n,
    id,
    ...snapshot,
  };

  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");

  index.campaigns.push({
    id,
    campaignNumber: n,
    file: fileName,
    generatedAt: record.generatedAt,
    p0: record.counts?.p0 ?? 0,
    p1: record.counts?.p1 ?? 0,
    p2: record.counts?.p2 ?? 0,
    regressions: record.counts?.regressions ?? 0,
    durationMinutes: record.durationMinutes,
    environment: record.environment,
    stack: record.stack,
    overall: record.releaseReadiness?.overall,
  });
  index.nextCampaignNumber = n + 1;
  saveIndex(testingRoot, index);

  return { filePath, id, campaignNumber: n, indexPath: path.join(dir, "index.json") };
}

export function buildCampaignSnapshot({
  consolidated,
  campaignCounts,
  releaseReadiness,
  confidence,
  featureCoverage,
  audit,
  smokeOk,
  startedAt,
  endedAt,
}) {
  const durationMs = endedAt - startedAt;
  const durationMinutes = Math.max(1, Math.round(durationMs / 60_000));

  return {
    generatedAt: new Date(endedAt).toISOString(),
    durationMinutes,
    environment: resolveEnvironment(audit),
    stack: smokeOk && audit?.readyForFunctionalQA ? "PASS" : audit?.readyForFunctionalQA ? "WARN" : "FAIL",
    counts: {
      p0: campaignCounts.p0,
      p1: campaignCounts.p1,
      p2: campaignCounts.p2,
      regressions: consolidated.cursorHandoff?.regressions?.length ?? 0,
      seenAgain: campaignCounts.seenAgain,
      newBugs: campaignCounts.new,
    },
    confidence,
    featureCoverage,
    releaseReadiness,
    personas: consolidated.personas,
    source: consolidated.source,
  };
}
