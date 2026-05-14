"""Deteção heurística de conflitos / ambiguidade entre trechos recuperados."""

from __future__ import annotations

import re

from app.reasoning.types import ConflictItem, ConflictSeverity
from app.retrieval.types import ChunkHit


def _paths(hits: list[ChunkHit]) -> list[str]:
    return [h.rule_path or "" for h in hits if h.rule_path]


def detect_conflicts(question: str, hits: list[ChunkHit], game_slug: str = "mtg") -> list[ConflictItem]:
    q = (question or "").lower()
    paths = _paths(hits)
    out: list[ConflictItem] = []

    if "replacement" in q and ("sba" in q or "state-based" in q):
        has_614 = any(p.startswith("614") for p in paths)
        has_704 = any(p.startswith("704") for p in paths)
        if has_614 and has_704:
            out.append(
                ConflictItem(
                    type="replacement_precedence",
                    rules=["614.x", "704.x"],
                    severity="high",
                    resolution_strategy="dependency_ordering",
                    notes="Replacement modifies events before SBAs are checked in cleanup-style sequencing.",
                )
            )

    if "layer" in q and "depend" in q:
        has_613 = any(p.startswith("613") for p in paths)
        if has_613:
            out.append(
                ConflictItem(
                    type="layer_dependency",
                    rules=["613.x"],
                    severity="medium",
                    resolution_strategy="613_dependency_system",
                    notes="Continuous effects may depend on relative timestamps or layer order.",
                )
            )

    if "apnap" in q or "active player" in q:
        if "603" in "".join(paths):
            out.append(
                ConflictItem(
                    type="apnap_trigger_order",
                    rules=["603.x", "117.x"],
                    severity="medium",
                    resolution_strategy="apnap_insertion_order",
                    notes="Multiple triggers use APNAP when simultaneous.",
                )
            )

    if re.search(r"\bsegoc\b", q) or (game_slug == "yugioh" and "chain" in q and "order" in q):
        sev: ConflictSeverity = "high" if game_slug == "yugioh" else "medium"
        out.append(
            ConflictItem(
                type="mandatory_optional_timing",
                rules=["SEGOC"],
                severity=sev,
                resolution_strategy="chain_building_order",
                notes="SEGOC is primarily Yu-Gi-Oh!; other TCGs use different simultaneous structures.",
            )
        )

    if game_slug in ("mtg", "pokemon", "yugioh") and "mandatory" in q and "simultaneous" in q:
        out.append(
            ConflictItem(
                type="simultaneous_mandatory_triggers",
                rules=["603.x", "SEGOC", "BCR"],
                severity="high",
                resolution_strategy="apnap_or_segoc_or_owner_choice",
                notes="Ordering depends on TCG: APNAP (MTG), SEGOC (YGO), or rules text (Pokémon).",
            )
        )

    return out
