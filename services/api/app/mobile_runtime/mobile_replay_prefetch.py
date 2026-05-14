"""Prefetch de chunks de replay (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_replay_prefetch_stub(next_chunk: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"next_chunk": next_chunk, "prefetch": True},
        sync_hints=["Prefetch cancelável em baixa bateria."],
        deterministic_alignment={"token": f"mrp-{next_chunk}"},
        mobile_constraints={"max_prefetch": 2},
        offline_confidence=0.63,
        assistant_notes=["Prefetch replay-safe: só após integridade do chunk atual."],
        lineage_replay_slice="mrpf",
    )
