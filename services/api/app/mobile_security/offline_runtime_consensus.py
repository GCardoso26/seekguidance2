"""Consenso offline de runtime (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_runtime_consensus_stub(votes: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"votes": votes, "quorum": votes >= 2},
        sync_hints=["Consenso apenas sobre metadados não decisivos."],
        deterministic_alignment={"token": "orc-v3"},
        mobile_constraints={"max_voters": 6},
        offline_confidence=0.5,
        assistant_notes=["Rulings sensíveis excluídos de votação automática."],
        lineage_replay_slice="orc-v3",
    )
