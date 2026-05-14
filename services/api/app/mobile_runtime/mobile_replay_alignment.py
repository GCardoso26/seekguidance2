"""Alinhamento de replay local vs referência (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_replay_alignment_stub(local_hash: str, remote_hint: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"local_hash": local_hash, "remote_hint": remote_hint, "drift": "none"},
        sync_hints=["Se drift != none, abrir fluxo de disputa assistida."],
        deterministic_alignment={"alignment_token": f"aln-{local_hash}"},
        mobile_constraints={"verify_before_merge": True},
        offline_confidence=0.69,
        assistant_notes=["Alinhamento explicável: diff de eventos, não só hash opaco."],
        lineage_replay_slice="replay-align-v0",
    )
