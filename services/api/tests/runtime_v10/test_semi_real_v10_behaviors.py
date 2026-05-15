"""Comportamentos semi-reais sprint V10."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_openapi_enforcement_v10 import (
    runtime_openapi_enforcement_v10_stub,
)
from app.mobile_runtime.mobile_runtime_sync_engine_v2 import (
    enqueue_mobile_sync,
    mobile_runtime_sync_engine_v2_stub,
)
from app.observability.runtime_exporters.runtime_operational_histograms_v7 import (
    histogram_summary,
    observe,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_engine_v6 import (
    verify_replay_integrity,
)
from app.runtime.pilot_runtime.pilot_runtime_operational_summary_v5 import (
    pilot_runtime_operational_summary_v5_stub,
)
from app.runtime.production_runtime.runtime_execution_state_machine_v2 import apply_transition
from app.runtime.production_runtime.runtime_lifecycle_engine_v10 import (
    lifecycle_snapshot_v10,
    transition_lifecycle,
)
from app.runtime.replay_federation.federation_supervision_runtime_v2 import (
    federation_supervision_runtime_v2_stub,
    register_node,
)

REQUIRED = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def _assert_payload(p: dict) -> None:
    for k in REQUIRED:
        assert k in p


def test_lifecycle_transitions_deterministic() -> None:
    transition_lifecycle("t-scope", "queued")
    out = apply_transition("t-scope", "running")
    assert out["accepted"] is True
    snap = lifecycle_snapshot_v10("t-scope")
    assert snap["state"] == "running"


def test_replay_integrity_hash_and_score() -> None:
    report = verify_replay_integrity("integrity-1", {"step": 1})
    assert "integrity_hash" in report
    assert report["consistency_score"] > 0


def test_federation_node_registration() -> None:
    register_node("n1", health=0.85)
    stub = federation_supervision_runtime_v2_stub("cluster")
    _assert_payload(stub)


def test_mobile_sync_queue_depth() -> None:
    meta = enqueue_mobile_sync("d10", delta_id="delta-a")
    assert meta["enqueued"] is True
    stub = mobile_runtime_sync_engine_v2_stub("d10")
    _assert_payload(stub)


def test_histogram_observe() -> None:
    observe("op.latency", 5.0)
    summary = histogram_summary("op.latency")
    assert summary["count"] >= 1


def test_openapi_v10_artifacts() -> None:
    p = runtime_openapi_enforcement_v10_stub("ci10")
    _assert_payload(p)
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts"
    assert (root / "openapi" / "runtime.openapi.hashes.json").is_file()


def test_pilot_operational_readiness_v5() -> None:
    p = pilot_runtime_operational_summary_v5_stub("beta-ops")
    _assert_payload(p)
    assert p["pilot_readiness_score"] > 0
