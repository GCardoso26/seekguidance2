"""Federation v3 engine stubs."""
from __future__ import annotations

from app.runtime.federation_multinode.federation_cluster_runtime_v3 import (
    federation_cluster_runtime_v3_stub,
)
from app.runtime.federation_multinode.federation_consensus_runtime_v5 import (
    federation_consensus_runtime_v5_stub,
)
from app.runtime.federation_multinode.federation_distributed_health_v3 import (
    federation_distributed_health_v3_stub,
)
from app.runtime.federation_multinode.federation_failover_runtime_v3 import (
    federation_failover_runtime_v3_stub,
)


def test_cluster_runtime_v3() -> None:
    assert federation_cluster_runtime_v3_stub("ga-fed")["federation_score"] > 0


def test_failover_v3() -> None:
    assert federation_failover_runtime_v3_stub("ga-fed")["federation_score"] > 0


def test_consensus_v5() -> None:
    assert federation_consensus_runtime_v5_stub("ga-fed")["federation_score"] > 0


def test_distributed_health_v3() -> None:
    assert federation_distributed_health_v3_stub("ga-fed")["federation_score"] > 0
