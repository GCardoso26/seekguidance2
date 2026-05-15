"""Runtime lifecycle governance stubs."""
from __future__ import annotations

from app.runtime.runtime_lifecycle_governance.runtime_api_freeze_v1 import (
    runtime_api_freeze_v1_stub,
)
from app.runtime.runtime_lifecycle_governance.runtime_lifecycle_policy_v1 import (
    runtime_lifecycle_policy_v1_stub,
)


def test_lifecycle_policy() -> None:
    assert runtime_lifecycle_policy_v1_stub("x")["lifecycle_score"] > 0


def test_api_freeze() -> None:
    assert runtime_api_freeze_v1_stub("x")["lifecycle_score"] > 0
