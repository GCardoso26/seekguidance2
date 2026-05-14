"""Detecção de adulteração v2 (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def tamper_runtime_v2_stub(signals: int) -> dict[str, Any]:
    flagged = signals > 1
    return judge_mobile_core_payload(
        replay_summary={"signals": signals, "flagged": flagged},
        sync_hints=["Isolar DB e gerar pacote forense mínimo para juiz head."],
        deterministic_alignment={"tamper_token": "bad" if flagged else "good"},
        mobile_constraints={"isolate": flagged},
        offline_confidence=0.35 if flagged else 0.8,
        assistant_notes=["v2 correlaciona sinais de storage + relógio + journal."],
        lineage_replay_slice="trt-v2",
    )
