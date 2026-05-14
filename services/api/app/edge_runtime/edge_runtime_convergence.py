"""Convergência do runtime edge (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_convergence_stub(iters: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"iters": iters, "converged": iters >= 3},
        sync_hints=["Se não convergir, degradar exploração de ramos."],
        deterministic_alignment={"token": "ercv"},
        mobile_constraints={"max_iters": 8},
        offline_confidence=0.58,
        assistant_notes=["Convergência local; solver pesado opcional na cloud."],
        lineage_replay_slice="ercv",
    )
