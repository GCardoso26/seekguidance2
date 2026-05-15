"""Comportamentos semi-reais controlled production v3."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_engine_v3 import (
    runtime_operational_cicd_engine_v3_stub,
)
from app.runtime.federation_control_plane.federation_control_plane_engine_v1 import (
    control_plane_summary,
)
from app.runtime.platform_completion.runtime_platform_completion_v3 import (
    runtime_platform_completion_v3_stub,
)
from app.runtime.production_runtime_v11.runtime_operational_execution_engine_v2 import (
    dispatch_v2,
    operational_summary_v2,
)
from app.runtime.replay_certification.replay_operational_trust_engine_v1 import build_replay_trust
from app.runtime.runtime_reliability.runtime_reliability_engine_v1 import reliability_aggregate

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


def test_dispatch_v2_and_summary() -> None:
    out = dispatch_v2("cpv3-scope", priority=1)
    assert out["accepted"] is True
    summary = operational_summary_v2("cpv3-scope")
    assert summary["operational_runtime_score"] > 0


def test_reliability_aggregate() -> None:
    report = reliability_aggregate("cpv3-rel")
    assert report["reliability_score"] > 0


def test_replay_trust_artifacts() -> None:
    report = build_replay_trust("cpv3-replay-trust")
    assert report["trust_score"] > 0
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "trust"
    assert (root / "runtime.trust.summary.json").is_file()


def test_federation_control_plane() -> None:
    report = control_plane_summary("cpv3-fcp")
    assert report["control_plane_score"] > 0


def test_cicd_v3_artifacts() -> None:
    p = runtime_operational_cicd_engine_v3_stub("cpv3-ci")
    for k in _KEYS:
        assert k in p
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "production_runtime"
    assert (root / "runtime.production.governance.json").is_file()


def test_platform_completion_v3() -> None:
    p = runtime_platform_completion_v3_stub("cpv3-final")
    for k in _KEYS:
        assert k in p
    assert p["completion_score"] > 0
