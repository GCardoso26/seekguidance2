"""Payload offline-first com limitações explícitas e alinhamento de replay."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_judge_payload(
    *,
    replay_summary: Mapping[str, Any],
    sync_hints: list[str],
    deterministic_alignment: Mapping[str, Any],
    mobile_constraints: Mapping[str, Any],
    offline_confidence: float,
    assistant_notes: list[str],
    lineage_replay_slice: str,
    offline_limitations: list[str],
    sync_conflicts: list[dict[str, Any]],
    replay_alignment: Mapping[str, Any],
    extras: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    core = judge_mobile_core_payload(
        replay_summary=replay_summary,
        sync_hints=sync_hints,
        deterministic_alignment=deterministic_alignment,
        mobile_constraints=mobile_constraints,
        offline_confidence=offline_confidence,
        assistant_notes=assistant_notes,
        lineage_replay_slice=lineage_replay_slice,
        extras=extras,
    )
    core["offline_limitations"] = list(offline_limitations)
    core["sync_conflicts"] = list(sync_conflicts)
    core["replay_alignment"] = dict(replay_alignment)
    return core
