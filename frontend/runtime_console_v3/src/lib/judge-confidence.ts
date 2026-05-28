import type { JudgeGameCatalogItem } from "@/types/judge";

export const DEFAULT_CONFIDENCE_NOTICE_THRESHOLD = 0.42;

export function confidenceNoticeThreshold(
  tcgId: string,
  catalog?: JudgeGameCatalogItem[],
  responseThreshold?: number,
): number {
  if (typeof responseThreshold === "number" && responseThreshold > 0) {
    return responseThreshold;
  }
  const fromCatalog = catalog?.find((g) => g.tcg_id === tcgId)?.confidence_notice_threshold;
  if (typeof fromCatalog === "number" && fromCatalog > 0) {
    return fromCatalog;
  }
  return DEFAULT_CONFIDENCE_NOTICE_THRESHOLD;
}

export function lowConfidenceNoticePt(confidence: number, threshold?: number): string | null {
  const thr = threshold ?? DEFAULT_CONFIDENCE_NOTICE_THRESHOLD;
  if (confidence >= thr) return null;
  return (
    "A confiança da recuperação está abaixo do habitual. Confirme com as fontes oficiais ou um juiz de torneio."
  );
}

export function confidenceLabel(confidence: number, threshold?: number): string {
  const thr = threshold ?? DEFAULT_CONFIDENCE_NOTICE_THRESHOLD;
  const high = Math.min(0.95, thr + 0.28);
  const mid = thr + 0.05;
  if (confidence >= high) return "Alta";
  if (confidence >= mid) return "Média";
  return "Baixa";
}
