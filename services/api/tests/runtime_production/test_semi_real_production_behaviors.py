"""Comportamentos semi-reais production pilot."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_controller_v1 import (
    runtime_operational_cicd_controller_v1_stub,
)
from app.mobile_runtime.mobile_runtime_operational_sync_v1 import sync_enqueue
from app.observability.runtime_exporters.runtime_prometheus_live_bridge_v1 import (
    runtime_prometheus_live_bridge_v1_stub,
)
from app.runtime.deployment_readiness.runtime_deployment_validation_v1 import validate_deployment
from app.runtime.persistent_replay_runtime.sqlite_runtime_temporal_store_v1 import (
    write_temporal_record,
)
from app.runtime.pilot_runtime.pilot_runtime_operational_controller_v2 import (
    pilot_pressure_snapshot,
    pilot_runtime_operational_controller_v2_stub,
)
from app.runtime.platform_completion.runtime_platform_completion_runtime_v1 import (
    runtime_platform_completion_runtime_v1_stub,
)
from app.runtime.production_runtime.runtime_operational_scheduler_v4 import schedule
from app.runtime.replay_certification.replay_determinism_certification_v1 import certify_replay
from app.runtime.replay_federation.federation_runtime_node_heartbeat_v1 import (
    federation_topology_summary,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
    "lineage_summary",
)


def test_sqlite_temporal_write() -> None:
    meta = write_temporal_record("pp-scope", {"v": 1})
    assert meta["records"] >= 1


def test_federation_heartbeat_topology() -> None:
    summary = federation_topology_summary("pp-cluster")
    assert summary["avg_health"] > 0


def test_mobile_sync_enqueue() -> None:
    meta = sync_enqueue("device-pp")
    assert meta["mobile_score"] > 0


def test_replay_certification() -> None:
    report = certify_replay("pp-replay-cert")
    assert report["certification_score"] > 0


def test_deployment_validation() -> None:
    report = validate_deployment("pp-deploy")
    assert report["deployment_score"] > 0


def test_production_cicd_artifacts() -> None:
    p = runtime_operational_cicd_controller_v1_stub("pp-prod")
    for k in _KEYS:
        assert k in p
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production"
    assert (root / "runtime.release.governance.json").is_file()


def test_platform_completion() -> None:
    p = runtime_platform_completion_runtime_v1_stub("pp-platform")
    for k in _KEYS:
        assert k in p
    assert p["completion_score"] > 0


def test_pilot_pressure_snapshot() -> None:
    snap = pilot_pressure_snapshot("pp-pilot")
    assert snap["readiness_score"] > 0


def test_pilot_controller_stub_payload() -> None:
    p = pilot_runtime_operational_controller_v2_stub("pp-ctrl")
    assert p["rollout_score"] > 0


def test_operational_scheduler() -> None:
    meta = schedule("pp-job")
    assert meta["scheduled"] is True


def test_prometheus_bridge_stub() -> None:
    p = runtime_prometheus_live_bridge_v1_stub("pp-prom")
    assert p["runtime_confidence"] > 0


def test_infra_federation_operational_exists() -> None:
    root = Path(__file__).resolve().parents[4] / "infra" / "runtime_federation_operational"
    assert (root / "topology" / "default-topology.json").is_file()


def test_infra_deployment_v3_exists() -> None:
    root = Path(__file__).resolve().parents[4] / "infra" / "deployment_runtime_v3"
    assert (root / "production" / "prod-manifest.json").is_file()
