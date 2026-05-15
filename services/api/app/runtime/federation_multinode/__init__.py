"""federation_multinode."""
from __future__ import annotations

from .federation_balancing_runtime_v1 import federation_balancing_runtime_v1_stub
from .federation_balancing_runtime_v4 import federation_balancing_runtime_v4_stub
from .federation_cluster_health_v1 import federation_cluster_health_v1_stub
from .federation_cluster_recovery_v1 import federation_cluster_recovery_v1_stub
from .federation_cluster_runtime_v1 import federation_cluster_runtime_v1_stub
from .federation_cluster_runtime_v3 import federation_cluster_runtime_v3_stub
from .federation_cluster_summary_v1 import federation_cluster_summary_v1_stub
from .federation_consensus_runtime_v5 import federation_consensus_runtime_v5_stub
from .federation_degradation_runtime_v1 import federation_degradation_runtime_v1_stub
from .federation_distributed_health_v3 import federation_distributed_health_v3_stub
from .federation_distributed_tracing_v2 import federation_distributed_tracing_v2_stub
from .federation_failover_runtime_v1 import federation_failover_runtime_v1_stub
from .federation_failover_runtime_v3 import federation_failover_runtime_v3_stub
from .federation_multinode_runtime_v1 import federation_multinode_runtime_v1_stub
from .federation_operational_cluster_summary_v3 import federation_operational_cluster_summary_v3_stub
from .federation_partition_runtime_v2 import federation_partition_runtime_v2_stub
from .federation_pressure_runtime_v1 import federation_pressure_runtime_v1_stub
from .federation_real_node_runtime_v2 import federation_real_node_runtime_v2_stub
from .federation_recovery_runtime_v2 import federation_recovery_runtime_v2_stub
from .federation_sync_runtime_v1 import federation_sync_runtime_v1_stub

__all__ = [
    "federation_multinode_runtime_v1_stub",
    "federation_cluster_runtime_v1_stub",
    "federation_balancing_runtime_v1_stub",
    "federation_failover_runtime_v1_stub",
    "federation_sync_runtime_v1_stub",
    "federation_degradation_runtime_v1_stub",
    "federation_pressure_runtime_v1_stub",
    "federation_cluster_health_v1_stub",
    "federation_cluster_recovery_v1_stub",
    "federation_cluster_summary_v1_stub",    "federation_cluster_runtime_v3_stub",
    "federation_real_node_runtime_v2_stub",
    "federation_failover_runtime_v3_stub",
    "federation_partition_runtime_v2_stub",
    "federation_recovery_runtime_v2_stub",
    "federation_consensus_runtime_v5_stub",
    "federation_balancing_runtime_v4_stub",
    "federation_distributed_health_v3_stub",
    "federation_distributed_tracing_v2_stub",
    "federation_operational_cluster_summary_v3_stub",

]
