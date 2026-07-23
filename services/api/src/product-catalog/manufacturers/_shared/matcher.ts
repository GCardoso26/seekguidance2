import {
  scoreImageMatch,
  type AccessoryMatchCandidate,
  type ImageMatchResult,
  type ImageMatchTarget,
} from "../../application/ImageMatchScorer.js";
import { explainImageMatch, type ExplainableMatchResult } from "../../application/ExplainableMatching.js";

/** Per-manufacturer matcher — always uses shared ImageMatchScorer (no name-only). */
export function matchManufacturerAccessory(
  candidate: AccessoryMatchCandidate,
  target: ImageMatchTarget,
): ImageMatchResult {
  return scoreImageMatch({ ...candidate, domain: "accessory" }, target);
}

export function explainManufacturerMatch(
  candidate: AccessoryMatchCandidate,
  target: ImageMatchTarget,
): ExplainableMatchResult {
  return explainImageMatch({ ...candidate, domain: "accessory" }, target);
}
