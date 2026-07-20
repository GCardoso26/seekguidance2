import fs from "node:fs";
import path from "node:path";

function indexPath(testingRoot) {
  return path.join(testingRoot, "history", "index.json");
}

export function readCampaignIndex(testingRoot) {
  const p = indexPath(testingRoot);
  if (!fs.existsSync(p)) {
    return { schemaVersion: 1, nextCampaignNumber: 1, campaigns: [] };
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function peekNextCampaignId(testingRoot) {
  const index = readCampaignIndex(testingRoot);
  const n = index.nextCampaignNumber ?? 1;
  return `campaign-${String(n).padStart(3, "0")}`;
}
