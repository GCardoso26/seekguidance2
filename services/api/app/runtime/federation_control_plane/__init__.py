"""federation_control_plane."""
from __future__ import annotations

from .federation_control_plane_alignment_v1 import federation_control_plane_alignment_v1_stub
from .federation_control_plane_engine_v1 import federation_control_plane_engine_v1_stub
from .federation_control_plane_failover_v1 import federation_control_plane_failover_v1_stub
from .federation_control_plane_governance_v1 import federation_control_plane_governance_v1_stub
from .federation_control_plane_health_v1 import federation_control_plane_health_v1_stub
from .federation_control_plane_metrics_v1 import federation_control_plane_metrics_v1_stub
from .federation_control_plane_registry_v1 import federation_control_plane_registry_v1_stub
from .federation_control_plane_rollout_v1 import federation_control_plane_rollout_v1_stub
from .federation_control_plane_summary_v1 import federation_control_plane_summary_v1_stub
from .federation_control_plane_topology_v1 import federation_control_plane_topology_v1_stub

__all__ = [
    "federation_control_plane_engine_v1_stub",
    "federation_control_plane_registry_v1_stub",
    "federation_control_plane_topology_v1_stub",
    "federation_control_plane_health_v1_stub",
    "federation_control_plane_rollout_v1_stub",
    "federation_control_plane_alignment_v1_stub",
    "federation_control_plane_failover_v1_stub",
    "federation_control_plane_governance_v1_stub",
    "federation_control_plane_metrics_v1_stub",
    "federation_control_plane_summary_v1_stub",
]
