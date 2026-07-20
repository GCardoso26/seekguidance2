/** Normaliza título para deduplicação (lowercase, sem pontuação extra). */
export function normalizeProductTitle(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Preferência PT-BR: se o provider enviar titlePt, usa; senão titleEn vira titlePt
 * até tradução dedicada existir.
 */
export function resolveTitlePt(titlePt?: string, titleEn?: string): string {
  const pt = titlePt?.trim();
  if (pt) return pt;
  const en = titleEn?.trim();
  if (en) return en;
  return "Produto sem título";
}
