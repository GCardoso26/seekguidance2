"""Append v10 exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "app/runtime/production_runtime/__init__.py",
        [
            ("runtime_lifecycle_engine_v10", "runtime_lifecycle_engine_v10_stub"),
            ("runtime_lifecycle_persistence_v1", "runtime_lifecycle_persistence_v1_stub"),
            ("runtime_execution_state_machine_v2", "runtime_execution_state_machine_v2_stub"),
            ("runtime_execution_transition_guard_v1", "runtime_execution_transition_guard_v1_stub"),
            ("runtime_execution_backpressure_runtime_v3", "runtime_execution_backpressure_runtime_v3_stub"),
            ("runtime_execution_deadletter_runtime_v2", "runtime_execution_deadletter_runtime_v2_stub"),
            ("runtime_execution_timeout_runtime_v2", "runtime_execution_timeout_runtime_v2_stub"),
            ("runtime_execution_retry_governance_v2", "runtime_execution_retry_governance_v2_stub"),
            ("runtime_execution_resource_budget_v3", "runtime_execution_resource_budget_v3_stub"),
            ("runtime_execution_operational_health_v2", "runtime_execution_operational_health_v2_stub"),
        ],
    ),
    (
        "app/runtime/persistent_replay_runtime/__init__.py",
        [
            ("replay_execution_integrity_engine_v6", "replay_execution_integrity_engine_v6_stub"),
            ("replay_execution_consistency_runtime_v4", "replay_execution_consistency_runtime_v4_stub"),
            ("replay_execution_audit_registry_v2", "replay_execution_audit_registry_v2_stub"),
            ("replay_execution_integrity_snapshot_v3", "replay_execution_integrity_snapshot_v3_stub"),
            ("replay_execution_temporal_consistency_v4", "replay_execution_temporal_consistency_v4_stub"),
            ("replay_execution_corruption_guard_v3", "replay_execution_corruption_guard_v3_stub"),
            ("replay_execution_integrity_repair_v2", "replay_execution_integrity_repair_v2_stub"),
            ("replay_execution_recovery_alignment_v3", "replay_execution_recovery_alignment_v3_stub"),
            ("replay_execution_branch_integrity_v2", "replay_execution_branch_integrity_v2_stub"),
            ("replay_execution_deterministic_guard_v4", "replay_execution_deterministic_guard_v4_stub"),
        ],
    ),
    (
        "app/runtime/replay_federation/__init__.py",
        [
            ("federation_supervision_runtime_v2", "federation_supervision_runtime_v2_stub"),
            ("federation_node_health_registry_v2", "federation_node_health_registry_v2_stub"),
            ("federation_rollout_orchestrator_v1", "federation_rollout_orchestrator_v1_stub"),
            ("federation_blast_radius_runtime_v3", "federation_blast_radius_runtime_v3_stub"),
            ("federation_partition_detector_v1", "federation_partition_detector_v1_stub"),
            ("federation_recovery_alignment_v2", "federation_recovery_alignment_v2_stub"),
            ("federation_consensus_runtime_v5", "federation_consensus_runtime_v5_stub"),
            ("federation_runtime_stability_v4", "federation_runtime_stability_v4_stub"),
            ("federation_runtime_drift_v3", "federation_runtime_drift_v3_stub"),
            ("federation_runtime_operational_summary_v4", "federation_runtime_operational_summary_v4_stub"),
        ],
    ),
    (
        "app/mobile_runtime/__init__.py",
        [
            ("mobile_runtime_sync_engine_v2", "mobile_runtime_sync_engine_v2_stub"),
            ("mobile_runtime_retry_scheduler_v1", "mobile_runtime_retry_scheduler_v1_stub"),
            ("mobile_runtime_conflict_registry_v2", "mobile_runtime_conflict_registry_v2_stub"),
            ("mobile_runtime_operational_queue_v1", "mobile_runtime_operational_queue_v1_stub"),
            ("mobile_runtime_snapshot_rotation_v2", "mobile_runtime_snapshot_rotation_v2_stub"),
            ("mobile_runtime_recovery_runtime_v2", "mobile_runtime_recovery_runtime_v2_stub"),
            ("mobile_runtime_storage_pressure_v1", "mobile_runtime_storage_pressure_v1_stub"),
            ("mobile_runtime_delta_compaction_v2", "mobile_runtime_delta_compaction_v2_stub"),
            ("mobile_runtime_sync_health_v2", "mobile_runtime_sync_health_v2_stub"),
            ("mobile_runtime_operational_summary_v3", "mobile_runtime_operational_summary_v3_stub"),
        ],
    ),
    (
        "app/runtime/runtime_incident_management/__init__.py",
        [
            ("runtime_incident_registry_v2", "runtime_incident_registry_v2_stub"),
            ("runtime_incident_state_machine_v1", "runtime_incident_state_machine_v1_stub"),
            ("runtime_incident_correlation_v1", "runtime_incident_correlation_v1_stub"),
            ("runtime_incident_response_runtime_v1", "runtime_incident_response_runtime_v1_stub"),
            ("runtime_incident_recovery_runtime_v2", "runtime_incident_recovery_runtime_v2_stub"),
            ("runtime_incident_slo_runtime_v2", "runtime_incident_slo_runtime_v2_stub"),
            ("runtime_incident_replay_alignment_v1", "runtime_incident_replay_alignment_v1_stub"),
            ("runtime_incident_operational_summary_v2", "runtime_incident_operational_summary_v2_stub"),
            ("runtime_incident_drift_runtime_v1", "runtime_incident_drift_runtime_v1_stub"),
            ("runtime_incident_governance_runtime_v1", "runtime_incident_governance_runtime_v1_stub"),
        ],
    ),
    (
        "app/observability/runtime_exporters/__init__.py",
        [
            ("runtime_trace_buffer_v7", "runtime_trace_buffer_v7_stub"),
            ("runtime_metrics_registry_v7", "runtime_metrics_registry_v7_stub"),
            ("runtime_operational_histograms_v7", "runtime_operational_histograms_v7_stub"),
            ("runtime_trace_correlation_v5", "runtime_trace_correlation_v5_stub"),
            ("runtime_operational_sampling_v4", "runtime_operational_sampling_v4_stub"),
            ("runtime_slo_metrics_runtime_v3", "runtime_slo_metrics_runtime_v3_stub"),
            ("runtime_incident_metrics_runtime_v2", "runtime_incident_metrics_runtime_v2_stub"),
            ("federation_runtime_metrics_v6", "federation_runtime_metrics_v6_stub"),
            ("mobile_runtime_metrics_v6", "mobile_runtime_metrics_v6_stub"),
            ("replay_runtime_trace_alignment_v5", "replay_runtime_trace_alignment_v5_stub"),
        ],
    ),
    (
        "app/api/openapi_runtime_real/__init__.py",
        [
            ("runtime_openapi_enforcement_v10", "runtime_openapi_enforcement_v10_stub"),
            ("runtime_openapi_ci_pipeline_v3", "runtime_openapi_ci_pipeline_v3_stub"),
            ("runtime_contract_regression_v2", "runtime_contract_regression_v2_stub"),
            ("runtime_openapi_drift_scoring_v2", "runtime_openapi_drift_scoring_v2_stub"),
            ("runtime_contract_integrity_v2", "runtime_contract_integrity_v2_stub"),
            ("runtime_openapi_bundle_registry_v2", "runtime_openapi_bundle_registry_v2_stub"),
            ("runtime_openapi_release_snapshot_v1", "runtime_openapi_release_snapshot_v1_stub"),
            ("runtime_contract_hash_registry_v2", "runtime_contract_hash_registry_v2_stub"),
            ("runtime_contract_gate_runtime_v1", "runtime_contract_gate_runtime_v1_stub"),
            ("runtime_openapi_operational_summary_v2", "runtime_openapi_operational_summary_v2_stub"),
        ],
    ),
    (
        "app/runtime/pilot_runtime/__init__.py",
        [
            ("pilot_runtime_execution_readiness_v5", "pilot_runtime_execution_readiness_v5_stub"),
            ("pilot_runtime_blast_radius_v4", "pilot_runtime_blast_radius_v4_stub"),
            ("pilot_runtime_operational_limits_v4", "pilot_runtime_operational_limits_v4_stub"),
            ("pilot_runtime_safety_runtime_v3", "pilot_runtime_safety_runtime_v3_stub"),
            ("pilot_runtime_governance_runtime_v4", "pilot_runtime_governance_runtime_v4_stub"),
            ("pilot_runtime_recovery_runtime_v4", "pilot_runtime_recovery_runtime_v4_stub"),
            ("pilot_runtime_deployment_alignment_v2", "pilot_runtime_deployment_alignment_v2_stub"),
            ("pilot_runtime_federation_scope_v2", "pilot_runtime_federation_scope_v2_stub"),
            ("pilot_runtime_mobile_scope_v2", "pilot_runtime_mobile_scope_v2_stub"),
            ("pilot_runtime_operational_summary_v5", "pilot_runtime_operational_summary_v5_stub"),
        ],
    ),
]


def patch_init(rel: str, items: list[tuple[str, str]]) -> None:
    path = API / rel
    text = path.read_text(encoding="utf-8")
    for mod, fn in items:
        imp = f"from .{mod} import {fn}\n"
        if imp not in text:
            idx = text.find("\n__all__")
            if idx < 0:
                text += imp
            else:
                text = text[:idx] + imp + text[idx:]
        entry = f'    "{fn}",\n'
        if entry not in text:
            close = text.rfind("\n]")
            text = text[:close] + entry + text[close:]
    path.write_text(text, encoding="utf-8")


for rel, items in PATCHES:
    if (API / rel).is_file():
        patch_init(rel, items)

print("ok")
