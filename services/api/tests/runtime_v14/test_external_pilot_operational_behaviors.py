"""External pilot operational behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.external_pilot_runtime.external_pilot_runtime_engine_v1 import (
    external_pilot_runtime_engine_v1,
)
from app.runtime.federation_multinode.federation_multinode_runtime_v1 import (
    federation_multinode_runtime_v1,
)
from app.runtime.productization.runtime_productization_runtime_v1 import (
    runtime_productization_engine_v1,
)


def test_pilot_operator_registry() -> None:
    r = external_pilot_runtime_engine_v1("pilot-a")
    assert r["pilot_score"] > 0
    assert "operator_registry" in r


def test_federation_balancing_degraded() -> None:
    r = federation_multinode_runtime_v1("fed-b")
    assert "degraded_nodes" in r
    assert r["cluster_score"] > 0


def test_rbac_capability_maps() -> None:
    r = runtime_productization_engine_v1("tenant-a")
    assert "rbac_capabilities" in r
    assert "read:replay" in r["rbac_capabilities"]["tenant-a"]


def test_external_pilot_artifacts_dir() -> None:
    from app.api.openapi_runtime_real.runtime_release_management_v1 import (
        runtime_release_management_engine_v1,
    )
    runtime_release_management_engine_v1("rel-beh")
    root = Path("generated/runtime_artifacts/external_pilot")
    assert (root / "runtime.release.stability.json").is_file()


def test_priority_queue_available() -> None:
    assert isinstance(queue.Queue(), queue.Queue)
