"""Comportamentos semi-reais operational platform v2."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_engine_v2 import (
    runtime_operational_cicd_engine_v2_stub,
)
from app.mobile_runtime.mobile_runtime_operational_beta_v2 import mobile_operational_score
from app.runtime.deployment_readiness_v2.runtime_deployment_readiness_engine_v2 import (
    deployment_readiness_v2,
)
from app.runtime.platform_completion.runtime_platform_completion_v2 import (
    runtime_platform_completion_v2_stub,
)
from app.runtime.production_runtime_v11.runtime_operational_execution_engine_v1 import (
    dispatch_operational,
    execution_operational_snapshot,
)
from app.runtime.replay_certification.replay_certification_engine_v2 import certify_replay_v2
from app.runtime.replay_federation.federation_operational_router_v2 import route_federation

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
)


def test_execution_dispatch_and_snapshot() -> None:
    out = dispatch_operational("opv2-job")
    assert out["accepted"] is True
    snap = execution_operational_snapshot("opv2-job")
    assert snap["execution_backlog"] >= 0


def test_certification_v2_artifacts() -> None:
    report = certify_replay_v2("opv2-replay")
    assert report["certification_score"] > 0
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "certification"
    assert (root / "runtime.certification.audit.json").is_file()


def test_federation_router() -> None:
    report = route_federation("opv2-cluster")
    assert report["avg_health"] > 0


def test_mobile_beta_score() -> None:
    report = mobile_operational_score("opv2-device")
    assert report["mobile_operational_score"] > 0


def test_deployment_readiness_v2() -> None:
    report = deployment_readiness_v2("opv2-deploy")
    assert report["deployment_readiness_score"] > 0


def test_cicd_engine_v2() -> None:
    p = runtime_operational_cicd_engine_v2_stub("opv2-ci")
    for k in _KEYS:
        assert k in p


def test_platform_completion_v2() -> None:
    p = runtime_platform_completion_v2_stub("opv2-platform")
    for k in _KEYS:
        assert k in p
    assert p["completion_score"] > 0
