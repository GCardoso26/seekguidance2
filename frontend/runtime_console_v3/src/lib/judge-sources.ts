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

  return {
    index: index + 1,
    title,
    section,
    excerpt,
    url: source.url?.trim() || null,
    hasLink: Boolean(source.url?.trim()),
  };
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

export function lowConfidenceNoticePt(confidence: number): string | null {
  if (confidence >= 0.55) return null;
  return (
    "A confiança da recuperação está abaixo do habitual. Confirme com as fontes oficiais ou um juiz de torneio."
  );
}
