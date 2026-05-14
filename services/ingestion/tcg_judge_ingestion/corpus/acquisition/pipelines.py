"""Pipelines declarativos de aquisição (incremental sobre `crawler`)."""

from __future__ import annotations

from typing import Any


def acquisition_pipeline_stub(*, game_slug: str) -> dict[str, Any]:
    return {"game_slug": game_slug, "stages": ["discover", "fetch", "normalize", "trust_score", "index"]}
