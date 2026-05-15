"""Governança executável mínima de replay (compõe checks existentes, leve)."""

from __future__ import annotations

from typing import Any

from app.contracts.replay_governance_contracts import ReplayGovernanceScores
from app.runtime.replay_governance_v2.deterministic_replay_hashing import deterministic_replay_hashing_stub
from app.runtime.replay_governance_v2.replay_lineage_alignment import replay_lineage_alignment_stub
from app.runtime.replay_governance_v2.replay_snapshot_integrity import replay_snapshot_integrity_stub


def executable_replay_governance_run(replay_ref: str, *, snap_ok: bool = True) -> dict[str, Any]:
    """Executa checks de governança sem motor jurídico pesado."""
    h = deterministic_replay_hashing_stub(replay_ref)
    lin = replay_lineage_alignment_stub(replay_ref)
    snap = replay_snapshot_integrity_stub(f"snap-{replay_ref}", snap_ok)
    drift_summary = {
        "hash_layer": h.get("replay_summary", {}).get("layer"),
        "lineage_layer": lin.get("replay_summary", {}).get("layer"),
    }
    contradiction_summary = {
        "open": 0,
        "integrity": snap.get("replay_integrity_diagnostics", {}),
    }
    scores = ReplayGovernanceScores(
        replayability_score=float(h.get("replay_confidence", 0.7)),
        lineage_consistency_score=float(lin.get("replay_confidence", 0.7)),
        snapshot_integrity_ok=bool(snap.get("replay_integrity_diagnostics", {}).get("ok", snap_ok)),
        drift_summary=drift_summary,
        contradiction_summary=contradiction_summary,
        deterministic_alignment_score=min(
            float(h.get("replay_confidence", 0.7)),
            float(lin.get("replay_confidence", 0.7)),
        ),
        assistant_notes=[
            "executable_replay_governance: agrega hashing, lineage e integridade.",
            "Sem equivalência forte cross-TCG; explainability-first.",
        ],
    )
    return {
        "replay_ref": replay_ref,
        "scores": scores.model_dump(),
        "raw_checks": {
            "deterministic_replay_hashing": h,
            "replay_lineage_alignment": lin,
            "replay_snapshot_integrity": snap,
        },
    }


def executable_replay_governance_stub(replay_ref: str) -> dict[str, Any]:
    return executable_replay_governance_run(replay_ref)
