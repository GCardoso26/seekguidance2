"""Runtime móvel leve — replay, offline, sync e modos híbridos (stubs honestos)."""

from app.mobile_runtime.explosion_control import mobile_explosion_caps_stub
from app.mobile_runtime.incremental_sync_runtime import incremental_sync_runtime_stub
from app.mobile_runtime.lightweight_reasoning_runtime import lightweight_reasoning_runtime_stub
from app.mobile_runtime.local_storage import local_storage_schema_stub
from app.mobile_runtime.mobile_branch_compaction import mobile_branch_compaction_stub
from app.mobile_runtime.mobile_conflict_resolution import mobile_conflict_resolution_stub
from app.mobile_runtime.mobile_cost_controls import mobile_cost_controls_stub
from app.mobile_runtime.mobile_lineage_runtime import mobile_lineage_runtime_stub
from app.mobile_runtime.mobile_observability_runtime import mobile_observability_runtime_stub
from app.mobile_runtime.mobile_replay_alignment import mobile_replay_alignment_stub
from app.mobile_runtime.mobile_replay_snapshot import mobile_replay_snapshot_stub
from app.mobile_runtime.mobile_runtime_governance import mobile_runtime_governance_stub
from app.mobile_runtime.mobile_runtime_recovery import mobile_runtime_recovery_stub
from app.mobile_runtime.mobile_semantic_cache import mobile_semantic_cache_stub
from app.mobile_runtime.mobile_temporal_runtime import mobile_temporal_runtime_stub
from app.mobile_runtime.observability import mobile_observability_stub
from app.mobile_runtime.offline import offline_replay_mode_stub
from app.mobile_runtime.offline_dataset_runtime import offline_dataset_runtime_stub
from app.mobile_runtime.offline_replay_runtime import offline_replay_runtime_stub
from app.mobile_runtime.reasoning_lightweight import lightweight_reasoning_stub
from app.mobile_runtime.replay import mobile_replay_chunk_stub
from app.mobile_runtime.runtime_modes import (
    cloud_runtime_mode_stub,
    hybrid_runtime_mode_stub,
    offline_runtime_mode_stub,
)
from app.mobile_runtime.runtime_sync_v2.deterministic_mobile_alignment import deterministic_mobile_alignment_v2_stub
from app.mobile_runtime.runtime_sync_v2.mobile_replay_lineage import mobile_replay_lineage_v2_stub
from app.mobile_runtime.runtime_sync_v2.mobile_runtime_entropy import mobile_runtime_entropy_v2_stub
from app.mobile_runtime.runtime_sync_v2.mobile_runtime_reconciliation import mobile_runtime_reconciliation_v2_stub
from app.mobile_runtime.runtime_sync_v2.mobile_snapshot_diff import mobile_snapshot_diff_v2_stub
from app.mobile_runtime.runtime_sync_v2.replay_delta_merge import replay_delta_merge_v2_stub
from app.mobile_runtime.runtime_sync_v2.replay_runtime_compaction import replay_runtime_compaction_v2_stub
from app.mobile_runtime.runtime_sync_v2.replay_sync_conflicts import replay_sync_conflicts_v2_stub
from app.mobile_runtime.storage import mobile_local_storage_stub

__all__ = [
    "cloud_runtime_mode_stub",
    "deterministic_mobile_alignment_v2_stub",
    "hybrid_runtime_mode_stub",
    "incremental_sync_runtime_stub",
    "lightweight_reasoning_runtime_stub",
    "lightweight_reasoning_stub",
    "local_storage_schema_stub",
    "mobile_branch_compaction_stub",
    "mobile_conflict_resolution_stub",
    "mobile_cost_controls_stub",
    "mobile_explosion_caps_stub",
    "mobile_lineage_runtime_stub",
    "mobile_local_storage_stub",
    "mobile_observability_runtime_stub",
    "mobile_observability_stub",
    "mobile_replay_alignment_stub",
    "mobile_replay_chunk_stub",
    "mobile_replay_lineage_v2_stub",
    "mobile_replay_snapshot_stub",
    "mobile_runtime_entropy_v2_stub",
    "mobile_runtime_governance_stub",
    "mobile_runtime_reconciliation_v2_stub",
    "mobile_runtime_recovery_stub",
    "mobile_semantic_cache_stub",
    "mobile_snapshot_diff_v2_stub",
    "mobile_temporal_runtime_stub",
    "offline_dataset_runtime_stub",
    "offline_replay_mode_stub",
    "offline_replay_runtime_stub",
    "offline_runtime_mode_stub",
    "replay_delta_merge_v2_stub",
    "replay_runtime_compaction_v2_stub",
    "replay_sync_conflicts_v2_stub",
]
