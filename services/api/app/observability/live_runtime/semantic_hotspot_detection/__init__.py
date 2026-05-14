"""Hotspots semânticos."""

from __future__ import annotations

from typing import Any


def semantic_hotspot_detection_stub(labels: list[str]) -> dict[str, Any]:
    return {
        "labels": labels,
        "hotspots": sorted(set(labels))[:3],
        "assistant_notes": ["Hotspots guiam investimento em corpus e hardening por TCG."],
    }
