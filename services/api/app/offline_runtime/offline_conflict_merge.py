"""Merge determinístico de conflitos offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_conflict_merge_stub(keys: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"keys": keys, "merged": keys},
        sync_hints=["Preferir metadados não decisivos para auto-merge."],
        deterministic_alignment={"merge_id": "ocm-v0"},
        mobile_constraints={"max_keys_per_batch": 64},
        offline_confidence=0.5,
        assistant_notes=["Rulings: sempre confirmação humana após merge assistido."],
        lineage_replay_slice="conflict-merge-v0",
        offline_limitations=["Sem visão global de torneio"],
        sync_conflicts=[{"key": "ruling:42", "severity": "needs_judge"}],
        replay_alignment={"strategy": "deterministic_lexicographic_non_ruling"},
    )
