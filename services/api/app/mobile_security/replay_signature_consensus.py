"""Consenso de assinaturas de replay (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_signature_consensus_stub(peers: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"peers": peers, "agree": peers >= 2},
        sync_hints=["Overlap de chaves durante rotação."],
        deterministic_alignment={"token": "rsc-v3"},
        mobile_constraints={"max_peers": 8},
        offline_confidence=0.62,
        assistant_notes=["Consenso criptográfico explicável ao juiz operador."],
        lineage_replay_slice="rsc-v3",
    )
