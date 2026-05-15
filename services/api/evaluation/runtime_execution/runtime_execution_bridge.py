"""Ponte operacional: gates de datasets, continuous v10 e governança executável de replay."""

from __future__ import annotations

from typing import Any


def runtime_execution_bridge_stub(run_id: str, replay_ref: str) -> dict[str, Any]:
    from app.evaluation.continuous_v10 import continuous_v10_dataset_execution_gates_bundle_stub
    from app.runtime.replay_governance_v2.executable_replay_governance import (
        executable_replay_governance_run,
    )

    from runtime_execution.dataset_runtime_gate_bundle import dataset_replay_stability_gate_stub

    gov = executable_replay_governance_run(replay_ref)
    return {
        "run_id": run_id,
        "replay_ref": replay_ref,
        "dataset_gate_sample": {"replay_stability": dataset_replay_stability_gate_stub(run_id)},
        "continuous_v10": continuous_v10_dataset_execution_gates_bundle_stub(run_id),
        "executable_replay_governance": gov,
        "assistant_notes": [
            "runtime_execution_bridge: integração incremental; reasoning_v1…v11 inalterados.",
        ],
    }
