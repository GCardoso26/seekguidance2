"""Confiança operacional do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_trust_stub(score: float) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"trust_score": score, "components": ["device", "replay", "cache"]},
        sync_hints=["Reforçar verificação quando score < limiar."],
        deterministic_alignment={"trust_anchor": "mrt-v0"},
        mobile_constraints={"min_trust_for_auto_merge": 0.85},
        offline_confidence=score,
        assistant_notes=["Trust score explicável por componente; sem caixa preta."],
        lineage_replay_slice="trust-v0",
    )
