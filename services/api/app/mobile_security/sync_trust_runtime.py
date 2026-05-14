"""Confiança de sync (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def sync_trust_runtime_stub(score: float) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"trust_score": score},
        sync_hints=["Se score baixo, exigir segundo factor antes de upload de ruling."],
        deterministic_alignment={"trust_anchor": "str-v2"},
        mobile_constraints={"min_trust_upload": 0.82},
        offline_confidence=score,
        assistant_notes=["Trust explicável por componente (device, replay, relógio)."],
        lineage_replay_slice="str-v2",
    )
