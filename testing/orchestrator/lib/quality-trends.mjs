import fs from "node:fs";
import path from "node:path";

function bar(value, max, width = 5) {
  if (max <= 0) return "·".repeat(width);
  const filled = Math.round((value / max) * width);
  return "█".repeat(Math.max(0, filled)) + "·".repeat(Math.max(0, width - filled));
}

function loadCampaigns(testingRoot) {
  const indexPath = path.join(testingRoot, "history", "index.json");
  if (!fs.existsSync(indexPath)) return [];
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  return (index.campaigns || []).slice().sort((a, b) => (a.campaignNumber ?? 0) - (b.campaignNumber ?? 0));
}

export function writeQualityTrendsReportSync(testingRoot) {
  const campaigns = loadCampaigns(testingRoot);
  const lines = [
    "# Quality Trends",
    "",
    "Gerado a partir de `testing/history/` — campanhas imutáveis.",
    "",
  ];
  if (campaigns.length === 0) {
    lines.push("_Nenhuma campanha arquivada ainda._", "");
  } else {
    const maxP0 = Math.max(1, ...campaigns.map((c) => c.p0));
    const maxP1 = Math.max(1, ...campaigns.map((c) => c.p1));
    lines.push("## Campanhas", "", "| # | P0 | P1 | P2 | Regressions | Duration | Env | Stack |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const c of campaigns) {
      lines.push(
        `| ${c.id} | ${c.p0} | ${c.p1} | ${c.p2} | ${c.regressions} | ${c.durationMinutes} min | ${c.environment} | ${c.stack} |`,
      );
    }
    lines.push("", "## P0", "");
    for (const c of campaigns) {
      lines.push(`${c.id.padEnd(14)} ${bar(c.p0, maxP0)} ${c.p0}`);
    }
    lines.push("", "## P1", "");
    for (const c of campaigns) {
      lines.push(`${c.id.padEnd(14)} ${bar(c.p1, maxP1)} ${c.p1}`);
    }
  }
  const out = path.join(testingRoot, "reports", "quality-trends.md");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  return out;
}
