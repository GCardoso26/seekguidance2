/**
 * FCS — Feature Coverage Score (terceiro KPI de engenharia, além de TCS/PCS).
 * Responde: o que foi exercitado nesta campanha?
 */

export const PLATFORM_FEATURES = [
  "Login",
  "Inventory",
  "Listing",
  "Search",
  "Checkout",
  "Reports",
  "Sealed Products",
  "Favorites",
];

/**
 * @param {{ audit: object|null, smokeOk: boolean, personas: object[], personaById: Record<string,object> }} ctx
 */
export function computeFeatureCoverage(ctx) {
  const p = ctx.personaById || {};
  const audit = ctx.audit;
  const smoke = ctx.smokeOk === true;
  const ready = audit?.readyForFunctionalQA === true;

  const marina = p["marina-seller"];
  const carlos = p["carlos-buyer"];
  const eduardo = p["eduardo-search"];
  const daniela = p["daniela-catalog"];
  const juliana = p["juliana-ux"];
  const renato = p["renato-performance"];

  const rules = {
    Login: scoreFrom(ready && smoke, marina?.status === "pending_manual" ? 0.7 : ready ? 1 : 0.15),
    Inventory: scoreFrom(daniela?.status === "pass", marina?.status === "pending_manual" ? 0.5 : 0.2),
    Listing: scoreFrom(marina?.status === "pending_manual", marina?.status === "blocked" ? 0.1 : 0.35),
    Search: scoreFrom(
      eduardo?.status === "pass",
      eduardo?.unitTests?.feGameConfig && eduardo?.unitTests?.apiProjection ? 0.92 : eduardo?.status === "warn" ? 0.75 : 0.4,
    ),
    Checkout: scoreFrom(carlos?.status === "pending_manual", carlos?.status === "blocked" ? 0.15 : 0.45),
    Reports: scoreFrom(false, 0.4),
    "Sealed Products": scoreFrom(false, 0.15),
    Favorites: scoreFrom(juliana?.status === "partial" || juliana?.status === "pass", 0.9),
  };

  const features = PLATFORM_FEATURES.map((name) => ({
    name,
    percent: Math.round((rules[name] ?? 0) * 100),
    exercised: (rules[name] ?? 0) >= 0.5,
  }));

  const avg = features.reduce((s, f) => s + f.percent, 0) / features.length;

  return {
    name: "FCS",
    note: "Feature Coverage — engenharia, não North Star",
    averagePercent: Math.round(avg),
    features,
  };
}

function scoreFrom(full, partial) {
  if (full) return 1;
  return partial;
}

export function fcsFromPersonaReports(personas, audit, smokeOk) {
  const personaById = Object.fromEntries(personas.map((x) => [x.personaId, x]));
  const fullPersonas = personas.map((x) => {
    const id = x.personaId;
    return personaById[id];
  });
  return computeFeatureCoverage({
    audit,
    smokeOk,
    personas: fullPersonas,
    personaById,
  });
}
