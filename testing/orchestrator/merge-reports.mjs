import fs from "node:fs";
import path from "node:path";
import { archiveCampaign, buildCampaignSnapshot } from "./lib/campaign-archive.mjs";
import { buildConfidenceReport } from "./lib/confidence.mjs";
import { fcsFromPersonaReports } from "./lib/feature-coverage.mjs";
import {
  computeReleaseReadiness,
  formatReleaseReadinessMarkdown,
} from "./lib/release-readiness.mjs";
import { reconcileBugKnowledgeBase } from "../knowledge/bug-knowledge-base.mjs";
import { writeQualityTrendsReportSync } from "./lib/quality-trends.mjs";
import { peekNextCampaignId } from "./lib/campaign-index.mjs";

const PRIORITY = ["p0", "p1", "p2", "p3"];

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function flattenBugs(report) {
  const bugs = report?.bugs ?? {};
  const out = [];
  for (const p of PRIORITY) {
    for (const item of bugs[p] ?? []) {
      out.push({
        priority: p.toUpperCase(),
        text: typeof item === "string" ? item : JSON.stringify(item),
        personaId: report.personaId,
        persona: report.displayName || report.persona,
        files: [],
      });
    }
  }
  return out;
}

function inferFiles(bugText) {
  const hints = [];
  if (/search/i.test(bugText)) hints.push("frontend/runtime_console_v3/src/**/search/**", "services/api/src/search/**");
  if (/catalog|provider/i.test(bugText)) hints.push("services/api/src/catalog/**");
  if (/checkout/i.test(bugText)) hints.push("services/api/src/checkout/**", "frontend/runtime_console_v3/src/**/checkout/**");
  if (/HTTP|localhost|stack/i.test(bugText)) hints.push("(infra — subir console + API + search)");
  return [...new Set(hints)];
}

function groupFindings(allBugs) {
  const findings = { p0: [], p1: [], p2: [], p3: [] };
  for (const b of allBugs) {
    const key = b.priority.toLowerCase();
    if (findings[key]) findings[key].push(b);
  }
  return findings;
}

/**
 * @param {string} testingRoot
 * @param {{ startedAt?: number, endedAt?: number, smokeOk?: boolean, auditOk?: boolean }} campaignMeta
 */
export function mergeCampaignReports(testingRoot, campaignMeta = {}) {
  const endedAt = campaignMeta.endedAt ?? Date.now();
  const startedAt = campaignMeta.startedAt ?? endedAt - 60_000;
  const smokeOk = campaignMeta.smokeOk === true;

  const reportsDir = path.join(testingRoot, "reports");
  const audit = loadJson(path.join(reportsDir, "environment-audit-latest.json"));

  const personaFiles = [
    "persona-marina-seller-latest.json",
    "persona-carlos-buyer-latest.json",
    "persona-fernanda-marketplace-latest.json",
    "persona-juliana-ux-latest.json",
    "persona-eduardo-search-latest.json",
    "persona-daniela-catalog-latest.json",
    "persona-renato-performance-latest.json",
  ];

  const personasFull = personaFiles.map((f) => loadJson(path.join(reportsDir, f))).filter(Boolean);

  const allBugs = [];
  if (audit && !audit.readyForFunctionalQA) {
    allBugs.push(
      ...flattenBugs({
        personaId: "ricardo-sre",
        displayName: "Ricardo Menezes",
        bugs: {
          p0: [`Environment not ready (score ${audit.environmentScore}) — ${audit.blockingIssues} blocking`],
          p1: [],
          p2: [],
          p3: [],
        },
      }),
    );
  }
  for (const p of personasFull) allBugs.push(...flattenBugs(p));

  const rawFindings = groupFindings(allBugs);
  const campaignId = peekNextCampaignId(testingRoot);
  const { handoffBugs, campaignCounts, kbUpdates } = reconcileBugKnowledgeBase(testingRoot, rawFindings, {
    id: campaignId,
    generatedAt: new Date(endedAt).toISOString(),
  });

  const byPriority = {
    p0: handoffBugs.p0.filter((b) => !b.deduplicated),
    p1: handoffBugs.p1.filter((b) => !b.deduplicated),
    p2: handoffBugs.p2.filter((b) => !b.deduplicated),
  };

  const seenAgain = [...handoffBugs.p0, ...handoffBugs.p1, ...handoffBugs.p2, ...handoffBugs.p3].filter(
    (b) => b.deduplicated,
  );

  const regressions = allBugs.filter((b) => /regress|FAIL|fail/i.test(b.text));

  const affectedFiles = [...new Set(allBugs.flatMap((b) => inferFiles(b.text)))].filter(Boolean);

  const mandatoryTests = [
    "npm run test:audit",
    "npm run test:campaign:gates",
    "npm run test:qa:orchestrator",
    "npm run test --prefix services/api -- src/catalog/providers/__tests__/gameConfigRegistry.test.ts",
    "npm run test --prefix services/api -- src/search/__tests__/searchProjection.test.ts",
    "npm run test --prefix services/api -- src/ops/__tests__/performanceBudget.test.ts",
  ];

  const acceptance = [
    "Ready for Functional QA: YES (Ricardo)",
    "Smoke PASS",
    "Nenhum P0 **novo** aberto da campanha (KB deduplicada)",
    "Relatórios persona-*-latest.json presentes",
    "MRB revisou consolidação antes de handoff ao Cursor",
  ];

  const personasSummary = personasFull.map((p) => ({
    personaId: p.personaId,
    displayName: p.displayName,
    role: p.role,
    status: p.status,
    automated: p.automated,
  }));

  const confidence = buildConfidenceReport({ audit, smokeOk, personas: personasFull });
  const featureCoverage = fcsFromPersonaReports(personasFull, audit, smokeOk);
  const personaById = Object.fromEntries(personasFull.map((x) => [x.personaId, x]));

  const releaseReadiness = computeReleaseReadiness({
    audit,
    smokeOk,
    personaById,
    confidence,
    featureCoverage,
    dedupedOpenP0: kbUpdates.openP0,
  });

  const consolidated = {
    generatedAt: new Date(endedAt).toISOString(),
    source: "QA Orchestrator R4",
    campaignId,
    environment: audit
      ? {
          score: audit.environmentScore,
          readyForFunctionalQA: audit.readyForFunctionalQA,
          blockingIssues: audit.blockingIssues,
        }
      : null,
    personas: personasSummary,
    confidence,
    featureCoverage,
    releaseReadiness,
    operationalMemory: {
      counts: campaignCounts,
      seenAgain,
      bugKnowledge: kbUpdates,
    },
    cursorHandoff: {
      bugsP0: byPriority.p0,
      bugsP1: byPriority.p1,
      bugsP2: byPriority.p2,
      seenAgain,
      regressions,
      affectedFiles,
      correctionPrompt:
        "Corrigir apenas itens com evidência nos relatórios persona-* e environment-audit-latest.json. Não alterar North Star, não seeds em Beta, respeitar ADR-001–014.",
      mandatoryTests,
      acceptanceCriteria: acceptance,
    },
  };

  const jsonPath = path.join(reportsDir, "qa-campaign-consolidated.json");

  const snapshot = buildCampaignSnapshot({
    consolidated,
    campaignCounts,
    releaseReadiness,
    confidence,
    featureCoverage,
    audit,
    smokeOk,
    startedAt,
    endedAt,
  });

  const archive = archiveCampaign(testingRoot, snapshot);
  consolidated.operationalMemory.archive = {
    id: archive.id,
    campaignNumber: archive.campaignNumber,
    file: path.relative(testingRoot, archive.filePath),
  };

  fs.writeFileSync(jsonPath, JSON.stringify(consolidated, null, 2), "utf8");

  const mdPath = path.join(reportsDir, "qa-cursor-handoff.md");
  fs.writeFileSync(mdPath, formatHandoffMarkdown(consolidated), "utf8");

  const readinessPath = path.join(reportsDir, "release-readiness.md");
  fs.writeFileSync(readinessPath, formatReleaseReadinessMarkdown(releaseReadiness), "utf8");

  const trendsPath = writeQualityTrendsReportSync(testingRoot);

  return { jsonPath, mdPath, readinessPath, trendsPath, consolidated, archive };
}

