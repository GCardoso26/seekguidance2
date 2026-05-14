"""Governança do edge runtime (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_governance_stub(policy: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"policy": policy, "explainability": "mandatory"},
        sync_hints=["Registrar decisões de degradação com causa."],
        deterministic_alignment={"policy_hash": f"erg-{policy}"},
        mobile_constraints={"strict_tournament": policy == "tournament"},
        offline_confidence=0.63,
        assistant_notes=["Governança edge alinha-se a replay_governance_v2 sem duplicar política."],
        lineage_replay_slice="erg-v0",
        extras={
            "edge_constraints": {"audit_tail": True},
            "replay_compaction": {"pinned_heads": 1},
            "deterministic_limits": {"no_silent_merge": True},
            "sync_expectations": ["signed_manifest_only_in_strict"],
        },
    )
