"""Certificação formal de replay (extensão de `replay_validation`)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_proofs.proof_replay import replay_proof_certificate


def certify_payload(payload: dict[str, Any], *, runs: int = 3) -> dict[str, Any]:
    return replay_proof_certificate(payload, runs=runs)
