import type { JudgeSource } from "@/types/judge";

const TITLE_PT: [RegExp, string][] = [
  [/comprehensive rules/i, "Regras Abrangentes (Comprehensive Rules)"],
  [/magic: the gathering/i, "Magic: The Gathering"],
  [/tournament rules/i, "Regras de Torneio"],
  [/infraction procedure/i, "Procedimentos de Infração"],
  [/game rules/i, "Regras do Jogo"],
  [/rulebook/i, "Livro de Regras"],
  [/official rulebook/i, "Livro de Regras Oficial"],
  [/flesh and blood/i, "Flesh and Blood"],
  [/digimon card game/i, "Digimon Card Game"],
  [/gundam card game/i, "Gundam Card Game"],
  [/fusion world/i, "Dragon Ball Super Fusion World"],
  [/sorcery: contested realm/i, "Sorcery: Contested Realm"],
  [/cardfight!! vanguard/i, "Cardfight!! Vanguard"],
  [/riftbound/i, "Riftbound"],
  [/union arena/i, "Union Arena"],
];

/** Rótulos e metadados das fontes sempre em português; trecho mantém texto original indexado. */
export function formatJudgeSource(source: JudgeSource, index: number) {
  let title = source.title?.trim() || "Documento oficial";
  if (title === "Source") title = "Fonte oficial";

  for (const [pattern, label] of TITLE_PT) {
    if (pattern.test(title)) {
      title = title.replace(pattern, label);
      break;
    }
  }

  const section = source.section?.trim()
    ? `Secção ${source.section}`
    : null;

  const excerpt = source.excerpt?.trim()
    ? source.excerpt
    : null;

  const rulePath = source.rule_path?.trim() || source.rule_atom?.trim() || null;
  const ruleAtom = source.rule_atom?.trim() || rulePath;
  const pageNumber = source.page_number ?? null;
  let url = source.url?.trim() || null;
  if (url && pageNumber != null && !url.includes("#page=")) {
    url = `${url}#page=${pageNumber}`;
  }

  const titleLower = title.toLowerCase();
  let sourceType: JudgeSource["source_type"] = source.source_type || "official";
  if (!source.source_type) {
    if (/faq|perguntas frequentes/i.test(titleLower)) sourceType = "faq";
    else if (/errata|corrigendum|atualiza/i.test(titleLower)) sourceType = "errata";
    else if (/local|upload|documento local/i.test(titleLower)) sourceType = "local_document";
  }

  return {
    index: index + 1,
    title,
    section,
    excerpt,
    url,
    hasLink: Boolean(url),
    rulePath,
    ruleAtom,
    pageNumber,
    sourceType,
    tooltipTitle: title,
    tooltipSection: section || (rulePath ? `Regra ${rulePath}` : null),
  };
}

export function sourceTypeBadge(
  sourceType: NonNullable<JudgeSource["source_type"]>,
): {
  label: string;
  className: string;
} {
  switch (sourceType) {
    case "faq":
      return { label: "FAQ Oficial", className: "bg-blue-100 text-blue-800 border-blue-200" };
    case "errata":
      return { label: "Errata", className: "bg-amber-100 text-amber-800 border-amber-200" };
    case "local_document":
      return { label: "Documento Local", className: "bg-gray-100 text-gray-700 border-gray-200" };
    default:
      return { label: "Regra Oficial", className: "bg-green-100 text-green-800 border-green-200" };
  }
}

/** Remove aviso duplicado (backend ou versão antiga em inglês). */
export function stripEnglishJudgeDisclaimer(answer: string): string {
  const markers = [
    "\n\nEsta situação pode exigir interpretação de um juiz de torneio",
    "\n\nThis interaction may require official judge interpretation",
  ];
  let out = answer;
  for (const marker of markers) {
    const idx = out.indexOf(marker);
    if (idx !== -1) out = out.slice(0, idx).trim();
  }
  return out;
}

export { lowConfidenceNoticePt, confidenceLabel } from "@/lib/judge-confidence";
