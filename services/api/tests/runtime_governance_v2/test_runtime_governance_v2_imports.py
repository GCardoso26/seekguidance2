"""runtime_governance_v2."""

from __future__ import annotations

from app.runtime.runtime_governance_v2 import distributed_runtime_governance_stub


def test_distributed_runtime_governance() -> None:
    g = distributed_runtime_governance_stub("x")
    assert "governance_summary" in g
