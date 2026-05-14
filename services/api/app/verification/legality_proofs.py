"""Proof hooks para legalidade formal."""

from __future__ import annotations

from typing import Any


def build_legality_proofs(*, legal: bool, deterministic: bool) -> list[dict[str, Any]]:
    return [
        {"obligation": "legality_preserved", "status": "proved" if legal else "failed"},
        {"obligation": "deterministic_legality", "status": "proved" if deterministic else "failed"},
    ]
