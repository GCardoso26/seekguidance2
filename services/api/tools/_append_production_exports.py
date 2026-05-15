"""Append production pilot exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    ("app/runtime/pilot_runtime/__init__.py", [
        ("pilot_runtime_operational_controller_v2", "pilot_runtime_operational_controller_v2_stub"),
        ("pilot_runtime_execution_supervisor_v2", "pilot_runtime_execution_supervisor_v2_stub"),
        ("pilot_runtime_health_orchestrator_v2", "pilot_runtime_health_orchestrator_v2_stub"),
        ("pilot_runtime_failure_domain_runtime_v2", "pilot_runtime_failure_domain_runtime_v2_stub"),
        ("pilot_runtime_recovery_governance_v2", "pilot_runtime_recovery_governance_v2_stub"),
        ("pilot_runtime_operational_budgeting_v2", "pilot_runtime_operational_budgeting_v2_stub"),
        ("pilot_runtime_deployment_readiness_v2", "pilot_runtime_deployment_readiness_v2_stub"),
        ("pilot_runtime_slo_runtime_v2", "pilot_runtime_slo_runtime_v2_stub"),
        ("pilot_runtime_operational_scoring_v2", "pilot_runtime_operational_scoring_v2_stub"),
        ("pilot_runtime_release_readiness_v2", "pilot_runtime_release_readiness_v2_stub"),
    ]),
    ("app/runtime/replay_federation/__init__.py", [
        ("federation_runtime_node_heartbeat_v1", "federation_runtime_node_heartbeat_v1_stub"),
        ("federation_runtime_node_discovery_v1", "federation_runtime_node_discovery_v1_stub"),
        ("federation_runtime_topology_registry_v1", "federation_runtime_topology_registry_v1_stub"),
        ("federation_runtime_reconciliation_v5", "federation_runtime_reconciliation_v5_stub"),
        ("federation_runtime_snapshot_exchange_v3", "federation_runtime_snapshot_exchange_v3_stub"),
        ("federation_runtime_consistency_protocol_v1", "federation_runtime_consistency_protocol_v1_stub"),
        ("federation_runtime_operational_health_v1", "federation_runtime_operational_health_v1_stub"),
        ("federation_runtime_failover_execution_v1", "federation_runtime_failover_execution_v1_stub"),
        ("federation_runtime_rollout_controller_v1", "federation_runtime_rollout_controller_v1_stub"),
        ("federation_runtime_drift_governance_v1", "federation_runtime_drift_governance_v1_stub"),
    ]),
    ("app/mobile_runtime/__init__.py", [
        ("mobile_runtime_operational_sync_v1", "mobile_runtime_operational_sync_v1_stub"),
        ("mobile_runtime_delta_transport_v3", "mobile_runtime_delta_transport_v3_stub"),
        ("mobile_runtime_checkpoint_rotation_v3", "mobile_runtime_checkpoint_rotation_v3_stub"),
        ("mobile_runtime_compact_snapshot_runtime_v1", "mobile_runtime_compact_snapshot_runtime_v1_stub"),
        ("mobile_runtime_local_cache_runtime_v1", "mobile_runtime_local_cache_runtime_v1_stub"),
        ("mobile_runtime_offline_recovery_v3", "mobile_runtime_offline_recovery_v3_stub"),
        ("mobile_runtime_sync_conflict_runtime_v5", "mobile_runtime_sync_conflict_runtime_v5_stub"),
        ("mobile_runtime_partial_replay_runtime_v2", "mobile_runtime_partial_replay_runtime_v2_stub"),
        ("mobile_runtime_operational_stability_v6", "mobile_runtime_operational_stability_v6_stub"),
        ("mobile_runtime_mobile_edge_alignment_v2", "mobile_runtime_mobile_edge_alignment_v2_stub"),
    ]),
    ("app/runtime/persistent_replay_runtime/__init__.py", [
        ("sqlite_runtime_temporal_store_v1", "sqlite_runtime_temporal_store_v1_stub"),
        ("sqlite_runtime_snapshot_rotation_v1", "sqlite_runtime_snapshot_rotation_v1_stub"),
        ("sqlite_runtime_retention_runtime_v1", "sqlite_runtime_retention_runtime_v1_stub"),
        ("sqlite_runtime_compaction_engine_v1", "sqlite_runtime_compaction_engine_v1_stub"),
        ("sqlite_runtime_integrity_scanner_v3", "sqlite_runtime_integrity_scanner_v3_stub"),
        ("sqlite_runtime_recovery_executor_v1", "sqlite_runtime_recovery_executor_v1_stub"),
        ("replay_runtime_checkpoint_index_v1", "replay_runtime_checkpoint_index_v1_stub"),
        ("replay_runtime_lineage_persistence_v3", "replay_runtime_lineage_persistence_v3_stub"),
        ("replay_runtime_archive_rebuilder_v1", "replay_runtime_archive_rebuilder_v1_stub"),
        ("replay_runtime_temporal_reconciliation_v2", "replay_runtime_temporal_reconciliation_v2_stub"),
    ]),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_otel_live_connector_v1", "runtime_otel_live_connector_v1_stub"),
        ("runtime_prometheus_live_bridge_v1", "runtime_prometheus_live_bridge_v1_stub"),
        ("runtime_trace_persistence_v1", "runtime_trace_persistence_v1_stub"),
        ("runtime_trace_sampling_engine_v2", "runtime_trace_sampling_engine_v2_stub"),
        ("runtime_operational_alerting_v1", "runtime_operational_alerting_v1_stub"),
        ("runtime_slo_tracking_v2", "runtime_slo_tracking_v2_stub"),
        ("runtime_incident_telemetry_v1", "runtime_incident_telemetry_v1_stub"),
        ("runtime_replay_trace_storage_v1", "runtime_replay_trace_storage_v1_stub"),
        ("runtime_lineage_trace_runtime_v1", "runtime_lineage_trace_runtime_v1_stub"),
        ("runtime_operational_dashboard_runtime_v1", "runtime_operational_dashboard_runtime_v1_stub"),
    ]),
    ("app/api/openapi_runtime_real/__init__.py", [
        ("runtime_operational_cicd_controller_v1", "runtime_operational_cicd_controller_v1_stub"),
        ("runtime_release_validation_runtime_v1", "runtime_release_validation_runtime_v1_stub"),
        ("runtime_schema_regression_runtime_v2", "runtime_schema_regression_runtime_v2_stub"),
        ("runtime_openapi_drift_runtime_v2", "runtime_openapi_drift_runtime_v2_stub"),
        ("runtime_contract_integrity_runtime_v1", "runtime_contract_integrity_runtime_v1_stub"),
        ("runtime_release_gate_runtime_v1", "runtime_release_gate_runtime_v1_stub"),
        ("runtime_operational_artifact_registry_v2", "runtime_operational_artifact_registry_v2_stub"),
        ("runtime_operational_hash_registry_v2", "runtime_operational_hash_registry_v2_stub"),
        ("runtime_ci_execution_runtime_v1", "runtime_ci_execution_runtime_v1_stub"),
        ("runtime_release_candidate_governance_v1", "runtime_release_candidate_governance_v1_stub"),
    ]),
    ("app/runtime/production_runtime/__init__.py", [
        ("runtime_operational_scheduler_v4", "runtime_operational_scheduler_v4_stub"),
        ("runtime_operational_queue_runtime_v2", "runtime_operational_queue_runtime_v2_stub"),
        ("runtime_operational_deadletter_runtime_v3", "runtime_operational_deadletter_runtime_v3_stub"),
        ("runtime_operational_backpressure_runtime_v3", "runtime_operational_backpressure_runtime_v3_stub"),
        ("runtime_operational_execution_runtime_v1", "runtime_operational_execution_runtime_v1_stub"),
        ("runtime_operational_recovery_runtime_v2", "runtime_operational_recovery_runtime_v2_stub"),
        ("runtime_operational_lifecycle_runtime_v2", "runtime_operational_lifecycle_runtime_v2_stub"),
        ("runtime_operational_stability_runtime_v2", "runtime_operational_stability_runtime_v2_stub"),
        ("runtime_operational_degradation_runtime_v2", "runtime_operational_degradation_runtime_v2_stub"),
        ("runtime_operational_governance_runtime_v2", "runtime_operational_governance_runtime_v2_stub"),
    ]),
]


def patch_init(rel: str, items: list[tuple[str, str]]) -> None:
    path = API / rel
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for mod, fn in items:
        imp = f"from .{mod} import {fn}\n"
        if f"import {fn}" not in text:
            idx = text.rfind("\n__all__")
            text = text[:idx] + imp + text[idx:] if idx >= 0 else text + imp
        entry = f'    "{fn}",\n'
        if entry not in text:
            close = text.rfind("\n]")
            text = text[:close] + entry + text[close:]
    path.write_text(text, encoding="utf-8")


for rel, items in PATCHES:
    patch_init(rel, items)

print("ok")
