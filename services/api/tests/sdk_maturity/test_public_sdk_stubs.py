"""Public SDK maturity stubs."""
from __future__ import annotations

from app.runtime.public_runtime_api.public_runtime_sdk_v1 import public_runtime_sdk_v1_stub
from app.runtime.public_runtime_api.public_runtime_upgrade_assistant_v1 import (
    public_runtime_upgrade_assistant_v1_stub,
)


def test_sdk_v1() -> None:
    assert public_runtime_sdk_v1_stub("z")["sdk_score"] > 0


def test_upgrade_assistant() -> None:
    assert public_runtime_upgrade_assistant_v1_stub("z")["sdk_score"] > 0
