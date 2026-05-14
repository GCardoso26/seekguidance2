"""Solver distribuído (payload assistente)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def distributed_solver_runtime_payload(shard: str) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=[f"Shard «{shard}» agrega provas sem expor encoding interno."],
        proof_steps=[{"step": 1, "action": "aggregate_shard"}],
        assistant_notes=["Distributed solver runtime; correlacionar traces."],
        replay_legality_summary="Shards concordam no estado resumido do stub.",
        solver_confidence=0.73,
    )
