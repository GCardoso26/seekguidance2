"""Discordância juiz humano vs assistente."""

from __future__ import annotations

from typing import Any


def human_judge_disagreement_v7_stub(rate: float) -> dict[str, Any]:
    return {"rate": rate, "assistant_notes": ["Disagreement alimenta calibração, não penalização automática."]}
