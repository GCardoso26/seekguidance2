"""Emparelhamento de pipelines para análise diferencial."""

from __future__ import annotations

from typing import Any


def build_pair_payload(question: str, roles: list[str], replay_hash: str) -> dict[str, Any]:
    base = {"question": question, "roles": list(roles), "replay_hash": replay_hash}
    return {
        "pipeline_a": dict(base, pipeline="symbolic_runtime"),
        "pipeline_b": dict(base, pipeline="deterministic_chain"),
    }
