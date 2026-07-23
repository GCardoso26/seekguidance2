/**
 * Explainable matching — confidence breakdown with missing/conflicting/rejected signals.
 * Evolves ImageMatchScorer without changing public event contracts.
 */

import {
  IMAGE_MATCH_AUTO_LINK_THRESHOLD,
  scoreImageMatch,
  type ImageMatchCandidate,
  type ImageMatchTarget,
} from "./ImageMatchScorer.js";

export interface MatchSignalContribution {
  signal: string;
  points: number;
  label: string;
}

export interface ExplainableMatchResult {
  confidence: number;
  confidencePct: number;
  explanation: MatchSignalContribution[];
  missingSignals: string[];
  conflictingSignals: string[];
  rejectedSignals: string[];
  finalScore: number;
  threshold: number;
  decision: "auto_link" | "skip" | "reject_name_only";
  factors: Record<string, number>;
}

const SIGNAL_LABELS: Record<string, string> = {
  sku: "SKU",
  eanUpc: "UPC/EAN",
  manufacturer: "Manufacturer",
  brand: "Brand",
  accessoryType: "Product Type",
  aliases: "Aliases",
  productName: "Name",
  game: "Game",
  expansion: "Expansion",
  productType: "Product Type",
  publisher: "Publisher",
  release: "Coleção/Release",
};

const EXPECTED_ACCESSORY = ["sku", "eanUpc", "manufacturer", "brand", "accessoryType", "aliases", "productName"];
const EXPECTED_SEALED = [
  "sku",
  "eanUpc",
  "game",
  "expansion",
  "productType",
  "publisher",
  "aliases",
  "productName",
  "release",
];

function pointsFromFactor(value: number): number {
  return Math.round(value * 100);
}

export function explainImageMatch(
  candidate: ImageMatchCandidate,
  target: ImageMatchTarget,
): ExplainableMatchResult {
  const base = scoreImageMatch(candidate, target);
  const explanation: MatchSignalContribution[] = Object.entries(base.factors).map(([signal, value]) => ({
    signal,
    points: pointsFromFactor(value),
    label: SIGNAL_LABELS[signal] ?? signal,
  }));
  explanation.sort((a, b) => b.points - a.points);

  const expected = candidate.domain === "accessory" ? EXPECTED_ACCESSORY : EXPECTED_SEALED;
  const missingSignals = expected.filter((s) => !(s in base.factors) || (base.factors[s] ?? 0) <= 0);

  const conflictingSignals: string[] = [];
  if (candidate.domain === "accessory") {
    if (candidate.brand && target.brand && norm(candidate.brand) !== norm(target.brand) && base.factors.productName) {
      conflictingSignals.push("brand_vs_name");
    }
    if (
      candidate.manufacturer &&
      target.manufacturer &&
      norm(candidate.manufacturer) !== norm(target.manufacturer)
    ) {
      conflictingSignals.push("manufacturer_mismatch");
    }
  } else {
    if (candidate.game && target.game && norm(candidate.game) !== norm(target.game)) {
      conflictingSignals.push("game_mismatch");
    }
    if (candidate.expansion && target.expansion && norm(candidate.expansion) !== norm(target.expansion)) {
      conflictingSignals.push("expansion_mismatch");
    }
  }

  const rejectedSignals: string[] = [];
  if (base.exclusiveNameOnly) rejectedSignals.push("name_only_match");
  if (conflictingSignals.includes("game_mismatch")) rejectedSignals.push("cross_game");

  let decision: ExplainableMatchResult["decision"] = "skip";
  if (base.exclusiveNameOnly) decision = "reject_name_only";
  else if (base.shouldAutoLink) decision = "auto_link";

  return {
    confidence: base.score,
    confidencePct: Math.round(base.score * 100),
    explanation,
    missingSignals,
    conflictingSignals,
    rejectedSignals,
    finalScore: base.score,
    threshold: IMAGE_MATCH_AUTO_LINK_THRESHOLD,
    decision,
    factors: base.factors,
  };
}

function norm(v?: string | null): string {
  return (v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
