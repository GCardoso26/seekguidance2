"""runtime_v18 consolidation stub sweep."""
from __future__ import annotations

from app.runtime.runtime_consolidation.canonical_execution_runtime_engine_v2 import (
    canonical_execution_runtime_engine_v2_stub,
)
from app.runtime.runtime_consolidation.canonical_runtime_capabilities_v2 import (
    canonical_runtime_capabilities_v2_stub,
)


def test_consolidation_v2_stubs() -> None:
    a = canonical_execution_runtime_engine_v2_stub("ep18-a")
    b = canonical_runtime_capabilities_v2_stub("ep18-b")
    assert a["runtime_confidence"] > 0
    assert b["runtime_confidence"] > 0
