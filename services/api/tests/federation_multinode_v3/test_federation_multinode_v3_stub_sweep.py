"""federation_multinode_v3 stub sweep."""
from __future__ import annotations

from app.runtime.federation_multinode.federation_failover_runtime_v3 import federation_failover_runtime_v3_stub
from app.runtime.federation_multinode.federation_partition_runtime_v2 import federation_partition_runtime_v2_stub


def test_federation_multinode_v3_sweep() -> None:
    p_federation = federation_failover_runtime_v3_stub("ga30-sweep")
    assert p_federation["runtime_confidence"] > 0
    p_federation = federation_partition_runtime_v2_stub("ga30-sweep")
    assert p_federation["runtime_confidence"] > 0
