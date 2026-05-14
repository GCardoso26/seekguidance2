"""Runtime de legalidade distribuído (stubs OTEL-friendly)."""

from __future__ import annotations

from typing import Any


def distributed_legality_runtime_payload(shard_id: str, cases: int) -> dict[str, Any]:
    return {
        "shard_id": shard_id,
        "cases": cases,
        "legality_reasoning": ["Agregação de shards com contratos reasoning_v* preservados."],
        "proof_steps": [{"step": 1, "action": "merge_shard_results"}],
        "assistant_notes": ["Distributed runtime semantics: correlacionar traces."],
        "solver_confidence": 0.71,
    }
