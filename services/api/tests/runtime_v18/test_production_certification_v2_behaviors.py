"""Production certification v2 behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.production_certification.runtime_production_certification_summary_v2 import (
    production_certification_engine_v2,
)


def test_production_certification_v2_engine() -> None:
    r = production_certification_engine_v2("ep18-cert")
    assert r["certification_score"] > 0


def test_certification_v2_artifact_bundle() -> None:
    production_certification_engine_v2("ep18-cert-art")
    root = Path("generated/runtime_artifacts/production_certification_v2")
    for name in (
        "certification.summary.json",
        "certification.drift.json",
        "certification.failover.json",
        "certification.rollback.json",
    ):
        assert (root / name).is_file()


def test_observability_v8_engine() -> None:
    from app.runtime.runtime_connected_observability.runtime_observability_summary_v8 import (
        runtime_connected_observability_engine_v8,
    )
    r = runtime_connected_observability_engine_v8("ep18-obs")
    assert r["observability_score"] > 0


def test_governance_real_v2_engine() -> None:
    from app.runtime.runtime_governance.runtime_governance_operational_summary_v2 import (
        runtime_operational_governance_engine_v2,
    )
    r = runtime_operational_governance_engine_v2("ep18-gov")
    assert r["governance_score"] > 0
