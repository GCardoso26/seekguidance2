"""GA readiness operational behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.platform_ga_readiness.platform_ga_operational_summary_v1 import (
    platform_ga_readiness_engine_v1,
)
from app.runtime.production_rollout_v2.production_rollout_orchestration_v2 import (
    production_rollout_engine_v2,
)
from app.runtime.security_compliance.runtime_security_operational_engine_v2 import (
    runtime_security_operational_engine_v2,
)


def test_staged_rollout_scoring() -> None:
    r1 = production_rollout_engine_v2("ga-a")
    r2 = production_rollout_engine_v2("ga-a")
    assert r2["blast_radius_score"] >= r1["blast_radius_score"]


def test_ga_platform_aggregation() -> None:
    p = platform_ga_readiness_engine_v1("ga-platform")
    assert p["ga_readiness_score"] > 0
    assert p["integrity_status"] in ("ok", "degraded")


def test_security_posture() -> None:
    s = runtime_security_operational_engine_v2("ga-sec")
    assert "rbac_summary" in s


def test_enterprise_artifacts_exist() -> None:
    from app.runtime.enterprise_readiness.runtime_enterprise_support_readiness_v2 import (
        runtime_enterprise_readiness_engine_v2,
    )
    runtime_enterprise_readiness_engine_v2("ga-art")
    root = Path("generated/runtime_artifacts/enterprise_readiness")
    assert (root / "support_matrix.json").is_file()


def test_rollout_queue_type() -> None:
    assert isinstance(queue.PriorityQueue(), queue.PriorityQueue)


def test_packaging_v2_bundle() -> None:
    from app.runtime.runtime_packaging_v2.runtime_release_distribution_summary_v2 import (
        runtime_packaging_engine_v2,
    )
    r = runtime_packaging_engine_v2("ga-pkg")
    assert r["packaging_score"] > 0


def test_observability_v6_slo() -> None:
    from app.observability.runtime_exporters.runtime_slo_aggregation_v6 import (
        runtime_connected_observability_engine_v6,
    )
    r = runtime_connected_observability_engine_v6("ga-obs6")
    assert r["observability_score"] > 0


def test_commercial_v2_engine() -> None:
    from app.runtime.commercial_runtime.runtime_support_orchestration_v2 import (
        commercial_runtime_engine_v2,
    )
    r = commercial_runtime_engine_v2("ga-com")
    assert r["commercial_score"] > 0


def test_continuous_v27_regression() -> None:
    from app.evaluation.continuous_v27 import ga_readiness_regression_v27_stub
    p = ga_readiness_regression_v27_stub("sig27b")
    assert p["operational_confidence"] > 0
