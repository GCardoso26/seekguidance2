"""Edge runtime — execução local leve com governança e limites (stubs)."""

from app.edge_runtime.edge_dataset_runtime import edge_dataset_runtime_stub
from app.edge_runtime.edge_reasoning_runtime import edge_reasoning_runtime_stub
from app.edge_runtime.edge_replay_compaction_v2 import edge_replay_compaction_v2_stub
from app.edge_runtime.edge_replay_runtime import edge_replay_runtime_stub
from app.edge_runtime.edge_runtime_convergence import edge_runtime_convergence_stub
from app.edge_runtime.edge_runtime_degradation import edge_runtime_degradation_stub
from app.edge_runtime.edge_runtime_governance import edge_runtime_governance_stub
from app.edge_runtime.edge_runtime_health import edge_runtime_health_stub
from app.edge_runtime.edge_runtime_limits import edge_runtime_limits_stub
from app.edge_runtime.edge_runtime_observability import edge_runtime_observability_stub
from app.edge_runtime.edge_sync_runtime import edge_sync_runtime_stub
from app.edge_runtime.edge_temporal_merge_v2 import edge_temporal_merge_v2_stub
from app.edge_runtime.edge_temporal_runtime import edge_temporal_runtime_stub

__all__ = [
    "edge_dataset_runtime_stub",
    "edge_reasoning_runtime_stub",
    "edge_replay_compaction_v2_stub",
    "edge_replay_runtime_stub",
    "edge_runtime_convergence_stub",
    "edge_runtime_degradation_stub",
    "edge_runtime_governance_stub",
    "edge_runtime_health_stub",
    "edge_runtime_limits_stub",
    "edge_runtime_observability_stub",
    "edge_sync_runtime_stub",
    "edge_temporal_merge_v2_stub",
    "edge_temporal_runtime_stub",
]
