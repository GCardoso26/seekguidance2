"""Deteção de duplicados semânticos (hash de texto normalizado)."""

from __future__ import annotations

import hashlib

from tcg_judge_ingestion.normalizer.text_normalize import normalize_for_index


def semantic_duplicate_key(text: str) -> str:
    n = normalize_for_index(text)
    return hashlib.sha256(n.encode("utf-8")).hexdigest()
