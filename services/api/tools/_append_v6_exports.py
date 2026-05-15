"""Append exports sprint v6 (safe)."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "app/runtime/production_runtime/__init__.py",
        [
            ("runtime_execution_engine_v6", "enqueue_runtime_execution"),
            ("runtime_execution_queue_v3", "runtime_execution_queue_v3_stub"),
            ("runtime_execution_budget_engine_v3", "runtime_execution_budget_engine_v3_stub"),
            ("runtime_execution_state_machine_v3", "runtime_execution_state_machine_v3_stub"),
            ("runtime_execution_failure_router_v3", "runtime_execution_failure_router_v3_stub"),
            ("runtime_execution_recovery_router_v3", "runtime_execution_recovery_router_v3_stub"),
            ("runtime_execution_backpressure_v3", "runtime_execution_backpressure_v3_stub"),
            ("runtime_execution_priority_runtime_v3", "runtime_execution_priority_runtime_v3_stub"),
            ("runtime_execution_operational_summary_v3", "runtime_execution_operational_summary_v3_stub"),
        ],
    ),
    (
        "app/runtime/persistent_replay_runtime/__init__.py",
        [
            ("replay_execution_core_v6", "execute_deterministic_replay_runtime"),
            ("replay_execution_runtime_v3", "replay_execution_runtime_v3_stub"),
            ("replay_execution_checkpoint_runtime_v3", "replay_execution_checkpoint_runtime_v3_stub"),
            ("replay_execution_temporal_runtime_v3", "replay_execution_temporal_runtime_v3_stub"),
            ("replay_execution_consistency_runtime_v3", "replay_execution_consistency_runtime_v3_stub"),
            ("replay_execution_recovery_runtime_v3", "replay_execution_recovery_runtime_v3_stub"),
            ("replay_execution_lock_runtime_v3", "replay_execution_lock_runtime_v3_stub"),
            ("replay_execution_journal_runtime_v3", "replay_execution_journal_runtime_v3_stub"),
            ("replay_execution_compaction_runtime_v3", "replay_execution_compaction_runtime_v3_stub"),
            ("replay_execution_branch_runtime_v3", "replay_execution_branch_runtime_v3_stub"),
            ("replay_execution_integrity_runtime_v3", "replay_execution_integrity_runtime_v3_stub"),
            ("sqlite_replay_execution_store_v2", "sqlite_replay_execution_store_v2_stub"),
            ("sqlite_runtime_replay_journal_v2", "sqlite_runtime_replay_journal_v2_stub"),
            ("sqlite_runtime_temporal_store_v2", "sqlite_runtime_temporal_store_v2_stub"),
            ("sqlite_runtime_branch_store_v2", "sqlite_runtime_branch_store_v2_stub"),
            ("filesystem_replay_compaction_runtime_v2", "filesystem_replay_compaction_runtime_v2_stub"),
            ("filesystem_runtime_archive_rotation_v2", "filesystem_runtime_archive_rotation_v2_stub"),
            ("replay_runtime_integrity_scanner_v3", "replay_runtime_integrity_scanner_v3_stub"),
            ("replay_runtime_storage_consistency_v3", "replay_runtime_storage_consistency_v3_stub"),
        ],
    ),
    (
        "app/runtime/replay_federation/__init__.py",
        [
            ("federation_node_registry_v6", "federation_health_summary"),
            ("federation_supervisor_runtime_v3", "federation_supervisor_runtime_v3_stub"),
            ("federation_node_runtime_v3", "federation_node_runtime_v3_stub"),
            ("federation_runtime_health_v3", "federation_runtime_health_v3_stub"),
            ("federation_runtime_budget_v3", "federation_runtime_budget_v3_stub"),
            ("federation_runtime_distribution_v3", "federation_runtime_distribution_v3_stub"),
            ("federation_runtime_reconciliation_v3", "federation_runtime_reconciliation_v3_stub"),
            ("federation_runtime_consensus_v5", "federation_runtime_consensus_v5_stub"),
            ("federation_runtime_failover_v5", "federation_runtime_failover_v5_stub"),
            ("federation_runtime_alignment_v5", "federation_runtime_alignment_v5_stub"),
            ("federation_runtime_trace_runtime_v3", "federation_runtime_trace_runtime_v3_stub"),
        ],
    ),
    (
        "app/api/openapi_runtime_real/__init__.py",
        [
            ("runtime_openapi_diff_engine_v2", "runtime_openapi_diff_engine_v2_stub"),
            ("runtime_openapi_contract_guard_v2", "runtime_openapi_contract_guard_v2_stub"),
            ("runtime_openapi_schema_integrity_v2", "runtime_openapi_schema_integrity_v2_stub"),
            ("runtime_openapi_regression_runtime_v2", "runtime_openapi_regression_runtime_v2_stub"),
            ("runtime_openapi_ts_alignment_v2", "runtime_openapi_ts_alignment_v2_stub"),
            ("runtime_openapi_ci_summary_v2", "runtime_openapi_ci_summary_v2_stub"),
        ],
    ),
    (
        "app/observability/runtime_exporters/__init__.py",
        [
            ("runtime_otel_partial_connector_v3", "runtime_otel_partial_connector_v3_stub"),
            ("runtime_prometheus_partial_connector_v3", "runtime_prometheus_partial_connector_v3_stub"),
            ("runtime_trace_correlation_v5", "runtime_trace_correlation_v5_stub"),
            ("runtime_metrics_buffer_v3", "runtime_metrics_buffer_v3_stub"),
            ("runtime_metrics_persistence_v3", "runtime_metrics_persistence_v3_stub"),
            ("runtime_latency_histograms_v3", "runtime_latency_histograms_v3_stub"),
            ("runtime_slo_tracking_v3", "runtime_slo_tracking_v3_stub"),
            ("runtime_incident_tracking_v3", "runtime_incident_tracking_v3_stub"),
            ("distributed_runtime_trace_bridge_v3", "distributed_runtime_trace_bridge_v3_stub"),
            ("replay_runtime_metrics_aggregation_v3", "replay_runtime_metrics_aggregation_v3_stub"),
        ],
    ),
    (
        "app/runtime/runtime_incident_management/__init__.py",
        [
            ("runtime_incident_orchestrator_v2", "runtime_incident_orchestrator_v2_stub"),
            ("runtime_incident_recovery_runtime_v2", "runtime_incident_recovery_runtime_v2_stub"),
            ("runtime_incident_repair_runtime_v2", "runtime_incident_repair_runtime_v2_stub"),
            ("runtime_incident_escalation_runtime_v2", "runtime_incident_escalation_runtime_v2_stub"),
            ("runtime_incident_timeline_runtime_v2", "runtime_incident_timeline_runtime_v2_stub"),
            ("runtime_incident_replay_runtime_v2", "runtime_incident_replay_runtime_v2_stub"),
            ("runtime_incident_diagnostics_runtime_v2", "runtime_incident_diagnostics_runtime_v2_stub"),
            ("runtime_incident_consistency_runtime_v2", "runtime_incident_consistency_runtime_v2_stub"),
            ("runtime_incident_reconciliation_runtime_v2", "runtime_incident_reconciliation_runtime_v2_stub"),
            ("runtime_incident_governance_runtime_v2", "runtime_incident_governance_runtime_v2_stub"),
        ],
    ),
    (
        "app/mobile_runtime/__init__.py",
        [
            ("mobile_runtime_sync_engine_v5", "mobile_runtime_sync_engine_v5_stub"),
            ("mobile_runtime_retry_orchestrator_v5", "mobile_runtime_retry_orchestrator_v5_stub"),
            ("mobile_runtime_conflict_runtime_v5", "mobile_runtime_conflict_runtime_v5_stub"),
            ("mobile_runtime_partial_sync_v5", "mobile_runtime_partial_sync_v5_stub"),
            ("mobile_runtime_checkpoint_sync_v5", "mobile_runtime_checkpoint_sync_v5_stub"),
            ("mobile_runtime_resilience_runtime_v5", "mobile_runtime_resilience_runtime_v5_stub"),
            ("mobile_runtime_failover_runtime_v5", "mobile_runtime_failover_runtime_v5_stub"),
            ("mobile_runtime_alignment_runtime_v5", "mobile_runtime_alignment_runtime_v5_stub"),
        ],
    ),
    (
        "app/offline_runtime/__init__.py",
        [
            ("offline_runtime_queue_runtime_v3", "offline_runtime_queue_runtime_v3_stub"),
            ("offline_runtime_reconciliation_runtime_v3", "offline_runtime_reconciliation_runtime_v3_stub"),
        ],
    ),
    (
        "app/mobile_security/__init__.py",
        [("mobile_sync_integrity_runtime_v4", "mobile_sync_integrity_runtime_v4_stub")],
    ),
    (
        "app/runtime/pilot_runtime/__init__.py",
        [
            ("pilot_runtime_execution_v3", "pilot_runtime_execution_v3_stub"),
            ("pilot_runtime_limits_v3", "pilot_runtime_limits_v3_stub"),
            ("pilot_runtime_dataset_scope_v3", "pilot_runtime_dataset_scope_v3_stub"),
            ("pilot_runtime_observability_v3", "pilot_runtime_observability_v3_stub"),
            ("pilot_runtime_alignment_v3", "pilot_runtime_alignment_v3_stub"),
            ("pilot_runtime_recovery_v3", "pilot_runtime_recovery_v3_stub"),
            ("pilot_runtime_governance_v3", "pilot_runtime_governance_v3_stub"),
            ("pilot_runtime_operational_health_v3", "pilot_runtime_operational_health_v3_stub"),
            ("pilot_runtime_readiness_summary_v3", "pilot_runtime_readiness_summary_v3_stub"),
        ],
    ),
]


def append_exports(rel: str, pairs: list[tuple[str, str]]) -> None:
    path = API / rel
    text = path.read_text(encoding="utf-8")
    for mod, fn in pairs:
        if "production_runtime" in rel:
            imp = f"from app.runtime.production_runtime.{mod} import {fn}\n"
        elif "persistent_replay_runtime" in rel:
            imp = f"from app.runtime.persistent_replay_runtime.{mod} import {fn}\n"
        elif "replay_federation" in rel:
            imp = f"from app.runtime.replay_federation.{mod} import {fn}\n"
        elif "openapi_runtime_real" in rel:
            imp = f"from app.api.openapi_runtime_real.{mod} import {fn}\n"
        elif "runtime_exporters" in rel:
            imp = f"from app.observability.runtime_exporters.{mod} import {fn}\n"
        elif "mobile_runtime" in rel and "mobile_security" not in rel:
            imp = f"from app.mobile_runtime.{mod} import {fn}\n"
        elif "offline_runtime" in rel:
            imp = f"from app.offline_runtime.{mod} import {fn}\n"
        elif "mobile_security" in rel:
            imp = f"from app.mobile_security.{mod} import {fn}\n"
        elif "pilot_runtime" in rel:
            imp = f"from .{mod} import {fn}\n"
        elif "runtime_incident_management" in rel:
            imp = f"from .{mod} import {fn}\n"
        else:
            imp = f"from .{mod} import {fn}\n"
        if imp not in text and f"from .{mod} import" not in text:
            text = text.replace("__all__ = [", imp + "__all__ = [", 1)
        entry = f'    "{fn}",\n'
        if f'"{fn}"' not in text:
            text = text.replace("\n]\n", f"{entry}]\n", 1)
    path.write_text(text, encoding="utf-8")
    print("patched", rel)


for rel, pairs in PATCHES:
    append_exports(rel, pairs)
