"""GA runtime platform behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.federation_multinode.federation_operational_cluster_summary_v3 import (
    federation_distributed_runtime_engine_v3,
)
from app.runtime.platform_ga_readiness.runtime_ga_platform_summary_v1 import runtime_ga_platform_engine_v1
from app.runtime.runtime_canonical.canonical_runtime_api_v1 import canonical_runtime_api_engine_v1


def test_canonical_api_domains() -> None:
    r = canonical_runtime_api_engine_v1("ga19-canon")
    assert r["canonical_score"] > 0
    assert "execution" in r["domains"]


def test_federation_v3_cluster() -> None:
    r = federation_distributed_runtime_engine_v3("ga19-fed")
    assert r["federation_score"] > 0
    assert "partition_handling" in r


def test_ga_platform_engine() -> None:
    r = runtime_ga_platform_engine_v1("ga19-platform")
    assert r["ga_readiness_score"] > 0


def test_ga_artifacts_bundle() -> None:
    runtime_ga_platform_engine_v1("ga19-art")
    root = Path("generated/runtime_artifacts/ga_readiness")
    assert (root / "ga.federation.json").is_file()


def test_continuous_v30_stub() -> None:
    from app.evaluation.continuous_v30 import ga_readiness_regression_v30_stub
    p = ga_readiness_regression_v30_stub("sig30b")
    assert p["operational_confidence"] > 0
