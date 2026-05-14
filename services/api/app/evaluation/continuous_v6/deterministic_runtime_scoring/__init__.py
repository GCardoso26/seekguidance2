"""Pontuação de determinismo de runtime."""

from __future__ import annotations

from typing import Any


def deterministic_runtime_scoring_stub(hash_matches: int, runs: int) -> dict[str, Any]:
    return {"score": hash_matches / runs if runs else 1.0}
