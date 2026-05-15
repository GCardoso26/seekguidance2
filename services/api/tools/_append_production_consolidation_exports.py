"""Append Production Consolidation exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]


def patch(rel: str, items: list[tuple[str, str]], *, absolute: str | None = None) -> None:
    path = API / rel
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for mod, fn in items:
        if absolute:
            imp = f"from {absolute}.{mod} import {fn}\n"
        else:
            imp = f"from .{mod} import {fn}\n"
        if f"import {fn}" not in text:
            idx = text.rfind("\n__all__")
            text = text[:idx] + imp + text[idx:] if idx >= 0 else text + imp
        entry = f'    "{fn}",\n'
        if entry not in text:
            close = text.rfind("\n]")
            text = text[:close] + entry + text[close:]
    path.write_text(text, encoding="utf-8")


PATCHES: list[tuple[str, list[tuple[str, str]], str | None]] = [
    ("app/runtime/external_pilot_program/__init__.py", [
        ("external_pilot_tenant_registry_v1", "external_pilot_tenant_registry_v1_stub"),
        ("external_pilot_workload_orchestration_v1", "external_pilot_workload_orchestration_v1_stub"),
        ("external_pilot_replay_datasets_v1", "external_pilot_replay_datasets_v1_stub"),
        ("external_pilot_runtime_scoring_v1", "external_pilot_runtime_scoring_v1_stub"),
        ("external_pilot_rollout_orchestration_v1", "external_pilot_rollout_orchestration_v1_stub"),
        ("external_pilot_operational_monitoring_v1", "external_pilot_operational_monitoring_v1_stub"),
        ("external_pilot_incident_summaries_v1", "external_pilot_incident_summaries_v1_stub"),
        ("external_pilot_federation_topology_v1", "external_pilot_federation_topology_v1_stub"),
        ("external_pilot_runtime_governance_v1", "external_pilot_runtime_governance_v1_stub"),
        ("external_pilot_operator_registry_v1", "external_pilot_operator_registry_v1_stub"),
    ], None),
    ("app/runtime/runtime_consolidation/__init__.py", [
        ("canonical_execution_registry_v1", "canonical_execution_registry_v1_stub"),
        ("canonical_federation_registry_v1", "canonical_federation_registry_v1_stub"),
        ("canonical_observability_registry_v1", "canonical_observability_registry_v1_stub"),
        ("canonical_persistence_interface_v1", "canonical_persistence_interface_v1_stub"),
        ("canonical_governance_engine_v1", "canonical_governance_engine_v1_stub"),
        ("runtime_compatibility_registry_v1", "runtime_compatibility_registry_v1_stub"),
        ("runtime_capability_aggregation_v1", "runtime_capability_aggregation_v1_stub"),
        ("runtime_execution_normalization_v1", "runtime_execution_normalization_v1_stub"),
        ("runtime_scoring_normalization_v1", "runtime_scoring_normalization_v1_stub"),
        ("runtime_payload_normalization_v1", "runtime_payload_normalization_v1_stub"),
    ], None),
    ("app/runtime/runtime_infrastructure/__init__.py", [
        ("runtime_smoke_deployment_orchestration_v1", "runtime_smoke_deployment_orchestration_v1_stub"),
        ("runtime_deployment_automation_v1", "runtime_deployment_automation_v1_stub"),
        ("runtime_federation_multinode_v1", "runtime_federation_multinode_v1_stub"),
        ("runtime_ha_orchestration_v1", "runtime_ha_orchestration_v1_stub"),
        ("runtime_chaos_orchestration_v1", "runtime_chaos_orchestration_v1_stub"),
        ("runtime_distributed_tracing_v1", "runtime_distributed_tracing_v1_stub"),
        ("runtime_deployment_rollback_orchestration_v1", "runtime_deployment_rollback_orchestration_v1_stub"),
        ("runtime_infrastructure_readiness_scoring_v1", "runtime_infrastructure_readiness_scoring_v1_stub"),
        ("runtime_infra_failover_v1", "runtime_infra_failover_v1_stub"),
        ("runtime_deployment_validation_runtime_v1", "runtime_deployment_validation_runtime_v1_stub"),
    ], None),
    ("app/runtime/product_runtime/__init__.py", [
        ("runtime_auth_orchestration_v3", "runtime_auth_orchestration_v3_stub"),
        ("runtime_rbac_validation_v3", "runtime_rbac_validation_v3_stub"),
        ("runtime_tenant_management_v3", "runtime_tenant_management_v3_stub"),
        ("runtime_onboarding_flows_v3", "runtime_onboarding_flows_v3_stub"),
        ("runtime_release_channel_management_v3", "runtime_release_channel_management_v3_stub"),
        ("runtime_deployment_installer_metadata_v3", "runtime_deployment_installer_metadata_v3_stub"),
        ("runtime_support_tooling_summary_v3", "runtime_support_tooling_summary_v3_stub"),
        ("runtime_operational_ux_scoring_v3", "runtime_operational_ux_scoring_v3_stub"),
        ("runtime_admin_summary_v3", "runtime_admin_summary_v3_stub"),
        ("runtime_tenant_operator_activity_v3", "runtime_tenant_operator_activity_v3_stub"),
    ], None),
    ("app/runtime/performance_engineering/__init__.py", [
        ("runtime_replay_compaction_runtime_v2", "runtime_replay_compaction_runtime_v2_stub"),
        ("runtime_snapshot_deduplication_runtime_v2", "runtime_snapshot_deduplication_runtime_v2_stub"),
        ("runtime_persistence_tuning_runtime_v2", "runtime_persistence_tuning_runtime_v2_stub"),
        ("runtime_profiling_runtime_v2", "runtime_profiling_runtime_v2_stub"),
        ("runtime_queue_optimization_v2", "runtime_queue_optimization_v2_stub"),
        ("runtime_federation_balancing_runtime_v2", "runtime_federation_balancing_runtime_v2_stub"),
        ("runtime_memory_pressure_handling_v2", "runtime_memory_pressure_handling_v2_stub"),
        ("runtime_operational_cost_modeling_v2", "runtime_operational_cost_modeling_v2_stub"),
        ("runtime_footprint_reduction_v2", "runtime_footprint_reduction_v2_stub"),
        ("runtime_storage_optimization_summary_v2", "runtime_storage_optimization_summary_v2_stub"),
    ], None),
    ("app/runtime/execution_governance_v2/__init__.py", [
        ("runtime_sla_enforcement_runtime_v3", "runtime_sla_enforcement_runtime_v3_stub"),
        ("runtime_quota_enforcement_runtime_v3", "runtime_quota_enforcement_runtime_v3_stub"),
        ("runtime_tenant_isolation_validation_v3", "runtime_tenant_isolation_validation_v3_stub"),
        ("runtime_audit_retention_runtime_v3", "runtime_audit_retention_runtime_v3_stub"),
        ("runtime_compliance_readiness_runtime_v3", "runtime_compliance_readiness_runtime_v3_stub"),
        ("runtime_incident_operations_runtime_v3", "runtime_incident_operations_runtime_v3_stub"),
        ("runtime_escalation_workflow_v3", "runtime_escalation_workflow_v3_stub"),
        ("runtime_runbook_summary_v3", "runtime_runbook_summary_v3_stub"),
        ("runtime_governance_enforcement_v3", "runtime_governance_enforcement_v3_stub"),
        ("runtime_operational_policy_validation_v3", "runtime_operational_policy_validation_v3_stub"),
    ], None),
    ("app/runtime/production_certification/__init__.py", [
        ("runtime_soak_certification_v1", "runtime_soak_certification_v1_stub"),
        ("runtime_chaos_certification_v1", "runtime_chaos_certification_v1_stub"),
        ("runtime_replay_certification_runtime_v1", "runtime_replay_certification_runtime_v1_stub"),
        ("runtime_ha_validation_v1", "runtime_ha_validation_v1_stub"),
        ("runtime_federation_failover_certification_v1", "runtime_federation_failover_certification_v1_stub"),
        ("runtime_deployment_rollback_certification_v1", "runtime_deployment_rollback_certification_v1_stub"),
        ("runtime_drift_certification_v1", "runtime_drift_certification_v1_stub"),
        ("runtime_deterministic_replay_certification_v1", "runtime_deterministic_replay_certification_v1_stub"),
        ("runtime_operational_certification_scoring_v1", "runtime_operational_certification_scoring_v1_stub"),
        ("runtime_production_certification_summary_v1", "runtime_production_certification_summary_v1_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_distributed_tracing_v7", "runtime_distributed_tracing_v7_stub"),
        ("runtime_federation_tracing_v7", "runtime_federation_tracing_v7_stub"),
        ("runtime_deployment_tracing_v7", "runtime_deployment_tracing_v7_stub"),
        ("runtime_replay_operational_tracing_v7", "runtime_replay_operational_tracing_v7_stub"),
        ("runtime_pilot_operational_metrics_v7", "runtime_pilot_operational_metrics_v7_stub"),
        ("runtime_production_rollout_metrics_v7", "runtime_production_rollout_metrics_v7_stub"),
        ("runtime_tenant_operational_metrics_v7", "runtime_tenant_operational_metrics_v7_stub"),
        ("runtime_sla_operational_metrics_v7", "runtime_sla_operational_metrics_v7_stub"),
        ("runtime_anomaly_operational_summary_v7", "runtime_anomaly_operational_summary_v7_stub"),
        ("runtime_production_observability_aggregation_v7", "runtime_production_observability_aggregation_v7_stub"),
    ], "app.observability.runtime_exporters"),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
