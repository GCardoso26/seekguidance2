"""replay_execution_runtime_v3 — execução determinística parcial."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import (
    execute_deterministic_replay_runtime,
)


def replay_execution_runtime_v3_stub(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    executed = execute_deterministic_replay_runtime(
        replay_ref,
        payload,
        storage_path=storage_path,
    )
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": executed.get("assistant_notes", ["replay_execution_runtime_v3."]),
        "deterministic_alignment": executed.get("deterministic_alignment", {}),
        "runtime_confidence": 0.86,
        "replay_summary": executed,
        "lineage_summary": {"replay_ref": replay_ref},
        "divergence_summary": {},
        "operational_notes": [],
        "replay_execution_summary": executed,
        "deterministic_replay_hints": [executed.get("replay_execution_token", "")],
        "temporal_ordering": {"bounded": True},
    }
