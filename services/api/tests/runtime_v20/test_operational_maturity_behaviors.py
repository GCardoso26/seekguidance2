"""Operational maturity behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.platform_operations_center.operations_center_summary_v1 import (
    operations_center_engine_v1,
)
from app.runtime.runtime_canonical.canonical_runtime_ecosystem_summary_v1 import (
    canonical_ecosystem_engine_v1,
)
from app.runtime.runtime_lifecycle_governance.runtime_lifecycle_summary_v1 import (
    runtime_lifecycle_governance_engine_v1,
)


def test_lifecycle_engine() -> None:
    r = runtime_lifecycle_governance_engine_v1("om20-lc")
    assert r["lifecycle_score"] > 0


def test_ecosystem_engine() -> None:
    r = canonical_ecosystem_engine_v1("om20-eco")
    assert r["ecosystem_score"] > 0


def test_operations_center_engine() -> None:
    r = operations_center_engine_v1("om20-poc")
    assert r["operations_score"] > 0


def test_lifecycle_artifacts() -> None:
    runtime_lifecycle_governance_engine_v1("om20-art")
    root = Path("generated/runtime_artifacts/lifecycle_governance_v1")
    assert (root / "om20-art-policy.json").is_file()


def test_continuous_v31_stub() -> None:
    from app.evaluation.continuous_v31 import operations_center_regression_v31_stub
    p = operations_center_regression_v31_stub("sig31b")
    assert p["operational_confidence"] > 0
