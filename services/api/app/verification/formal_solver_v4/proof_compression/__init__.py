"""Compressão de provas para humanos."""

from __future__ import annotations

from typing import Any


def compress_legality_proof(steps: list[str], *, max_steps: int = 8) -> dict[str, Any]:
    kept = steps[:max_steps]
    return {
        "human_readable_proof": kept,
        "compressed_replay_proof": kept,
        "contradiction_summary": None,
        "legality_certificate": "stub_certificate",
    }
