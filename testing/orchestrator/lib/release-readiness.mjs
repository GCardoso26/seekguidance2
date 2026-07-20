/**
 * Release Readiness — resumo executivo de engenharia (não substitui MRB / North Star).
 */

function dim(status, confidence) {
  return { status, confidence };
}

function personaDim(persona, conf) {
  const s = conf?.status || "WARN";
  return dim(s, conf?.confidence ?? 0);
}

/**
 * @param {{ audit, smokeOk, personas, confidence, featureCoverage, dedupedOpenP0 }} input
 */
export function computeReleaseReadiness(input) {
  const { audit, smokeOk, confidence, featureCoverage, dedupedOpenP0 = 0 } = input;
  const cp = confidence?.personas || {};
  const infra = confidence?.infrastructure || { status: "FAIL", confidence: 0 };

  const catalog = personaDim(input.personaById?.["daniela-catalog"], cp["daniela-catalog"]);
  const search = personaDim(input.personaById?.["eduardo-search"], cp["eduardo-search"]);
  const seller = personaDim(input.personaById?.["marina-seller"], cp["marina-seller"]);
  const buyer = personaDim(input.personaById?.["carlos-buyer"], cp["carlos-buyer"]);
  const performance = personaDim(input.personaById?.["renato-performance"], cp["renato-performance"]);
  const ux = personaDim(input.personaById?.["juliana-ux"], cp["juliana-ux"]);

  const checkoutFeature = featureCoverage?.features?.find((f) => f.name === "Checkout");
  const checkout = dim(
    checkoutFeature?.percent >= 80 ? "PASS" : checkoutFeature?.percent >= 50 ? "WARN" : "FAIL",
    checkoutFeature?.percent ?? 0,
  );

  const providers = dim(catalog.status === "PASS" ? "PASS" : catalog.status, catalog.confidence);

  const dimensions = {
    Infrastructure: infra,
    Catalog: catalog,
    Providers: providers,
    Search: search,
    Seller: seller,
    Buyer: buyer,
    Checkout: checkout,
    Performance: performance,
    UX: ux,
  };

  const failCount = Object.values(dimensions).filter((d) => d.status === "FAIL").length;
  const warnCount = Object.values(dimensions).filter((d) => d.status === "WARN").length;

  let overall = "READY";
  if (!audit?.readyForFunctionalQA || !smokeOk || dedupedOpenP0 > 0 || failCount >= 2) {
    overall = "NOT READY";
  } else if (failCount > 0 || warnCount >= 3) {
    overall = "NOT READY";
  } else if (warnCount > 0) {
    overall = "READY WITH WARNINGS";
  }

  return {
    generatedAt: new Date().toISOString(),
    dimensions,
    overall,
    engineeringNote:
      "Responde se a plataforma está tecnicamente pronta para a próxima etapa de validação — não é Go/No-Go de mercado.",
  };
}

export function formatReleaseReadinessMarkdown(readiness) {
  const lines = [
    "# Release Readiness",
    "",
    `Overall: **${readiness.overall}**`,
    "",
    "| Dimensão | Status | Confidence |",
    "| --- | --- | --- |",
  ];
  for (const [name, d] of Object.entries(readiness.dimensions)) {
    lines.push(`| ${name} | ${d.status} | ${d.confidence}% |`);
  }
  lines.push("", readiness.engineeringNote, "");
  return lines.join("\n");
}
