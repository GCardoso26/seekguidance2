"""SDK maturity extra."""
from __future__ import annotations

from app.runtime.public_runtime_api.public_runtime_compatibility_matrix_v2 import (
    public_runtime_compatibility_matrix_v2_stub,
)
from app.runtime.public_runtime_api.public_runtime_migration_runtime_v2 import (
    public_runtime_migration_runtime_v2_stub,
)


def test_compat_matrix() -> None:
    assert public_runtime_compatibility_matrix_v2_stub("m")["sdk_score"] > 0


def test_migration_runtime() -> None:
    assert public_runtime_migration_runtime_v2_stub("m")["sdk_score"] > 0
