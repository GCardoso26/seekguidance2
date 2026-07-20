/**
 * Confidence — distingue PASS nunca testado vs parcial vs completo.
 * Métrica de engenharia (não North Star).
 */

const STATUS_BASE = {
  pass: 0.92,
  warn: 0.72,
  partial: 0.58,
  fail: 0.25,
  blocked: 0.08,
  pending_manual: 0.45,
};

/** @param {{ status?: string, automated?: boolean, note?: string, reason?: string, confidence?: number, coverageLevel?: string }} persona */
export function confidenceForPersona(persona) {
  const status = (persona?.status || "pending_manual").toLowerCase();

  // Respeita confidence explícita do runner (ex.: Marina lifecycle parcial = 78).
  if (typeof persona?.confidence === "number" && Number.isFinite(persona.confidence)) {
    const conf = Math.max(0, Math.min(100, Math.round(persona.confidence)));
    const level =
      persona.coverageLevel === "partial"
        ? "partial"
        : conf >= 90
          ? "full"
          : conf >= 70
            ? "strong"
            : conf >= 50
              ? "partial"
              : conf >= 25
                ? "weak"
                : "none";
    return {
      status: mapDisplayStatus(status),
      confidence: conf,
      level,
    };
  }

  let base = STATUS_BASE[status] ?? 0.4;

  if (persona?.automated === true) {
    if (status === "pass") base = 0.98;
    else if (status === "warn") base = Math.min(base, 0.78);
    else if (status === "partial") base = 0.62;
  } else if (persona?.automated === false) {
    if (status === "pass" || status === "pending_manual") base = Math.min(base, 0.61);
  }

  if (/campanha|manual|browser|supervisionado|parcial/i.test(persona?.note || persona?.reason || "")) {
    base = Math.min(base, 0.65);
  }

  const level =
    base >= 0.9 ? "full" : base >= 0.7 ? "strong" : base >= 0.5 ? "partial" : base >= 0.25 ? "weak" : "none";

  return {
    status: mapDisplayStatus(status),
    confidence: Math.round(base * 100),
    level,
  };
}

function mapDisplayStatus(status) {
  if (status === "pass") return "PASS";
  if (status === "fail" || status === "blocked") return "FAIL";
  if (status === "warn" || status === "partial" || status === "pending_manual") return "WARN";
  return "WARN";
}

/** Ricardo audit + smoke como infra confidence */
export function confidenceInfrastructure({ audit, smokeOk }) {
  if (!audit) return { status: "FAIL", confidence: 0, level: "none" };
  const ready = audit.readyForFunctionalQA === true && smokeOk === true;
  const score = audit.environmentScore ?? 0;
  let conf = ready ? 95 : Math.round(score * 0.85);
  if (!smokeOk) conf = Math.min(conf, 55);
  return {
    status: ready ? "PASS" : score >= 50 ? "WARN" : "FAIL",
    confidence: conf,
    level: ready ? "full" : smokeOk ? "partial" : "weak",
  };
}

export function buildConfidenceReport({ audit, smokeOk, personas }) {
  const infra = confidenceInfrastructure({ audit, smokeOk });
  const byPersona = {};
  for (const p of personas) {
    byPersona[p.personaId] = confidenceForPersona(p);
  }
  return { infrastructure: infra, personas: byPersona };
}
