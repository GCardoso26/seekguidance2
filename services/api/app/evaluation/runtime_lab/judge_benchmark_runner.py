"""Smoke de benchmarks orientados a juiz."""

from __future__ import annotations

from typing import Any

from app.reasoning.distributed_runtime_v11_pipeline import run_distributed_runtime_v11


def run_judge_benchmark_smoke(*, question: str, game_slug: str = "mtg") -> dict[str, Any]:
    v11 = run_distributed_runtime_v11(
        question=question,
        game_slug=game_slug,
        reasoning_confidence=0.8,
        v7_replay_hash="0" * 64,
        validated_roles=["stack", "priority"],
    )
    return {"ok": True, "keys": list(v11.to_api_dict().keys())}
