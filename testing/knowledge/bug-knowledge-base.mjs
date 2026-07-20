import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_BUGS = { schemaVersion: 1, nextBugNumber: 1, bugs: [] };

const AFFECTS_MAP = {
  "marina-seller": { affects: "Seller / Listing", responsible: "Marketplace" },
  "carlos-buyer": { affects: "Buyer / Checkout", responsible: "Marketplace" },
  "fernanda-marketplace": { affects: "Marketplace", responsible: "Marketplace" },
  "eduardo-search": { affects: "Search", responsible: "Search" },
  "daniela-catalog": { affects: "Catalog", responsible: "Catalog" },
  "juliana-ux": { affects: "UX", responsible: "Frontend" },
  "renato-performance": { affects: "Performance", responsible: "Platform" },
  "ricardo-sre": { affects: "Infrastructure", responsible: "SRE" },
};

function kbPath(testingRoot) {
  return path.join(testingRoot, "knowledge", "bugs.json");
}

export function loadBugKnowledgeBase(testingRoot) {
  const p = kbPath(testingRoot);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(DEFAULT_BUGS, null, 2), "utf8");
    return structuredClone(DEFAULT_BUGS);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveKb(testingRoot, kb) {
  const p = kbPath(testingRoot);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(kb, null, 2), "utf8");
}

export function bugFingerprint(text, personaId = "") {
  const normalized = `${personaId}|${String(text).toLowerCase().replace(/\s+/g, " ").trim()}`.slice(0, 500);
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

function bugId(n) {
  return `BUG-${String(n).padStart(4, "0")}`;
}

function titleFromText(text) {
  const t = String(text).trim();
  return t.length > 80 ? `${t.slice(0, 77)}...` : t;
}

/**
 * Integra achados da campanha na KB. Reincidências incrementam seenAgain — não duplicam P0/P1/P2 na campanha.
 * @returns {{ handoffBugs: typeof findings, campaignCounts: object, kbUpdates: object }}
 */
export function reconcileBugKnowledgeBase(testingRoot, findings, campaignRef) {
  const kb = loadBugKnowledgeBase(testingRoot);
  const handoff = { p0: [], p1: [], p2: [], p3: [] };
  const campaignCounts = { p0: 0, p1: 0, p2: 0, p3: 0, seenAgain: 0, new: 0 };
  const now = new Date().toISOString().slice(0, 10);

  for (const priority of ["p0", "p1", "p2", "p3"]) {
    for (const item of findings[priority] || []) {
      const text = typeof item === "string" ? item : item.text;
      const personaId = item.personaId || "";
      const fp = bugFingerprint(text, personaId);
      let bug = kb.bugs.find((b) => b.fingerprint === fp);

      if (bug) {
        bug.lastOccurrence = now;
        bug.seenAgain = bug.seenAgain || [];
        bug.seenAgain.push({ campaignId: campaignRef.id, at: campaignRef.generatedAt });
        campaignCounts.seenAgain += 1;
        if (bug.status === "OPEN") {
          handoff[priority].push({
            ...item,
            bugId: bug.id,
            deduplicated: true,
            note: "Known bug — seen again",
          });
        }
        continue;
      }

      const id = bugId(kb.nextBugNumber++);
      const meta = AFFECTS_MAP[personaId] || { affects: "Platform", responsible: "Engineering" };
      bug = {
        id,
        fingerprint: fp,
        title: titleFromText(text),
        firstOccurrence: now,
        lastOccurrence: now,
        status: "OPEN",
        affects: meta.affects,
        responsible: meta.responsible,
        files: item.files || [],
        personaId,
        priority: priority.toUpperCase(),
        seenAgain: [],
      };
      kb.bugs.push(bug);
      campaignCounts[priority] += 1;
      campaignCounts.new += 1;
      handoff[priority].push({ ...item, bugId: id, deduplicated: false });
    }
  }

  saveKb(testingRoot, kb);

  const openP0 = kb.bugs.filter((b) => b.status === "OPEN" && b.priority === "P0").length;

  return {
    handoffBugs: handoff,
    campaignCounts,
    kbUpdates: { newBugs: campaignCounts.new, seenAgain: campaignCounts.seenAgain, openP0 },
    knowledgeBasePath: kbPath(testingRoot),
  };
}

export function countSearchBugsFromKb(testingRoot) {
  const kb = loadBugKnowledgeBase(testingRoot);
  return kb.bugs.filter((b) => b.status === "OPEN" && /search/i.test(b.affects)).length;
}
