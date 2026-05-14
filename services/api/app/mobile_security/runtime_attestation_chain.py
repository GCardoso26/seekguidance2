"""Cadeia de attestation do runtime (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def runtime_attestation_chain_stub(depth: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"depth": depth, "chain": "stub"},
        sync_hints=["Validar cada elo antes de ruling exportado."],
        deterministic_alignment={"token": "rac-v3"},
        mobile_constraints={"max_depth": 6},
        offline_confidence=0.7,
        assistant_notes=["Cadeia explicável; segredos nunca em logs."],
        lineage_replay_slice="rac-v3",
    )
