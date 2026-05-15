"""Append v5 exports safely."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]


def append_exports(rel: str, pairs: list[tuple[str, str]]) -> None:
    path = API / rel
    text = path.read_text(encoding="utf-8")
    for mod, fn in pairs:
        imp = f"from .{mod} import {fn}\n"
        if imp not in text:
            text = text.replace("__all__ = [", imp + "__all__ = [", 1)
        entry = f'    "{fn}",\n'
        if f'"{fn}"' not in text:
            text = text.replace("\n]\n", f"{entry}]\n", 1)
    path.write_text(text, encoding="utf-8")
    print("patched", rel)


PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "app/runtime/production_runtime/__init__.py",
        [
            ("runtime_execution_orchestrator_v3", "runtime_execution_orchestrator_v3_stub"),
            ("runtime_execution_queue_v2", "runtime_execution_queue_v2_stub"),
            ("runtime_execution_scheduler_v3", "runtime_execution_scheduler_v3_stub"),
            ("runtime_execution_budget_controller_v2", "runtime_execution_budget_controller_v2_stub"),
            ("runtime_execution_state_machine_v2", "runtime_execution_state_machine_v2_stub"),
            ("runtime_execution_recovery_router_v2", "runtime_execution_recovery_router_v2_stub"),
            ("runtime_execution_degradation_router_v2", "runtime_execution_degradation_router_v2_stub"),
            ("runtime_execution_failure_domain_v2", "runtime_execution_failure_domain_v2_stub"),
            ("runtime_execution_stability_controller_v2", "runtime_execution_stability_controller_v2_stub"),
            ("runtime_execution_operational_summary_v2", "runtime_execution_operational_summary_v2_stub"),
        ],
    ),
    (
        "app/runtime/runtime_alignment/__init__.py",
        [("deterministic_replay_executor_v2", "deterministic_replay_executor_v2_stub")],
    ),
    (
        "app/runtime/replay_federation/__init__.py",
        [
            ("federation_supervisor_runtime_v2", "federation_supervisor_runtime_v2_stub"),
            ("federation_node_health_runtime_v2", "federation_node_health_runtime_v2_stub"),
            ("federation_runtime_balancer_v2", "federation_runtime_balancer_v2_stub"),
            ("federation_runtime_failover_router_v2", "federation_runtime_failover_router_v2_stub"),
            ("federation_runtime_consensus_guard_v2", "federation_runtime_consensus_guard_v2_stub"),
            ("federation_runtime_execution_monitor_v2", "federation_runtime_execution_monitor_v2_stub"),
            ("federation_runtime_recovery_supervisor_v2", "federation_runtime_recovery_supervisor_v2_stub"),
            ("federation_runtime_shard_registry_v2", "federation_runtime_shard_registry_v2_stub"),
            ("federation_runtime_coordination_v2", "federation_runtime_coordination_v2_stub"),
            ("federation_runtime_operational_state_v2", "federation_runtime_operational_state_v2_stub"),
        ],
    ),
    (
        "app/api/openapi_runtime_real/__init__.py",
        [
            ("openapi_runtime_exporter_v2", "openapi_runtime_exporter_v2_stub"),
            ("openapi_runtime_diff_engine_v2", "openapi_runtime_diff_engine_v2_stub"),
            ("openapi_runtime_contract_guard_v2", "openapi_runtime_contract_guard_v2_stub"),
            ("openapi_runtime_schema_alignment_v2", "openapi_runtime_schema_alignment_v2_stub"),
            ("openapi_runtime_regression_v2", "openapi_runtime_regression_v2_stub"),
            ("openapi_runtime_snapshot_history_v2", "openapi_runtime_snapshot_history_v2_stub"),
            ("openapi_runtime_ci_enforcement_v2", "openapi_runtime_ci_enforcement_v2_stub"),
            ("runtime_contract_drift_detection_v2", "runtime_contract_drift_detection_v2_stub"),
            ("runtime_openapi_operational_summary_v2", "runtime_openapi_operational_summary_v2_stub"),
            ("ts_contract_runtime_alignment_v2", "ts_contract_runtime_alignment_v2_stub"),
        ],
    ),
    (
        "app/mobile_runtime/__init__.py",
        [
            ("mobile_runtime_sync_engine_v4", "mobile_runtime_sync_engine_v4_stub"),
            ("mobile_runtime_delta_transport_v3", "mobile_runtime_delta_transport_v3_stub"),
            ("mobile_runtime_reconciliation_engine_v4", "mobile_runtime_reconciliation_engine_v4_stub"),
            ("mobile_runtime_retry_controller_v3", "mobile_runtime_retry_controller_v3_stub"),
            ("mobile_runtime_conflict_scoring_v2", "mobile_runtime_conflict_scoring_v2_stub"),
            ("mobile_runtime_failover_router_v2", "mobile_runtime_failover_router_v2_stub"),
            ("mobile_runtime_snapshot_sync_v3", "mobile_runtime_snapshot_sync_v3_stub"),
            ("mobile_runtime_checkpoint_transport_v2", "mobile_runtime_checkpoint_transport_v2_stub"),
            ("mobile_runtime_operational_sync_summary_v2", "mobile_runtime_operational_sync_summary_v2_stub"),
        ],
    ),
    (
        "app/offline_runtime/__init__.py",
        [("offline_runtime_queue_runtime_v2", "offline_runtime_queue_runtime_v2_stub")],
    ),
    (
        "app/observability/runtime_exporters/__init__.py",
        [
            ("runtime_otel_connector_v3", "runtime_otel_connector_v3_stub"),
            ("runtime_prometheus_bridge_v3", "runtime_prometheus_bridge_v3_stub"),
            ("runtime_trace_persistence_v2", "runtime_trace_persistence_v2_stub"),
            ("replay_trace_storage_runtime_v2", "replay_trace_storage_runtime_v2_stub"),
            ("runtime_metrics_aggregation_v3", "runtime_metrics_aggregation_v3_stub"),
            ("runtime_slo_enforcement_v2", "runtime_slo_enforcement_v2_stub"),
            ("runtime_alert_router_v2", "runtime_alert_router_v2_stub"),
            ("runtime_incident_metrics_v2", "runtime_incident_metrics_v2_stub"),
            ("runtime_trace_alignment_v5", "runtime_trace_alignment_v5_stub"),
            ("runtime_observability_operational_summary_v2", "runtime_observability_operational_summary_v2_stub"),
        ],
    ),
    (
        "app/runtime/pilot_runtime/__init__.py",
        [
            ("pilot_runtime_deployment_readiness_v3", "pilot_runtime_deployment_readiness_v3_stub"),
            ("pilot_runtime_health_gates_v2", "pilot_runtime_health_gates_v2_stub"),
            ("pilot_runtime_execution_limits_v3", "pilot_runtime_execution_limits_v3_stub"),
            ("pilot_runtime_operational_scope_v2", "pilot_runtime_operational_scope_v2_stub"),
            ("pilot_runtime_dataset_controls_v2", "pilot_runtime_dataset_controls_v2_stub"),
            ("pilot_runtime_observability_bridge_v2", "pilot_runtime_observability_bridge_v2_stub"),
            ("pilot_runtime_recovery_controls_v2", "pilot_runtime_recovery_controls_v2_stub"),
            ("pilot_runtime_federation_scope_v2", "pilot_runtime_federation_scope_v2_stub"),
            ("pilot_runtime_mobile_scope_v3", "pilot_runtime_mobile_scope_v3_stub"),
            ("pilot_runtime_release_summary_v2", "pilot_runtime_release_summary_v2_stub"),
        ],
    ),
]

# persistent_replay - large init, append replay modules
PERSIST = [
    ("replay_execution_checkpoint_runtime_v2", "replay_execution_checkpoint_runtime_v2_stub"),
    ("replay_execution_state_alignment_v2", "replay_execution_state_alignment_v2_stub"),
    ("replay_execution_temporal_locking_v2", "replay_execution_temporal_locking_v2_stub"),
    ("replay_execution_reconciliation_v2", "replay_execution_reconciliation_v2_stub"),
    ("replay_execution_branch_control_v2", "replay_execution_branch_control_v2_stub"),
    ("replay_execution_snapshot_runtime_v2", "replay_execution_snapshot_runtime_v2_stub"),
    ("replay_execution_integrity_runtime_v2", "replay_execution_integrity_runtime_v2_stub"),
    ("replay_execution_consistency_runtime_v2", "replay_execution_consistency_runtime_v2_stub"),
    ("replay_execution_operational_summary_v2", "replay_execution_operational_summary_v2_stub"),
    ("replay_snapshot_sqlite_runtime_v2", "replay_snapshot_sqlite_runtime_v2_stub"),
    ("replay_lineage_sqlite_runtime_v2", "replay_lineage_sqlite_runtime_v2_stub"),
    ("replay_integrity_sqlite_runtime_v2", "replay_integrity_sqlite_runtime_v2_stub"),
    ("replay_checkpoint_sqlite_runtime_v2", "replay_checkpoint_sqlite_runtime_v2_stub"),
    ("replay_archive_filesystem_runtime_v2", "replay_archive_filesystem_runtime_v2_stub"),
    ("replay_compaction_runtime_v3", "replay_compaction_runtime_v3_stub"),
    ("replay_gc_runtime_v3", "replay_gc_runtime_v3_stub"),
    ("replay_storage_rotation_runtime_v2", "replay_storage_rotation_runtime_v2_stub"),
    ("replay_storage_integrity_scanner_v3", "replay_storage_integrity_scanner_v3_stub"),
    ("replay_storage_operational_summary_v2", "replay_storage_operational_summary_v2_stub"),
]
PATCHES.append(("app/runtime/persistent_replay_runtime/__init__.py", PERSIST))

for rel, pairs in PATCHES:
    append_exports(rel, pairs)
