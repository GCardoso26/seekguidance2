import type { JudgeResponse } from "@/types/judge";
import { stripEnglishJudgeDisclaimer } from "@/lib/judge-sources";

export type VerdictKind = "permitido" | "nao_permitido" | "depende" | "informacao" | "indisponivel";

export type ParsedVerdict = {
  kind: VerdictKind;
  label: string;
  ruleApplied: string | null;
  explanation: string;
  exceptions: string | null;
  rawAnswer: string;
};

const VERDICT_LABELS: Record<VerdictKind, string> = {
  permitido: "Permitido",
  nao_permitido: "Não permitido",
  depende: "Depende",
  informacao: "Informação",
  indisponivel: "Indisponível",
};

const SECTION_PATTERNS: { key: keyof Omit<ParsedVerdict, "kind" | "label" | "rawAnswer">; re: RegExp }[] = [
  { key: "ruleApplied", re: /^\s*(?:\*\*)?(?:regra aplicada|rule applied)(?:\*\*)?\s*:\s*(.+)$/im },
  { key: "explanation", re: /^\s*(?:\*\*)?(?:explica(?:ç|c)(?:ã|a)o|explanation)(?:\*\*)?\s*:\s*(.+)$/im },
  { key: "exceptions", re: /^\s*(?:\*\*)?(?:exce(?:ç|c)(?:õ|o)es|notas|exceptions)(?:\*\*)?\s*:\s*(.+)$/im },
];

function normalizeVerdictKind(raw: string | null | undefined, success: boolean): VerdictKind {
  if (!success) return "indisponivel";
  const v = (raw || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/nao permitido|not allowed|proibido|illegal/.test(v)) return "nao_permitido";
  if (/depende|depends|situacional/.test(v)) return "depende";
  if (/informacao|information|esclarecimento/.test(v)) return "informacao";
  if (/permitido|allowed|legal|sim/.test(v)) return "permitido";
  return "informacao";
}

function extractSection(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m?.[1]?.trim() || null;
}

function extractVerdictLine(text: string): string | null {
  const m = text.match(/^\s*(?:\*\*)?(?:veredito|verdict)(?:\*\*)?\s*:\s*(.+)$/im);
  return m?.[1]?.trim() || null;
}

export function parseJudgeVerdict(response: JudgeResponse): ParsedVerdict {
  const rawAnswer = stripEnglishJudgeDisclaimer(response.answer);
  const apiVerdict = response.verdict ?? extractVerdictLine(rawAnswer);
  const kind = normalizeVerdictKind(apiVerdict, response.success);

  let ruleApplied = response.rule_applied?.trim() || null;
  let explanation = response.explanation?.trim() || "";
  let exceptions = response.exceptions?.trim() || null;

  if (!ruleApplied) ruleApplied = extractSection(rawAnswer, SECTION_PATTERNS[0].re);
  if (!explanation) explanation = extractSection(rawAnswer, SECTION_PATTERNS[1].re) || rawAnswer;
  if (!exceptions) exceptions = extractSection(rawAnswer, SECTION_PATTERNS[2].re);

  if (apiVerdict && explanation.toLowerCase().startsWith(apiVerdict.toLowerCase())) {
    explanation = explanation.slice(apiVerdict.length).replace(/^[\s:–-]+/, "").trim();
  }

  return {
    kind,
    label: VERDICT_LABELS[kind],
    ruleApplied,
    explanation: explanation || rawAnswer,
    exceptions,
    rawAnswer,
  };
}

export function verdictBadgeClass(kind: VerdictKind): string {
  switch (kind) {
    case "permitido":
      return "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]";
    case "nao_permitido":
      return "bg-[hsl(var(--danger))]/15 text-[hsl(var(--danger))]";
    case "depende":
      return "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]";
    case "informacao":
      return "bg-[hsl(var(--tcg-accent)/0.15)] text-[hsl(var(--tcg-accent))]";
    default:
      return "bg-[hsl(var(--muted))] text-[hsl(222_20%_35%)]";
  }
}

export function extractHighlightTerms(ruleApplied: string | null, explanation: string): string[] {
  const terms = new Set<string>();
  const sources = [ruleApplied, explanation].filter(Boolean).join(" ");

  for (const m of sources.matchAll(/\b(?:CR|IPG|MTR|TR)?\s*\d+(?:\.\d+[a-z]?)?(?:[–-]\d+[a-z]?)?\b/gi)) {
    terms.add(m[0].replace(/\s+/g, " ").trim());
  }
  for (const m of sources.matchAll(/\b(?:sec(?:ç|c)(?:ã|a)o|section|rule)\s+[\d.]+[a-z]?/gi)) {
    terms.add(m[0].trim());
  }
  for (const m of sources.matchAll(/"([^"]{4,80})"/g)) {
    terms.add(m[1].trim());
  }

  return [...terms].slice(0, 8);
}
