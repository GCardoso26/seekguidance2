"""Platform operations center stubs."""
from __future__ import annotations

from app.runtime.platform_operations_center.operations_center_incident_engine_v1 import (
    operations_center_incident_engine_v1_stub,
)
from app.runtime.platform_operations_center.operations_center_runtime_v1 import (
    operations_center_runtime_v1_stub,
)


def test_oc_runtime() -> None:
    assert operations_center_runtime_v1_stub("q")["operations_score"] > 0


def test_incident_engine() -> None:
    assert operations_center_incident_engine_v1_stub("q")["operations_score"] > 0
