"""Integridade de snapshot local (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def snapshot_integrity_stub(digest: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"digest": digest, "crc": "ok"},
        sync_hints=["Recomputar digest antes de aplicar patch."],
        deterministic_alignment={"integrity": f"int-{digest}"},
        mobile_constraints={"verify_on_read": True},
        offline_confidence=0.77,
        assistant_notes=["Corrupção local: recuperação via checkpoint + re-download opcional."],
        lineage_replay_slice="snap-int-v0",
        extras={"corruption_risk": "low"},
    )
