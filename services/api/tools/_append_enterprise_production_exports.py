"""Append Enterprise Production Runtime exports."""
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
    ("app/runtime/runtime_consolidation/__init__.py", [
        ("canonical_execution_runtime_engine_v2", "canonical_execution_runtime_engine_v2_stub"),
        ("canonical_federation_supervisor_v2", "canonical_federation_supervisor_v2_stub"),
        ("canonical_observability_bridge_v2", "canonical_observability_bridge_v2_stub"),
        ("canonical_persistence_interface_v2", "canonical_persistence_interface_v2_stub"),
        ("canonical_governance_engine_v2", "canonical_governance_engine_v2_stub"),
        ("canonical_runtime_registry_v2", "canonical_runtime_registry_v2_stub"),
        ("canonical_runtime_health_engine_v2", "canonical_runtime_health_engine_v2_stub"),
        ("canonical_runtime_alignment_engine_v2", "canonical_runtime_alignment_engine_v2_stub"),
        ("canonical_runtime_summary_v2", "canonical_runtime_summary_v2_stub"),
        ("canonical_runtime_capabilities_v2", "canonical_runtime_capabilities_v2_stub"),
    ], None),
    ("app/runtime/runtime_real_infrastructure/__init__.py", [
        ("runtime_real_deployment_engine_v2", "runtime_real_deployment_engine_v2_stub"),
        ("runtime_real_federation_cluster_v2", "runtime_real_federation_cluster_v2_stub"),
        ("runtime_real_ha_runtime_v2", "runtime_real_ha_runtime_v2_stub"),
        ("runtime_real_tracing_engine_v2", "runtime_real_tracing_engine_v2_stub"),
        ("runtime_real_failover_engine_v2", "runtime_real_failover_engine_v2_stub"),
        ("runtime_real_node_orchestrator_v2", "runtime_real_node_orchestrator_v2_stub"),
        ("runtime_real_deployment_automation_v2", "runtime_real_deployment_automation_v2_stub"),
        ("runtime_real_cluster_health_v2", "runtime_real_cluster_health_v2_stub"),
        ("runtime_real_operational_topology_v2", "runtime_real_operational_topology_v2_stub"),
        ("runtime_real_runtime_bootstrap_v2", "runtime_real_runtime_bootstrap_v2_stub"),
    ], None),
    ("app/runtime/product_runtime/__init__.py", [
        ("runtime_auth_engine_v1", "runtime_auth_engine_v1_stub"),
        ("runtime_rbac_engine_v1", "runtime_rbac_engine_v1_stub"),
        ("runtime_tenant_management_v1", "runtime_tenant_management_v1_stub"),
        ("runtime_user_management_v1", "runtime_user_management_v1_stub"),
        ("runtime_onboarding_engine_v1", "runtime_onboarding_engine_v1_stub"),
        ("runtime_release_channel_engine_v1", "runtime_release_channel_engine_v1_stub"),
        ("runtime_support_workflow_engine_v1", "runtime_support_workflow_engine_v1_stub"),
        ("runtime_runtime_installer_engine_v1", "runtime_runtime_installer_engine_v1_stub"),
        ("runtime_deployment_profile_engine_v1", "runtime_deployment_profile_engine_v1_stub"),
        ("runtime_enterprise_portal_summary_v1", "runtime_enterprise_portal_summary_v1_stub"),
    ], None),
    ("app/runtime/performance_engineering/__init__.py", [
        ("replay_compaction_engine_v3", "replay_compaction_engine_v3_stub"),
        ("replay_snapshot_deduplication_v3", "replay_snapshot_deduplication_v3_stub"),
        ("runtime_persistence_tuning_v3", "runtime_persistence_tuning_v3_stub"),
        ("runtime_queue_optimizer_v3", "runtime_queue_optimizer_v3_stub"),
        ("federation_balancing_engine_v3", "federation_balancing_engine_v3_stub"),
        ("runtime_memory_pressure_engine_v3", "runtime_memory_pressure_engine_v3_stub"),
        ("runtime_cost_modeling_engine_v3", "runtime_cost_modeling_engine_v3_stub"),
        ("runtime_operational_footprint_v3", "runtime_operational_footprint_v3_stub"),
        ("runtime_execution_profiler_v3", "runtime_execution_profiler_v3_stub"),
        ("runtime_runtime_efficiency_summary_v3", "runtime_runtime_efficiency_summary_v3_stub"),
    ], None),
    ("app/runtime/runtime_governance/__init__.py", [
        ("runtime_sla_enforcement_engine_v2", "runtime_sla_enforcement_engine_v2_stub"),
        ("runtime_quota_enforcement_engine_v2", "runtime_quota_enforcement_engine_v2_stub"),
        ("runtime_tenant_isolation_engine_v2", "runtime_tenant_isolation_engine_v2_stub"),
        ("runtime_audit_retention_engine_v2", "runtime_audit_retention_engine_v2_stub"),
        ("runtime_compliance_readiness_engine_v2", "runtime_compliance_readiness_engine_v2_stub"),
        ("runtime_incident_operations_engine_v2", "runtime_incident_operations_engine_v2_stub"),
        ("runtime_escalation_workflow_engine_v2", "runtime_escalation_workflow_engine_v2_stub"),
        ("runtime_operational_runbook_engine_v2", "runtime_operational_runbook_engine_v2_stub"),
        ("runtime_governance_policy_runtime_v2", "runtime_governance_policy_runtime_v2_stub"),
        ("runtime_governance_operational_summary_v2", "runtime_governance_operational_summary_v2_stub"),
    ], None),
    ("app/runtime/production_certification/__init__.py", [
        ("runtime_soak_testing_engine_v2", "runtime_soak_testing_engine_v2_stub"),
        ("runtime_stress_testing_engine_v2", "runtime_stress_testing_engine_v2_stub"),
        ("runtime_chaos_testing_engine_v2", "runtime_chaos_testing_engine_v2_stub"),
        ("runtime_replay_corruption_testing_v2", "runtime_replay_corruption_testing_v2_stub"),
        ("runtime_ha_validation_engine_v2", "runtime_ha_validation_engine_v2_stub"),
        ("runtime_federation_failover_validation_v2", "runtime_federation_failover_validation_v2_stub"),
        ("runtime_deployment_rollback_validation_v2", "runtime_deployment_rollback_validation_v2_stub"),
        ("runtime_drift_certification_engine_v2", "runtime_drift_certification_engine_v2_stub"),
        ("runtime_deterministic_replay_certification_final_v1", "runtime_deterministic_replay_certification_final_v1_stub"),
        ("runtime_production_certification_summary_v2", "runtime_production_certification_summary_v2_stub"),
    ], None),
    ("app/runtime/runtime_connected_observability/__init__.py", [
        ("runtime_distributed_tracing_engine_v8", "runtime_distributed_tracing_engine_v8_stub"),
        ("runtime_operational_metrics_engine_v8", "runtime_operational_metrics_engine_v8_stub"),
        ("runtime_federation_metrics_engine_v8", "runtime_federation_metrics_engine_v8_stub"),
        ("runtime_replay_metrics_engine_v8", "runtime_replay_metrics_engine_v8_stub"),
        ("runtime_mobile_metrics_engine_v8", "runtime_mobile_metrics_engine_v8_stub"),
        ("runtime_otlp_operational_bridge_v8", "runtime_otlp_operational_bridge_v8_stub"),
        ("runtime_prometheus_bridge_v8", "runtime_prometheus_bridge_v8_stub"),
        ("runtime_grafana_export_engine_v8", "runtime_grafana_export_engine_v8_stub"),
        ("runtime_observability_correlation_v8", "runtime_observability_correlation_v8_stub"),
        ("runtime_observability_summary_v8", "runtime_observability_summary_v8_stub"),
    ], None),
    ("app/runtime/external_pilot_program/__init__.py", [
        ("external_production_pilot_engine_v2", "external_production_pilot_engine_v2_stub"),
        ("external_pilot_operator_runtime_v2", "external_pilot_operator_runtime_v2_stub"),
        ("external_pilot_tenant_runtime_v2", "external_pilot_tenant_runtime_v2_stub"),
        ("external_pilot_dataset_runtime_v2", "external_pilot_dataset_runtime_v2_stub"),
        ("external_pilot_federation_runtime_v2", "external_pilot_federation_runtime_v2_stub"),
        ("external_pilot_observability_runtime_v2", "external_pilot_observability_runtime_v2_stub"),
        ("external_pilot_governance_runtime_v2", "external_pilot_governance_runtime_v2_stub"),
        ("external_pilot_reliability_runtime_v2", "external_pilot_reliability_runtime_v2_stub"),
        ("external_pilot_support_runtime_v2", "external_pilot_support_runtime_v2_stub"),
        ("external_pilot_operational_summary_v2", "external_pilot_operational_summary_v2_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_distributed_tracing_engine_v8", "runtime_distributed_tracing_engine_v8_stub"),
        ("runtime_operational_metrics_engine_v8", "runtime_operational_metrics_engine_v8_stub"),
        ("runtime_federation_metrics_engine_v8", "runtime_federation_metrics_engine_v8_stub"),
        ("runtime_replay_metrics_engine_v8", "runtime_replay_metrics_engine_v8_stub"),
        ("runtime_mobile_metrics_engine_v8", "runtime_mobile_metrics_engine_v8_stub"),
        ("runtime_otlp_operational_bridge_v8", "runtime_otlp_operational_bridge_v8_stub"),
        ("runtime_prometheus_bridge_v8", "runtime_prometheus_bridge_v8_stub"),
        ("runtime_grafana_export_engine_v8", "runtime_grafana_export_engine_v8_stub"),
        ("runtime_observability_correlation_v8", "runtime_observability_correlation_v8_stub"),
        ("runtime_observability_summary_v8", "runtime_observability_summary_v8_stub"),
    ], "app.observability.runtime_exporters"),
    ("app/observability/live_runtime/__init__.py", [
        ("runtime_observability_summary_v8", "runtime_observability_summary_v8_stub"),
    ], "app.observability.live_runtime"),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
