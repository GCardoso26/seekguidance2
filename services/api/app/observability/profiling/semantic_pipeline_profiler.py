"""Profiler do pipeline semântico (convergência aproximada)."""

from __future__ import annotations

from typing import Any


def semantic_pipeline_profile(*, stages_ms: dict[str, float]) -> dict[str, Any]:
    total = sum(stages_ms.values())
    return {"stages_ms": stages_ms, "total_ms": round(total, 3), "stages": len(stages_ms)}
