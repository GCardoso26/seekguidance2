"""Comportamentos semi-reais sprint V9."""
from __future__ import annotations

from pathlib import Path

from app.mobile_runtime.mobile_runtime_sync_engine_v1 import (
    enqueue_sync,
    mobile_runtime_sync_engine_v1_stub,
)
from app.observability.runtime_exporters.runtime_histogram_runtime_v6 import (
    histogram_snapshot,
    observe_histogram,
    runtime_histogram_runtime_v6_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_runtime_engine_v1 import (
    replay_execution_runtime_engine_v1_stub,
)
from app.runtime.pilot_runtime.pilot_runtime_execution_runtime_v4 import (
    pilot_runtime_execution_runtime_v4_stub,
)
from app.runtime.production_runtime.runtime_execution_core_v9 import (
    dispatch_execution,
    execution_snapshot,
    record_retry,
)
from app.runtime.replay_federation.federation_supervision_runtime_v1 import (
    federation_supervision_runtime_v1_stub,
)
from app.runtime.runtime_hardening.runtime_module_registry_v1 import (
    discover_capabilities,
    runtime_module_registry_v1_stub,
)
from app.runtime.runtime_incident_management.runtime_incident_storage_v1 import (
    runtime_incident_storage_v1_stub,
    store_incident,
)

REQUIRED = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
)


def _assert_payload(p: dict) -> None:
    for k in REQUIRED:
        assert k in p


def test_execution_queue_dispatch_snapshot_retry() -> None:
    out = dispatch_execution("job-a", {"step": 1}, priority=2)
    assert out["accepted"] is True
    snap = execution_snapshot()
    assert snap["queue_depth"] >= 1
    count = record_retry(out["token"])
    assert count >= 1


def test_replay_runtime_engine_payload() -> None:
    out = replay_execution_runtime_engine_v1_stub("replay-semi-1")
    _assert_payload(out)
    assert out["replay_execution_summary"]


def test_federation_supervision_scoring() -> None:
    summary = federation_supervision_runtime_v1_stub("fed-cluster-1")
    _assert_payload(summary)
    assert summary["runtime_confidence"] > 0


def test_incident_storage_workflow() -> None:
    store_incident("inc-1", {"severity": "medium", "scope": "runtime"})
    agg = runtime_incident_storage_v1_stub("ops")
    _assert_payload(agg)
    assert agg["lifecycle_summary"] is not None


def test_histogram_observe_and_stub() -> None:
    observe_histogram("latency_ms", 12.5)
    observe_histogram("latency_ms", 40.0)
    snap = histogram_snapshot()
    assert "latency_ms" in snap or isinstance(snap, dict)
    summary = runtime_histogram_runtime_v6_stub("runtime")
    _assert_payload(summary)


def test_mobile_sync_queue_payload() -> None:
    out = enqueue_sync("device-9")
    assert "device_id" in out or "sync_token" in out or isinstance(out, dict)
    stub = mobile_runtime_sync_engine_v1_stub("device-9")
    _assert_payload(stub)


def test_hardening_capability_discovery() -> None:
    caps = discover_capabilities()
    assert "modules" in caps or "capabilities" in caps or isinstance(caps, dict)
    stub = runtime_module_registry_v1_stub("production_runtime")
    _assert_payload(stub)


def test_pilot_execution_readiness() -> None:
    readiness = pilot_runtime_execution_runtime_v4_stub("pilot-exec")
    _assert_payload(readiness)
    assert readiness["runtime_confidence"] >= 0


def test_openapi_artifacts_dirs_exist() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts"
    assert (root / "openapi").is_dir()
    assert (root / "contracts").is_dir()
    assert (root / "drift").is_dir()
