"""Rulings duplicados (hash de texto)."""

from __future__ import annotations

import hashlib


def duplicate_ruling_detection(texts: list[str]) -> dict[str, object]:
    hashes = [hashlib.sha256(t.encode()).hexdigest()[:12] for t in texts]
    return {"duplicates": len(hashes) != len(set(hashes)), "n": len(texts)}
