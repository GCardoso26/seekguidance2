"""Persistência operacional de replay (contratos + stubs incrementais)."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime.contracts import ReplayStorageBackend, StorageDialect
from app.runtime.persistent_replay_runtime.operational_bridge import persistent_replay_operational_bridge_stub
from app.runtime.persistent_replay_runtime.replay_branch_archive import replay_branch_archive_stub
from app.runtime.persistent_replay_runtime.replay_consistency_storage import replay_consistency_persist_stub
from app.runtime.persistent_replay_runtime.replay_diff_repository import replay_diff_store_stub
from app.runtime.persistent_replay_runtime.replay_governance_storage import replay_governance_persist_stub
from app.runtime.persistent_replay_runtime.replay_integrity_repository import replay_integrity_record_stub
from app.runtime.persistent_replay_runtime.replay_lineage_repository import replay_lineage_append_stub
from app.runtime.persistent_replay_runtime.replay_runtime_index import replay_runtime_index_upsert_stub
from app.runtime.persistent_replay_runtime.replay_runtime_reconciliation import replay_runtime_reconcile_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_repository import replay_snapshot_put_stub
from app.runtime.persistent_replay_runtime.replay_temporal_history import replay_temporal_history_record_stub

__all__ = [
    "ReplayStorageBackend",
    "StorageDialect",
    "persistent_replay_operational_bridge_stub",
    "replay_branch_archive_stub",
    "replay_consistency_persist_stub",
    "replay_diff_store_stub",
    "replay_governance_persist_stub",
    "replay_integrity_record_stub",
    "replay_lineage_append_stub",
    "replay_runtime_index_upsert_stub",
    "replay_runtime_reconcile_stub",
    "replay_snapshot_put_stub",
    "replay_temporal_history_record_stub",
]
