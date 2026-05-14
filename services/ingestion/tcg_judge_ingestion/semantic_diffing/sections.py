"""Diff semântico por secção (usa ratio por bloco)."""

from __future__ import annotations

from tcg_judge_ingestion.versioning.semantic_diff import semantic_similarity_ratio


def section_changed(before: str, after: str, threshold: float = 0.92) -> bool:
    return semantic_similarity_ratio(before, after) < threshold
