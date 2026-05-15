"""Persistência operacional de replay (contratos + stubs incrementais)."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime.compact_snapshot_runtime import compact_snapshot_runtime_stub
from app.runtime.persistent_replay_runtime.contracts import ReplayStorageBackend, StorageDialect
from app.runtime.persistent_replay_runtime.distributed_snapshot_exchange import (
    distributed_snapshot_exchange_stub,
)
from app.runtime.persistent_replay_runtime.filesystem_lineage_runtime_adapter import (
    filesystem_lineage_runtime_adapter_stub,
)
from app.runtime.persistent_replay_runtime.filesystem_replay_archive import (
    default_filesystem_archive_root,
    filesystem_archive_read_latest,
    filesystem_archive_write,
)
from app.runtime.persistent_replay_runtime.filesystem_replay_compaction_runtime_v2 import (
    filesystem_replay_compaction_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.filesystem_runtime_archive_rotation_v2 import (
    filesystem_runtime_archive_rotation_v2_stub,
)
from app.runtime.persistent_replay_runtime.integrity_audit_runtime_v2 import integrity_audit_runtime_v2_stub
from app.runtime.persistent_replay_runtime.lineage_recovery_runtime_v2 import lineage_recovery_runtime_v2_stub
from app.runtime.persistent_replay_runtime.lineage_repair_runtime import lineage_repair_runtime_stub
from app.runtime.persistent_replay_runtime.lineage_snapshot_runtime import lineage_snapshot_runtime_stub
from app.runtime.persistent_replay_runtime.lineage_snapshot_store import lineage_write_anchor
from app.runtime.persistent_replay_runtime.operational_bridge import persistent_replay_operational_bridge_stub
from app.runtime.persistent_replay_runtime.replay_archive_federation import replay_archive_federation_stub
from app.runtime.persistent_replay_runtime.replay_archive_filesystem_runtime_v2 import (
    replay_archive_filesystem_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_archive_repair import replay_archive_repair_stub
from app.runtime.persistent_replay_runtime.replay_branch_archive import replay_branch_archive_stub
from app.runtime.persistent_replay_runtime.replay_branch_archive_recovery_v3 import (
    replay_branch_archive_recovery_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_branch_archive_runtime import (
    replay_branch_archive_runtime_stub,
)
from app.runtime.persistent_replay_runtime.replay_branch_exchange import replay_branch_exchange_stub
from app.runtime.persistent_replay_runtime.replay_branch_integrity_runtime_v5 import (
    replay_branch_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_branch_reconciliation_bridge import (
    replay_branch_reconciliation_bridge_stub,
)
from app.runtime.persistent_replay_runtime.replay_branch_recovery_v2 import replay_branch_recovery_v2_stub
from app.runtime.persistent_replay_runtime.replay_branch_restore_runtime_v1 import replay_branch_restore_runtime_v1_stub
from app.runtime.persistent_replay_runtime.replay_branch_runtime_service import replay_branch_runtime_service_stub
from app.runtime.persistent_replay_runtime.replay_checkpoint_integrity_runtime_v5 import (
    replay_checkpoint_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_checkpoint_recovery import replay_checkpoint_recovery_stub
from app.runtime.persistent_replay_runtime.replay_checkpoint_repair_v2 import replay_checkpoint_repair_v2_stub
from app.runtime.persistent_replay_runtime.replay_checkpoint_rotation_runtime import (
    replay_checkpoint_rotation_runtime_stub,
)
from app.runtime.persistent_replay_runtime.replay_checkpoint_runtime import replay_checkpoint_runtime_stub
from app.runtime.persistent_replay_runtime.replay_checkpoint_sqlite_runtime_v2 import (
    replay_checkpoint_sqlite_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_compaction_governance import replay_compaction_governance_stub
from app.runtime.persistent_replay_runtime.replay_compaction_runtime_v2 import (
    replay_compaction_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_compaction_runtime_v3 import (
    replay_compaction_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_consistency_federation import (
    replay_consistency_federation_stub,
)
from app.runtime.persistent_replay_runtime.replay_consistency_storage import replay_consistency_persist_stub
from app.runtime.persistent_replay_runtime.replay_corruption_detection_v2 import replay_corruption_detection_v2_stub
from app.runtime.persistent_replay_runtime.replay_corruption_detection_v3 import (
    replay_corruption_detection_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_corruption_detector import replay_corruption_detector_stub
from app.runtime.persistent_replay_runtime.replay_diff_repository import replay_diff_store_stub
from app.runtime.persistent_replay_runtime.replay_execution_archive_runtime_v1 import (
    replay_execution_archive_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_audit_runtime_v1 import (
    replay_execution_audit_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_branch_control_v2 import (
    replay_execution_branch_control_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_branch_runtime_v3 import (
    replay_execution_branch_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_checkpoint_runtime_v2 import (
    replay_execution_checkpoint_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_checkpoint_runtime_v3 import (
    replay_execution_checkpoint_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_compaction_runtime_v1 import (
    replay_execution_compaction_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_compaction_runtime_v3 import (
    replay_execution_compaction_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_consensus_runtime_v1 import (
    replay_execution_consensus_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_consistency_runtime_v2 import (
    replay_execution_consistency_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_consistency_runtime_v3 import (
    replay_execution_consistency_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import execute_deterministic_replay_runtime
from app.runtime.persistent_replay_runtime.replay_execution_integrity_runtime_v1 import (
    replay_execution_integrity_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_runtime_v2 import (
    replay_execution_integrity_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_runtime_v3 import (
    replay_execution_integrity_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_runtime_v5 import (
    replay_execution_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_trace_runtime_v1 import (
    replay_execution_integrity_trace_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_journal_runtime_v1 import (
    replay_execution_journal_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_journal_runtime_v3 import (
    replay_execution_journal_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_lock_runtime_v3 import replay_execution_lock_runtime_v3_stub
from app.runtime.persistent_replay_runtime.replay_execution_locking_runtime_v1 import (
    replay_execution_locking_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_operational_summary_v2 import (
    replay_execution_operational_summary_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_reconciliation_v2 import (
    replay_execution_reconciliation_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_recovery_runtime_v1 import (
    replay_execution_recovery_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_recovery_runtime_v3 import (
    replay_execution_recovery_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_rotation_runtime_v1 import (
    replay_execution_rotation_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_runtime_engine_v1 import (
    replay_execution_runtime_engine_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_runtime_v3 import replay_execution_runtime_v3_stub
from app.runtime.persistent_replay_runtime.replay_execution_snapshot_runtime_v1 import (
    replay_execution_snapshot_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_snapshot_runtime_v2 import (
    replay_execution_snapshot_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_state_alignment_v2 import (
    replay_execution_state_alignment_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_temporal_locking_v2 import (
    replay_execution_temporal_locking_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_temporal_runtime_v1 import (
    replay_execution_temporal_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_execution_temporal_runtime_v3 import (
    replay_execution_temporal_runtime_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_gc_runtime import replay_gc_runtime_stub
from app.runtime.persistent_replay_runtime.replay_gc_runtime_v3 import replay_gc_runtime_v3_stub
from app.runtime.persistent_replay_runtime.replay_governance_storage import replay_governance_persist_stub
from app.runtime.persistent_replay_runtime.replay_hash_validation_runtime_v5 import (
    replay_hash_validation_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_audit import replay_integrity_audit_stub
from app.runtime.persistent_replay_runtime.replay_integrity_consensus_runtime_v5 import (
    replay_integrity_consensus_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_engine_v4 import replay_integrity_engine_v4_stub
from app.runtime.persistent_replay_runtime.replay_integrity_federation import replay_integrity_federation_stub
from app.runtime.persistent_replay_runtime.replay_integrity_governance_runtime_v1 import (
    replay_integrity_governance_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_operational_summary_v1 import (
    replay_integrity_operational_summary_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_recovery_runtime_v1 import (
    replay_integrity_recovery_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_recovery_v2 import replay_integrity_recovery_v2_stub
from app.runtime.persistent_replay_runtime.replay_integrity_repair import replay_integrity_repair_stub
from app.runtime.persistent_replay_runtime.replay_integrity_repair_runtime_v5 import (
    replay_integrity_repair_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_repair_v3 import replay_integrity_repair_v3_stub
from app.runtime.persistent_replay_runtime.replay_integrity_repository import replay_integrity_record_stub
from app.runtime.persistent_replay_runtime.replay_integrity_restore_runtime_v1 import (
    replay_integrity_restore_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_runtime_v2 import (
    replay_integrity_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_scoring_runtime_v1 import (
    replay_integrity_scoring_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_service import replay_integrity_service_stub
from app.runtime.persistent_replay_runtime.replay_integrity_snapshot import replay_integrity_snapshot_stub
from app.runtime.persistent_replay_runtime.replay_integrity_sqlite_runtime_v2 import (
    replay_integrity_sqlite_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_integrity_store import (
    replay_integrity_hash_payload,
    replay_integrity_record_metadata,
    replay_integrity_verify,
)
from app.runtime.persistent_replay_runtime.replay_integrity_validation_runtime_v1 import (
    replay_integrity_validation_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_lineage_federation import replay_lineage_federation_stub
from app.runtime.persistent_replay_runtime.replay_lineage_integrity_runtime_v5 import (
    replay_lineage_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_lineage_persistence_bridge import (
    replay_lineage_persistence_bridge_stub,
)
from app.runtime.persistent_replay_runtime.replay_lineage_repair_v3 import replay_lineage_repair_v3_stub
from app.runtime.persistent_replay_runtime.replay_lineage_repository import replay_lineage_append_stub
from app.runtime.persistent_replay_runtime.replay_lineage_service import replay_lineage_service_stub
from app.runtime.persistent_replay_runtime.replay_lineage_sqlite_runtime_v2 import (
    replay_lineage_sqlite_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_reconciliation_service import replay_reconciliation_service_stub
from app.runtime.persistent_replay_runtime.replay_reconstruction_runtime_v1 import replay_reconstruction_runtime_v1_stub
from app.runtime.persistent_replay_runtime.replay_recovery_alignment_runtime_v1 import (
    replay_recovery_alignment_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_recovery_audit_v3 import replay_recovery_audit_v3_stub
from app.runtime.persistent_replay_runtime.replay_recovery_engine import replay_recovery_engine_stub
from app.runtime.persistent_replay_runtime.replay_recovery_integrity_runtime_v5 import (
    replay_recovery_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_recovery_operational_summary_v1 import (
    replay_recovery_operational_summary_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_recovery_runtime_v2 import (
    replay_recovery_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_recovery_trace_runtime_v1 import replay_recovery_trace_runtime_v1_stub
from app.runtime.persistent_replay_runtime.replay_recovery_workflow_v1 import replay_recovery_workflow_v1_stub
from app.runtime.persistent_replay_runtime.replay_repair_confidence_runtime import (
    replay_repair_confidence_runtime_stub,
)
from app.runtime.persistent_replay_runtime.replay_repair_operational_summary_v3 import (
    replay_repair_operational_summary_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_rollback_runtime_v1 import replay_rollback_runtime_v1_stub
from app.runtime.persistent_replay_runtime.replay_runtime_bridge import replay_runtime_bridge_stub
from app.runtime.persistent_replay_runtime.replay_runtime_checkpointing import replay_runtime_checkpointing_stub
from app.runtime.persistent_replay_runtime.replay_runtime_compaction_v2 import replay_runtime_compaction_v2_stub
from app.runtime.persistent_replay_runtime.replay_runtime_health import replay_runtime_health_stub
from app.runtime.persistent_replay_runtime.replay_runtime_index import replay_runtime_index_upsert_stub
from app.runtime.persistent_replay_runtime.replay_runtime_integrity_scanner_v3 import (
    replay_runtime_integrity_scanner_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_runtime_integrity_v2 import replay_runtime_integrity_v2_stub
from app.runtime.persistent_replay_runtime.replay_runtime_reconciliation import replay_runtime_reconcile_stub
from app.runtime.persistent_replay_runtime.replay_runtime_reconstruction import (
    replay_runtime_reconstruction_stub,
)
from app.runtime.persistent_replay_runtime.replay_runtime_recovery_checkpoint import (
    replay_runtime_recovery_checkpoint_stub,
)
from app.runtime.persistent_replay_runtime.replay_runtime_service import replay_runtime_service_stub
from app.runtime.persistent_replay_runtime.replay_runtime_snapshot_integrity import (
    replay_runtime_snapshot_integrity_stub,
)
from app.runtime.persistent_replay_runtime.replay_runtime_storage_consistency_v3 import (
    replay_runtime_storage_consistency_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_runtime_storage_health import replay_runtime_storage_health_stub
from app.runtime.persistent_replay_runtime.replay_runtime_temporal_snapshot import (
    replay_runtime_temporal_snapshot_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_compaction_runtime import (
    replay_snapshot_compaction_runtime_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_compaction_runtime_v2 import (
    replay_snapshot_compaction_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_gc import replay_snapshot_gc_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_integrity_runtime_v5 import (
    replay_snapshot_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_manager import replay_snapshot_manager_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_reconstruction_v3 import (
    replay_snapshot_reconstruction_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_repair_v2 import replay_snapshot_repair_v2_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_repository import replay_snapshot_put_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_restore_runtime_v1 import (
    replay_snapshot_restore_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_snapshot_rotation import replay_snapshot_rotation_stub
from app.runtime.persistent_replay_runtime.replay_snapshot_sqlite_runtime_v2 import (
    replay_snapshot_sqlite_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_consistency_runtime_v2 import (
    replay_storage_consistency_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_consistency_v3 import (
    replay_storage_consistency_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_filesystem_bridge import (
    replay_storage_filesystem_bridge_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_gc_runtime_v2 import replay_storage_gc_runtime_v2_stub
from app.runtime.persistent_replay_runtime.replay_storage_integrity_scanner_v2 import (
    replay_storage_integrity_scanner_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_integrity_scanner_v3 import (
    replay_storage_integrity_scanner_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_operational_summary_v2 import (
    replay_storage_operational_summary_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_realm_bridge import replay_storage_realm_bridge_stub
from app.runtime.persistent_replay_runtime.replay_storage_recovery_journal import (
    append_recovery_journal,
    replay_storage_recovery_journal_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_recovery_orchestrator import (
    replay_storage_recovery_orchestrator_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_recovery_orchestrator_v3 import (
    replay_storage_recovery_orchestrator_v3_run,
    replay_storage_recovery_orchestrator_v3_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_rotation_runtime_v2 import (
    replay_storage_rotation_runtime_v2_stub,
)
from app.runtime.persistent_replay_runtime.replay_storage_router import replay_storage_router_stub
from app.runtime.persistent_replay_runtime.replay_storage_sqlite_bridge import replay_storage_sqlite_bridge_stub
from app.runtime.persistent_replay_runtime.replay_temporal_alignment_service import (
    replay_temporal_alignment_service_stub,
)
from app.runtime.persistent_replay_runtime.replay_temporal_checkpointing import (
    replay_temporal_checkpointing_stub,
)
from app.runtime.persistent_replay_runtime.replay_temporal_history import replay_temporal_history_record_stub
from app.runtime.persistent_replay_runtime.replay_temporal_integrity_runtime_v1 import (
    replay_temporal_integrity_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.replay_temporal_integrity_runtime_v5 import (
    replay_temporal_integrity_runtime_v5_stub,
)
from app.runtime.persistent_replay_runtime.replay_temporal_merge_bridge import replay_temporal_merge_bridge_stub
from app.runtime.persistent_replay_runtime.replay_temporal_recovery_v3 import replay_temporal_recovery_v3_stub
from app.runtime.persistent_replay_runtime.replay_temporal_restore_runtime_v1 import (
    replay_temporal_restore_runtime_v1_stub,
)
from app.runtime.persistent_replay_runtime.snapshot_delta_storage import snapshot_delta_storage_stub
from app.runtime.persistent_replay_runtime.snapshot_repair_runtime import snapshot_repair_runtime_stub
from app.runtime.persistent_replay_runtime.sqlite_checkpoint_runtime import (
    sqlite_checkpoint_runtime_stub,
    sqlite_checkpoint_runtime_write,
)
from app.runtime.persistent_replay_runtime.sqlite_compact_snapshot_runtime import (
    sqlite_compact_snapshot_runtime_put,
    sqlite_compact_snapshot_runtime_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_lineage_index_runtime import (
    sqlite_lineage_index_runtime_stub,
    sqlite_lineage_index_runtime_upsert,
)
from app.runtime.persistent_replay_runtime.sqlite_lineage_runtime import (
    sqlite_lineage_runtime_anchor,
    sqlite_lineage_runtime_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_replay_execution_store_v2 import sqlite_replay_execution_store_v2_stub
from app.runtime.persistent_replay_runtime.sqlite_replay_runtime_adapter import (
    sqlite_replay_runtime_adapter_put,
    sqlite_replay_runtime_adapter_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_runtime_branch_storage_v2 import (
    sqlite_runtime_branch_storage_v2_put,
    sqlite_runtime_branch_storage_v2_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_runtime_branch_store_v2 import sqlite_runtime_branch_store_v2_stub
from app.runtime.persistent_replay_runtime.sqlite_runtime_integrity_store_v2 import (
    sqlite_runtime_integrity_store_v2_put,
    sqlite_runtime_integrity_store_v2_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_runtime_lineage_index_v2 import (
    sqlite_runtime_lineage_index_v2_stub,
    sqlite_runtime_lineage_index_v2_upsert,
)
from app.runtime.persistent_replay_runtime.sqlite_runtime_replay_archive_v2 import (
    sqlite_runtime_replay_archive_v2_put,
    sqlite_runtime_replay_archive_v2_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_runtime_replay_journal_v2 import sqlite_runtime_replay_journal_v2_stub
from app.runtime.persistent_replay_runtime.sqlite_runtime_temporal_store_v2 import sqlite_runtime_temporal_store_v2_stub
from app.runtime.persistent_replay_runtime.sqlite_snapshot_runtime import (
    sqlite_snapshot_runtime_get,
    sqlite_snapshot_runtime_put,
    sqlite_snapshot_runtime_stub,
)
from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    connect_replay_sqlite,
    default_sqlite_store_root,
    sqlite_read_latest_snapshot,
    sqlite_write_snapshot,
)
from app.runtime.persistent_replay_runtime.temporal_recovery_runtime import temporal_recovery_runtime_stub
from app.runtime.persistent_replay_runtime.temporal_snapshot_merge import temporal_snapshot_merge_stub
from app.runtime.persistent_replay_runtime.temporal_snapshot_reconstruction_v2 import (
    temporal_snapshot_reconstruction_v2_stub,
)

from .replay_deterministic_audit_runtime_v3 import replay_deterministic_audit_runtime_v3_stub
from .replay_execution_audit_registry_v2 import replay_execution_audit_registry_v2_stub
from .replay_execution_branch_integrity_v2 import replay_execution_branch_integrity_v2_stub
from .replay_execution_consistency_guard_v5 import replay_execution_consistency_guard_v5_stub
from .replay_execution_consistency_runtime_v4 import replay_execution_consistency_runtime_v4_stub
from .replay_execution_corruption_guard_v3 import replay_execution_corruption_guard_v3_stub
from .replay_execution_deterministic_guard_v4 import replay_execution_deterministic_guard_v4_stub
from .replay_execution_integrity_engine_v6 import replay_execution_integrity_engine_v6_stub
from .replay_execution_integrity_repair_v2 import replay_execution_integrity_repair_v2_stub
from .replay_execution_integrity_snapshot_v3 import replay_execution_integrity_snapshot_v3_stub
from .replay_execution_recovery_alignment_v3 import replay_execution_recovery_alignment_v3_stub
from .replay_execution_temporal_consistency_v4 import replay_execution_temporal_consistency_v4_stub
from .replay_execution_trace_runtime_v2 import replay_execution_trace_runtime_v2_stub
from .replay_runtime_archive_rebuilder_v1 import replay_runtime_archive_rebuilder_v1_stub
from .replay_runtime_checkpoint_index_v1 import replay_runtime_checkpoint_index_v1_stub
from .replay_runtime_compaction_runtime_v3 import replay_runtime_compaction_runtime_v3_stub
from .replay_runtime_compaction_v4 import replay_runtime_compaction_v4_stub
from .replay_runtime_execution_audit_v3 import replay_runtime_execution_audit_v3_stub
from .replay_runtime_gc_runtime_v3 import replay_runtime_gc_runtime_v3_stub
from .replay_runtime_gc_v4 import replay_runtime_gc_v4_stub
from .replay_runtime_hash_alignment_v3 import replay_runtime_hash_alignment_v3_stub
from .replay_runtime_lineage_persistence_v3 import replay_runtime_lineage_persistence_v3_stub
from .replay_runtime_operational_summary_v3 import replay_runtime_operational_summary_v3_stub
from .replay_runtime_persistence_summary_v2 import replay_runtime_persistence_summary_v2_stub
from .replay_runtime_recovery_journal_v2 import replay_runtime_recovery_journal_v2_stub
from .replay_runtime_repair_engine_v3 import replay_runtime_repair_engine_v3_stub
from .replay_runtime_rollback_alignment_v2 import replay_runtime_rollback_alignment_v2_stub
from .replay_runtime_snapshot_integrity_v4 import replay_runtime_snapshot_integrity_v4_stub
from .replay_runtime_snapshot_rotation_v3 import replay_runtime_snapshot_rotation_v3_stub
from .replay_runtime_storage_pressure_v2 import replay_runtime_storage_pressure_v2_stub
from .replay_runtime_storage_pressure_v3 import replay_runtime_storage_pressure_v3_stub
from .replay_runtime_storage_rotation_v4 import replay_runtime_storage_rotation_v4_stub
from .replay_runtime_temporal_reconciliation_v2 import replay_runtime_temporal_reconciliation_v2_stub
from .replay_runtime_temporal_reconciliation_v5 import replay_runtime_temporal_reconciliation_v5_stub
from .sqlite_runtime_checkpoint_runtime_v3 import sqlite_runtime_checkpoint_runtime_v3_stub
from .sqlite_runtime_compaction_engine_v1 import sqlite_runtime_compaction_engine_v1_stub
from .sqlite_runtime_execution_store_v3 import sqlite_runtime_execution_store_v3_stub
from .sqlite_runtime_integrity_index_v2 import sqlite_runtime_integrity_index_v2_stub
from .sqlite_runtime_integrity_runtime_v3 import sqlite_runtime_integrity_runtime_v3_stub
from .sqlite_runtime_integrity_scanner_v3 import sqlite_runtime_integrity_scanner_v3_stub
from .sqlite_runtime_recovery_executor_v1 import sqlite_runtime_recovery_executor_v1_stub
from .sqlite_runtime_recovery_runtime_v2 import sqlite_runtime_recovery_runtime_v2_stub
from .sqlite_runtime_recovery_runtime_v3 import sqlite_runtime_recovery_runtime_v3_stub
from .sqlite_runtime_replay_archive_v3 import sqlite_runtime_replay_archive_v3_stub
from .sqlite_runtime_replay_trace_store_v2 import sqlite_runtime_replay_trace_store_v2_stub
from .sqlite_runtime_retention_runtime_v1 import sqlite_runtime_retention_runtime_v1_stub
from .sqlite_runtime_snapshot_rotation_v1 import sqlite_runtime_snapshot_rotation_v1_stub
from .sqlite_runtime_temporal_index_v2 import sqlite_runtime_temporal_index_v2_stub
from .sqlite_runtime_temporal_runtime_v3 import sqlite_runtime_temporal_runtime_v3_stub
from .sqlite_runtime_temporal_store_v1 import sqlite_runtime_temporal_store_v1_stub

__all__ = [
    "ReplayStorageBackend",
    "StorageDialect",
    "connect_replay_sqlite",
    "default_filesystem_archive_root",
    "distributed_snapshot_exchange_stub",
    "filesystem_lineage_runtime_adapter_stub",
    "lineage_snapshot_runtime_stub",
    "replay_runtime_checkpointing_stub",
    "replay_runtime_integrity_v2_stub",
    "replay_runtime_storage_health_stub",
    "replay_snapshot_compaction_runtime_stub",
    "snapshot_delta_storage_stub",
    "sqlite_replay_runtime_adapter_put",
    "sqlite_replay_runtime_adapter_stub",
    "default_sqlite_store_root",
    "filesystem_archive_read_latest",
    "filesystem_archive_write",
    "lineage_write_anchor",
    "persistent_replay_operational_bridge_stub",
    "replay_branch_archive_stub",
    "replay_archive_federation_stub",
    "replay_branch_exchange_stub",
    "replay_branch_reconciliation_bridge_stub",
    "replay_branch_runtime_service_stub",
    "replay_compaction_governance_stub",
    "replay_consistency_federation_stub",
    "replay_consistency_persist_stub",
    "replay_diff_store_stub",
    "replay_governance_persist_stub",
    "replay_integrity_hash_payload",
    "replay_integrity_record_metadata",
    "replay_integrity_record_stub",
    "replay_integrity_service_stub",
    "replay_integrity_snapshot_stub",
    "replay_integrity_federation_stub",
    "replay_integrity_verify",
    "replay_lineage_append_stub",
    "replay_lineage_federation_stub",
    "replay_lineage_persistence_bridge_stub",
    "replay_lineage_service_stub",
    "replay_reconciliation_service_stub",
    "replay_runtime_bridge_stub",
    "replay_runtime_health_stub",
    "replay_runtime_index_upsert_stub",
    "replay_runtime_reconcile_stub",
    "replay_runtime_service_stub",
    "replay_snapshot_manager_stub",
    "replay_snapshot_put_stub",
    "sqlite_read_latest_snapshot",
    "sqlite_write_snapshot",
    "replay_storage_filesystem_bridge_stub",
    "replay_storage_realm_bridge_stub",
    "replay_storage_router_stub",
    "replay_storage_sqlite_bridge_stub",
    "replay_temporal_alignment_service_stub",
    "replay_temporal_history_record_stub",
    "replay_temporal_merge_bridge_stub",
    "temporal_snapshot_merge_stub",
    "compact_snapshot_runtime_stub",
    "replay_checkpoint_runtime_stub",
    "replay_runtime_compaction_v2_stub",
    "replay_runtime_recovery_checkpoint_stub",
    "replay_runtime_snapshot_integrity_stub",
    "replay_runtime_temporal_snapshot_stub",
    "replay_snapshot_gc_stub",
    "replay_snapshot_rotation_stub",
    "sqlite_lineage_runtime_anchor",
    "sqlite_lineage_runtime_stub",
    "sqlite_snapshot_runtime_get",
    "sqlite_snapshot_runtime_put",
    "sqlite_snapshot_runtime_stub",
    "sqlite_checkpoint_runtime_stub",
    "sqlite_checkpoint_runtime_write",
    "sqlite_compact_snapshot_runtime_put",
    "sqlite_compact_snapshot_runtime_stub",
    "sqlite_lineage_index_runtime_stub",
    "sqlite_lineage_index_runtime_upsert",
    "replay_branch_archive_runtime_stub",
    "replay_compaction_runtime_v2_stub",
    "replay_gc_runtime_stub",
    "replay_integrity_runtime_v2_stub",
    "replay_recovery_runtime_v2_stub",
    "replay_temporal_checkpointing_stub",
    "replay_archive_repair_stub",
    "replay_checkpoint_recovery_stub",
    "replay_corruption_detector_stub",
    "replay_integrity_audit_stub",
    "replay_integrity_repair_stub",
    "replay_recovery_engine_stub",
    "replay_runtime_reconstruction_stub",
    "lineage_repair_runtime_stub",
    "snapshot_repair_runtime_stub",
    "temporal_recovery_runtime_stub",
    "integrity_audit_runtime_v2_stub",
    "lineage_recovery_runtime_v2_stub",
    "replay_branch_recovery_v2_stub",
    "replay_checkpoint_repair_v2_stub",
    "replay_corruption_detection_v2_stub",
    "replay_integrity_recovery_v2_stub",
    "replay_repair_confidence_runtime_stub",
    "replay_snapshot_repair_v2_stub",
    "replay_storage_recovery_orchestrator_stub",
    "temporal_snapshot_reconstruction_v2_stub",
    "replay_checkpoint_rotation_runtime_stub",
    "replay_snapshot_compaction_runtime_v2_stub",
    "replay_storage_consistency_runtime_v2_stub",
    "replay_storage_gc_runtime_v2_stub",
    "replay_storage_integrity_scanner_v2_stub",
    "append_recovery_journal",
    "replay_storage_recovery_journal_stub",
    "sqlite_runtime_branch_storage_v2_put",
    "sqlite_runtime_branch_storage_v2_stub",
    "sqlite_runtime_integrity_store_v2_put",
    "sqlite_runtime_integrity_store_v2_stub",
    "sqlite_runtime_lineage_index_v2_stub",
    "sqlite_runtime_lineage_index_v2_upsert",
    "sqlite_runtime_replay_archive_v2_put",
    "sqlite_runtime_replay_archive_v2_stub",
    "replay_corruption_detection_v3_stub",
    "replay_integrity_repair_v3_stub",
    "replay_snapshot_reconstruction_v3_stub",
    "replay_lineage_repair_v3_stub",
    "replay_storage_recovery_orchestrator_v3_run",
    "replay_storage_recovery_orchestrator_v3_stub",
    "replay_recovery_audit_v3_stub",
    "replay_storage_consistency_v3_stub",
    "replay_temporal_recovery_v3_stub",
    "replay_branch_archive_recovery_v3_stub",
    "replay_repair_operational_summary_v3_stub",
    "replay_execution_checkpoint_runtime_v2_stub",
    "replay_execution_state_alignment_v2_stub",
    "replay_execution_temporal_locking_v2_stub",
    "replay_execution_reconciliation_v2_stub",
    "replay_execution_branch_control_v2_stub",
    "replay_execution_snapshot_runtime_v2_stub",
    "replay_execution_integrity_runtime_v2_stub",
    "replay_execution_consistency_runtime_v2_stub",
    "replay_execution_operational_summary_v2_stub",
    "replay_snapshot_sqlite_runtime_v2_stub",
    "replay_lineage_sqlite_runtime_v2_stub",
    "replay_integrity_sqlite_runtime_v2_stub",
    "replay_checkpoint_sqlite_runtime_v2_stub",
    "replay_archive_filesystem_runtime_v2_stub",
    "replay_compaction_runtime_v3_stub",
    "replay_gc_runtime_v3_stub",
    "replay_storage_rotation_runtime_v2_stub",
    "replay_storage_integrity_scanner_v3_stub",
    "replay_storage_operational_summary_v2_stub",
    "execute_deterministic_replay_runtime",
    "replay_execution_runtime_v3_stub",
    "replay_execution_checkpoint_runtime_v3_stub",
    "replay_execution_temporal_runtime_v3_stub",
    "replay_execution_consistency_runtime_v3_stub",
    "replay_execution_recovery_runtime_v3_stub",
    "replay_execution_lock_runtime_v3_stub",
    "replay_execution_journal_runtime_v3_stub",
    "replay_execution_compaction_runtime_v3_stub",
    "replay_execution_branch_runtime_v3_stub",
    "replay_execution_integrity_runtime_v3_stub",
    "sqlite_replay_execution_store_v2_stub",
    "sqlite_runtime_replay_journal_v2_stub",
    "sqlite_runtime_temporal_store_v2_stub",
    "sqlite_runtime_branch_store_v2_stub",
    "filesystem_replay_compaction_runtime_v2_stub",
    "filesystem_runtime_archive_rotation_v2_stub",
    "replay_runtime_integrity_scanner_v3_stub",
    "replay_runtime_storage_consistency_v3_stub",
    "replay_integrity_engine_v4_stub",
    "replay_execution_audit_runtime_v1_stub",
    "replay_integrity_scoring_runtime_v1_stub",
    "replay_integrity_validation_runtime_v1_stub",
    "replay_integrity_recovery_runtime_v1_stub",
    "replay_temporal_integrity_runtime_v1_stub",
    "replay_execution_consensus_runtime_v1_stub",
    "replay_execution_integrity_trace_runtime_v1_stub",
    "replay_integrity_governance_runtime_v1_stub",
    "replay_integrity_operational_summary_v1_stub",
    "replay_rollback_runtime_v1_stub",
    "replay_recovery_workflow_v1_stub",
    "replay_reconstruction_runtime_v1_stub",
    "replay_snapshot_restore_runtime_v1_stub",
    "replay_temporal_restore_runtime_v1_stub",
    "replay_branch_restore_runtime_v1_stub",
    "replay_integrity_restore_runtime_v1_stub",
    "replay_recovery_alignment_runtime_v1_stub",
    "replay_recovery_trace_runtime_v1_stub",
    "replay_recovery_operational_summary_v1_stub",
    "replay_hash_validation_runtime_v5_stub",
    "replay_execution_integrity_runtime_v5_stub",
    "replay_snapshot_integrity_runtime_v5_stub",
    "replay_checkpoint_integrity_runtime_v5_stub",
    "replay_recovery_integrity_runtime_v5_stub",
    "replay_branch_integrity_runtime_v5_stub",
    "replay_temporal_integrity_runtime_v5_stub",
    "replay_lineage_integrity_runtime_v5_stub",
    "replay_integrity_consensus_runtime_v5_stub",
    "replay_integrity_repair_runtime_v5_stub",
    "replay_execution_runtime_engine_v1_stub",
    "replay_execution_snapshot_runtime_v1_stub",
    "replay_execution_journal_runtime_v1_stub",
    "replay_execution_locking_runtime_v1_stub",
    "replay_execution_integrity_runtime_v1_stub",
    "replay_execution_recovery_runtime_v1_stub",
    "replay_execution_compaction_runtime_v1_stub",
    "replay_execution_rotation_runtime_v1_stub",
    "replay_execution_archive_runtime_v1_stub",
    "replay_execution_temporal_runtime_v1_stub",
    "replay_execution_integrity_engine_v6_stub",
    "replay_execution_consistency_runtime_v4_stub",
    "replay_execution_audit_registry_v2_stub",
    "replay_execution_integrity_snapshot_v3_stub",
    "replay_execution_temporal_consistency_v4_stub",
    "replay_execution_corruption_guard_v3_stub",
    "replay_execution_integrity_repair_v2_stub",
    "replay_execution_recovery_alignment_v3_stub",
    "replay_execution_branch_integrity_v2_stub",
    "replay_execution_deterministic_guard_v4_stub",
    "replay_deterministic_audit_runtime_v3_stub",
    "replay_execution_consistency_guard_v5_stub",
    "replay_runtime_hash_alignment_v3_stub",
    "replay_runtime_temporal_reconciliation_v5_stub",
    "replay_execution_trace_runtime_v2_stub",
    "replay_runtime_snapshot_integrity_v4_stub",
    "replay_runtime_recovery_journal_v2_stub",
    "replay_runtime_repair_engine_v3_stub",
    "replay_runtime_rollback_alignment_v2_stub",
    "replay_runtime_execution_audit_v3_stub",
    "sqlite_runtime_temporal_store_v1_stub",
    "sqlite_runtime_snapshot_rotation_v1_stub",
    "sqlite_runtime_retention_runtime_v1_stub",
    "sqlite_runtime_compaction_engine_v1_stub",
    "sqlite_runtime_integrity_scanner_v3_stub",
    "sqlite_runtime_recovery_executor_v1_stub",
    "replay_runtime_checkpoint_index_v1_stub",
    "replay_runtime_lineage_persistence_v3_stub",
    "replay_runtime_archive_rebuilder_v1_stub",
    "replay_runtime_temporal_reconciliation_v2_stub",
    "sqlite_runtime_execution_store_v3_stub",
    "sqlite_runtime_replay_trace_store_v2_stub",
    "sqlite_runtime_temporal_index_v2_stub",
    "sqlite_runtime_integrity_index_v2_stub",
    "sqlite_runtime_recovery_runtime_v2_stub",
    "replay_runtime_snapshot_rotation_v3_stub",
    "replay_runtime_compaction_runtime_v3_stub",
    "replay_runtime_gc_runtime_v3_stub",
    "replay_runtime_storage_pressure_v2_stub",
    "replay_runtime_persistence_summary_v2_stub",
    "sqlite_runtime_replay_archive_v3_stub",
    "sqlite_runtime_temporal_runtime_v3_stub",
    "sqlite_runtime_integrity_runtime_v3_stub",
    "sqlite_runtime_recovery_runtime_v3_stub",
    "sqlite_runtime_checkpoint_runtime_v3_stub",
    "replay_runtime_compaction_v4_stub",
    "replay_runtime_gc_v4_stub",
    "replay_runtime_storage_rotation_v4_stub",
    "replay_runtime_storage_pressure_v3_stub",
    "replay_runtime_operational_summary_v3_stub",
]
