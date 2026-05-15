"""Append RC exports (safe rfind)."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "app/runtime/production_runtime/__init__.py",
        [
            ("runtime_operational_controller_v1", "runtime_operational_controller_v1_stub"),
            ("runtime_execution_supervisor_v4", "runtime_execution_supervisor_v4_stub"),
            ("runtime_operational_reconciliation_v1", "runtime_operational_reconciliation_v1_stub"),
            ("runtime_execution_priority_runtime_v2", "runtime_execution_priority_runtime_v2_stub"),
            ("runtime_runtime_capacity_runtime_v2", "runtime_runtime_capacity_runtime_v2_stub"),
            ("runtime_execution_backlog_runtime_v2", "runtime_execution_backlog_runtime_v2_stub"),
            ("runtime_operational_stability_runtime_v2", "runtime_operational_stability_runtime_v2_stub"),
            ("runtime_operational_health_engine_v3", "runtime_operational_health_engine_v3_stub"),
            ("runtime_operational_safety_runtime_v2", "runtime_operational_safety_runtime_v2_stub"),
            ("runtime_operational_release_summary_v1", "runtime_operational_release_summary_v1_stub"),
        ],
    ),
    (
        "app/runtime/persistent_replay_runtime/__init__.py",
        [
            ("replay_deterministic_audit_runtime_v3", "replay_deterministic_audit_runtime_v3_stub"),
            ("replay_execution_consistency_guard_v5", "replay_execution_consistency_guard_v5_stub"),
            ("replay_runtime_hash_alignment_v3", "replay_runtime_hash_alignment_v3_stub"),
            ("replay_runtime_temporal_reconciliation_v5", "replay_runtime_temporal_reconciliation_v5_stub"),
            ("replay_execution_trace_runtime_v2", "replay_execution_trace_runtime_v2_stub"),
            ("replay_runtime_snapshot_integrity_v4", "replay_runtime_snapshot_integrity_v4_stub"),
            ("replay_runtime_recovery_journal_v2", "replay_runtime_recovery_journal_v2_stub"),
            ("replay_runtime_repair_engine_v3", "replay_runtime_repair_engine_v3_stub"),
            ("replay_runtime_rollback_alignment_v2", "replay_runtime_rollback_alignment_v2_stub"),
            ("replay_runtime_execution_audit_v3", "replay_runtime_execution_audit_v3_stub"),
        ],
    ),
    (
        "app/runtime/replay_federation/__init__.py",
        [
            ("federation_operational_supervisor_v1", "federation_operational_supervisor_v1_stub"),
            ("federation_runtime_topology_engine_v2", "federation_runtime_topology_engine_v2_stub"),
            ("federation_runtime_reconciliation_v3", "federation_runtime_reconciliation_v3_stub"),
            ("federation_runtime_health_engine_v2", "federation_runtime_health_engine_v2_stub"),
            ("federation_runtime_failover_alignment_v3", "federation_runtime_failover_alignment_v3_stub"),
            ("federation_runtime_capacity_v2", "federation_runtime_capacity_v2_stub"),
            ("federation_runtime_operational_guard_v2", "federation_runtime_operational_guard_v2_stub"),
            ("federation_runtime_consensus_repair_v2", "federation_runtime_consensus_repair_v2_stub"),
            ("federation_runtime_degraded_nodes_v2", "federation_runtime_degraded_nodes_v2_stub"),
            ("federation_runtime_release_summary_v2", "federation_runtime_release_summary_v2_stub"),
        ],
    ),
    (
        "app/runtime/runtime_trust_scoring/__init__.py",
        [("runtime_operational_trust_engine_v2", "runtime_operational_trust_engine_v2_stub")],
    ),
    (
        "app/runtime/runtime_execution_quotas/__init__.py",
        [("runtime_execution_quota_runtime_v3", "runtime_execution_quota_runtime_v3_stub")],
    ),
    (
        "app/runtime/runtime_resource_governance/__init__.py",
        [
            ("runtime_resource_pressure_engine_v3", "runtime_resource_pressure_engine_v3_stub"),
            ("runtime_operational_budget_engine_v2", "runtime_operational_budget_engine_v2_stub"),
        ],
    ),
    (
        "app/runtime/execution_governance_v2/__init__.py",
        [
            ("runtime_governance_alignment_runtime_v2", "runtime_governance_alignment_runtime_v2_stub"),
            ("runtime_execution_policy_runtime_v2", "runtime_execution_policy_runtime_v2_stub"),
            ("runtime_operational_limits_runtime_v3", "runtime_operational_limits_runtime_v3_stub"),
            ("runtime_runtime_safety_score_v2", "runtime_runtime_safety_score_v2_stub"),
            ("runtime_execution_fairness_runtime_v1", "runtime_execution_fairness_runtime_v1_stub"),
            ("runtime_governance_operational_summary_v2", "runtime_governance_operational_summary_v2_stub"),
        ],
    ),
    (
        "app/mobile_runtime/__init__.py",
        [
            ("mobile_runtime_operational_scheduler_v1", "mobile_runtime_operational_scheduler_v1_stub"),
            ("mobile_runtime_reconciliation_engine_v3", "mobile_runtime_reconciliation_engine_v3_stub"),
            ("mobile_runtime_sync_pressure_v2", "mobile_runtime_sync_pressure_v2_stub"),
            ("mobile_runtime_retry_budget_v2", "mobile_runtime_retry_budget_v2_stub"),
            ("mobile_runtime_operational_stability_v3", "mobile_runtime_operational_stability_v3_stub"),
            ("mobile_runtime_trace_alignment_v2", "mobile_runtime_trace_alignment_v2_stub"),
            ("mobile_runtime_partial_recovery_v3", "mobile_runtime_partial_recovery_v3_stub"),
            ("mobile_runtime_storage_rotation_v3", "mobile_runtime_storage_rotation_v3_stub"),
        ],
    ),
    (
        "app/offline_runtime/__init__.py",
        [
            ("offline_runtime_operational_consistency_v3", "offline_runtime_operational_consistency_v3_stub"),
            ("offline_runtime_replay_recovery_v2", "offline_runtime_replay_recovery_v2_stub"),
        ],
    ),
    (
        "app/runtime/runtime_incident_management/__init__.py",
        [
            ("runtime_incident_operational_engine_v2", "runtime_incident_operational_engine_v2_stub"),
            ("runtime_incident_recovery_alignment_v3", "runtime_incident_recovery_alignment_v3_stub"),
            ("runtime_incident_operational_timelines_v2", "runtime_incident_operational_timelines_v2_stub"),
            ("runtime_incident_federation_alignment_v2", "runtime_incident_federation_alignment_v2_stub"),
            ("runtime_incident_replay_alignment_v2", "runtime_incident_replay_alignment_v2_stub"),
            ("runtime_incident_operational_scoring_v2", "runtime_incident_operational_scoring_v2_stub"),
            ("runtime_incident_recovery_orchestrator_v2", "runtime_incident_recovery_orchestrator_v2_stub"),
            ("runtime_incident_slo_alignment_v2", "runtime_incident_slo_alignment_v2_stub"),
            ("runtime_incident_runtime_guard_v2", "runtime_incident_runtime_guard_v2_stub"),
            ("runtime_incident_release_summary_v2", "runtime_incident_release_summary_v2_stub"),
        ],
    ),
    (
        "app/observability/runtime_exporters/__init__.py",
        [
            ("runtime_operational_metrics_engine_v8", "runtime_operational_metrics_engine_v8_stub"),
            ("runtime_operational_histograms_v8", "runtime_operational_histograms_v8_stub"),
            ("runtime_operational_sampling_v5", "runtime_operational_sampling_v5_stub"),
            ("runtime_trace_correlation_v6", "runtime_trace_correlation_v6_stub"),
            ("runtime_operational_slo_metrics_v4", "runtime_operational_slo_metrics_v4_stub"),
            ("runtime_federation_operational_metrics_v7", "runtime_federation_operational_metrics_v7_stub"),
            ("runtime_mobile_operational_metrics_v7", "runtime_mobile_operational_metrics_v7_stub"),
            ("runtime_replay_operational_metrics_v6", "runtime_replay_operational_metrics_v6_stub"),
            ("runtime_operational_dashboard_bridge_v3", "runtime_operational_dashboard_bridge_v3_stub"),
            ("runtime_operational_telemetry_summary_v2", "runtime_operational_telemetry_summary_v2_stub"),
        ],
    ),
    (
        "app/api/openapi_runtime_real/__init__.py",
        [
            ("runtime_operational_cicd_pipeline_v4", "runtime_operational_cicd_pipeline_v4_stub"),
            ("runtime_operational_contract_alignment_v3", "runtime_operational_contract_alignment_v3_stub"),
            ("runtime_openapi_release_registry_v2", "runtime_openapi_release_registry_v2_stub"),
            ("runtime_openapi_operational_diff_v2", "runtime_openapi_operational_diff_v2_stub"),
            ("runtime_operational_regression_runtime_v2", "runtime_operational_regression_runtime_v2_stub"),
            ("runtime_openapi_runtime_integrity_v2", "runtime_openapi_runtime_integrity_v2_stub"),
            ("runtime_contract_operational_summary_v3", "runtime_contract_operational_summary_v3_stub"),
            ("runtime_openapi_release_hashing_v2", "runtime_openapi_release_hashing_v2_stub"),
            ("runtime_operational_contract_drift_v3", "runtime_operational_contract_drift_v3_stub"),
            ("runtime_operational_release_gate_v2", "runtime_operational_release_gate_v2_stub"),
        ],
    ),
    (
        "app/runtime/pilot_runtime/__init__.py",
        [
            ("pilot_runtime_operational_release_v1", "pilot_runtime_operational_release_v1_stub"),
            ("pilot_runtime_recovery_alignment_v5", "pilot_runtime_recovery_alignment_v5_stub"),
            ("pilot_runtime_federation_limits_v3", "pilot_runtime_federation_limits_v3_stub"),
            ("pilot_runtime_mobile_alignment_v3", "pilot_runtime_mobile_alignment_v3_stub"),
            ("pilot_runtime_operational_governance_v5", "pilot_runtime_operational_governance_v5_stub"),
            ("pilot_runtime_operational_stability_v3", "pilot_runtime_operational_stability_v3_stub"),
            ("pilot_runtime_operational_safety_v4", "pilot_runtime_operational_safety_v4_stub"),
            ("pilot_runtime_execution_release_v2", "pilot_runtime_execution_release_v2_stub"),
            ("pilot_runtime_operational_scope_v3", "pilot_runtime_operational_scope_v3_stub"),
            ("pilot_runtime_release_candidate_summary_v1", "pilot_runtime_release_candidate_summary_v1_stub"),
        ],
    ),
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
