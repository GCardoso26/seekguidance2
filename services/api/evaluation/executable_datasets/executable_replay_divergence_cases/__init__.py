"""Divergência de replay — casos executáveis."""

from __future__ import annotations

from typing import Any


def executable_replay_divergence_case_stub(h1: str, h2: str) -> dict[str, Any]:
    return {"divergent": h1 != h2, "deterministic_expectations": {"must_match_hash": h1}}