function formatHandoffMarkdown(c) {
  const h = c.cursorHandoff;
  const conf = c.confidence?.personas || {};
  const lines = [
    "# QA Cursor Handoff",
    "",
    `Campanha: **${c.campaignId}** · Gerado: ${c.generatedAt}`,
    "",
    "## Release Readiness",
    `**${c.releaseReadiness?.overall}** — ver \`testing/reports/release-readiness.md\``,
    "",
    "## Environment",
    c.environment
      ? `- Score: **${c.environment.score}** | Ready for Functional QA: **${c.environment.readyForFunctionalQA ? "YES" : "NO"}**`
      : "- Audit ausente — rode `npm run test:audit`",
    "",
    "## Confidence (personas)",
    ...Object.entries(conf).map(([id, v]) => `- \`${id}\`: ${v.status} — **${v.confidence}%** (${v.level})`),
    "",
    "## Feature Coverage (FCS)",
    ...(c.featureCoverage?.features || []).map((f) => `- ${f.name}: **${f.percent}%**`),
    "",
    "## Bugs P0 (novos nesta campanha)",
    ...h.bugsP0.map((b) => `- [${b.persona}] ${b.bugId ? `${b.bugId} — ` : ""}${b.text}`),
    h.bugsP0.length ? "" : "- (nenhum)",
    "",
    "## Bugs P1 (novos)",
    ...h.bugsP1.map((b) => `- [${b.persona}] ${b.bugId ? `${b.bugId} — ` : ""}${b.text}`),
    h.bugsP1.length ? "" : "- (nenhum)",
    "",
    "## Seen again (KB — não duplicam P0/P1)",
    ...h.seenAgain.map((b) => `- ${b.bugId} [${b.persona}] ${b.text}`),
    h.seenAgain.length ? "" : "- (nenhum)",
    "",
    "## Regressões",
    ...h.regressions.map((b) => `- [${b.priority}] ${b.text}`),
    h.regressions.length ? "" : "- (nenhuma detectada automaticamente)",
    "",
    "## Arquivos / áreas afetadas",
    ...h.affectedFiles.map((f) => `- \`${f}\``),
    "",
    "## Prompt de correção",
    h.correctionPrompt,
    "",
    "## Testes obrigatórios",
    ...h.mandatoryTests.map((t) => `- \`${t}\``),
    "",
    "## Critério de aceite",
    ...h.acceptanceCriteria.map((a) => `- ${a}`),
    "",
    `Histórico imutável: \`testing/history/${c.operationalMemory?.archive?.file || ""}\``,
    "",
    "→ **Market Review Board** consolida decisão antes de engenharia.",
  ];
  return lines.join("\n");
}
