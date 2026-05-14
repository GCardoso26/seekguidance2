"""Confiança na fonte (publisher-aware, heurístico)."""

from __future__ import annotations

_OFFICIAL_PUBLISHERS = {
    "wizards",
    "magic",
    "konami",
    "pokemon",
    "bandai",
    "upper_deck",
    "riot",
    "disney",
    "fab",
}


def source_trust_index(publisher: str) -> float:
    p = publisher.strip().lower()
    if any(x in p for x in _OFFICIAL_PUBLISHERS):
        return 1.0
    if p in {"unknown", ""}:
        return 0.35
    return 0.55
