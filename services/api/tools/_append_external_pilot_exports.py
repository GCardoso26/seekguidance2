"""Append External Pilot exports."""
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


ep = [
    ("external_pilot_operator_runtime_v1", "external_pilot_operator_runtime_v1_stub"),
    ("external_pilot_dataset_runtime_v1", "external_pilot_dataset_runtime_v1_stub"),
    ("external_pilot_drift_runtime_v1", "external_pilot_drift_runtime_v1_stub"),
    ("external_pilot_federation_runtime_v1", "external_pilot_federation_runtime_v1_stub"),
    ("external_pilot_health_runtime_v1", "external_pilot_health_runtime_v1_stub"),
    ("external_pilot_governance_runtime_v1", "external_pilot_governance_runtime_v1_stub"),
    ("external_pilot_observability_runtime_v1", "external_pilot_observability_runtime_v1_stub"),
    ("external_pilot_readiness_runtime_v1", "external_pilot_readiness_runtime_v1_stub"),
    ("external_pilot_summary_runtime_v1", "external_pilot_summary_runtime_v1_stub"),
    ("external_pilot_runtime_engine_v1", "external_pilot_runtime_engine_v1_stub"),
]

fmn = [
    ("federation_cluster_runtime_v1", "federation_cluster_runtime_v1_stub"),
    ("federation_balancing_runtime_v1", "federation_balancing_runtime_v1_stub"),
    ("federation_failover_runtime_v1", "federation_failover_runtime_v1_stub"),
    ("federation_sync_runtime_v1", "federation_sync_runtime_v1_stub"),
    ("federation_degradation_runtime_v1", "federation_degradation_runtime_v1_stub"),
    ("federation_pressure_runtime_v1", "federation_pressure_runtime_v1_stub"),
    ("federation_cluster_health_v1", "federation_cluster_health_v1_stub"),
    ("federation_cluster_recovery_v1", "federation_cluster_recovery_v1_stub"),
    ("federation_cluster_summary_v1", "federation_cluster_summary_v1_stub"),
    ("federation_multinode_runtime_v1", "federation_multinode_runtime_v1_stub"),
]

PATCHES: list[tuple[str, list[tuple[str, str]], str | None]] = [
    ("app/runtime/external_pilot_runtime/__init__.py", ep, None),
    ("app/runtime/federation_multinode/__init__.py", fmn, None),
    ("app/runtime/runtime_hardening_v2/__init__.py", [
        ("runtime_soak_testing_v1", "runtime_soak_testing_v1_stub"),
        ("runtime_stress_testing_v1", "runtime_stress_testing_v1_stub"),
        ("runtime_chaos_testing_v1", "runtime_chaos_testing_v1_stub"),
        ("runtime_corruption_injection_v1", "runtime_corruption_injection_v1_stub"),
        ("runtime_failover_testing_v1", "runtime_failover_testing_v1_stub"),
        ("runtime_sync_degradation_v1", "runtime_sync_degradation_v1_stub"),
        ("runtime_pressure_testing_v1", "runtime_pressure_testing_v1_stub"),
        ("runtime_memory_pressure_v1", "runtime_memory_pressure_v1_stub"),
        ("runtime_operational_resilience_v1", "runtime_operational_resilience_v1_stub"),
        ("runtime_hardening_summary_v1", "runtime_hardening_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_connected_infra/__init__.py", [
        ("runtime_otlp_connector_v1", "runtime_otlp_connector_v1_stub"),
        ("runtime_prometheus_bridge_v1", "runtime_prometheus_bridge_v1_stub"),
        ("runtime_grafana_bridge_v1", "runtime_grafana_bridge_v1_stub"),
        ("runtime_trace_connector_v1", "runtime_trace_connector_v1_stub"),
        ("runtime_metrics_connector_v1", "runtime_metrics_connector_v1_stub"),
        ("runtime_container_runtime_v1", "runtime_container_runtime_v1_stub"),
        ("runtime_deployment_orchestrator_v1", "runtime_deployment_orchestrator_v1_stub"),
        ("runtime_runtime_packaging_v1", "runtime_runtime_packaging_v1_stub"),
        ("runtime_runtime_distribution_v1", "runtime_runtime_distribution_v1_stub"),
        ("runtime_connected_infra_summary_v1", "runtime_connected_infra_summary_v1_stub"),
    ], None),
    ("app/runtime/productization/__init__.py", [
        ("runtime_auth_runtime_v1", "runtime_auth_runtime_v1_stub"),
        ("runtime_rbac_runtime_v1", "runtime_rbac_runtime_v1_stub"),
        ("runtime_multitenant_runtime_v1", "runtime_multitenant_runtime_v1_stub"),
        ("runtime_onboarding_runtime_v1", "runtime_onboarding_runtime_v1_stub"),
        ("runtime_deployment_profiles_v1", "runtime_deployment_profiles_v1_stub"),
        ("runtime_installer_runtime_v1", "runtime_installer_runtime_v1_stub"),
        ("runtime_release_channel_v1", "runtime_release_channel_v1_stub"),
        ("runtime_productization_runtime_v1", "runtime_productization_runtime_v1_stub"),
        ("runtime_enterprise_runtime_v1", "runtime_enterprise_runtime_v1_stub"),
        ("runtime_productization_summary_v1", "runtime_productization_summary_v1_stub"),
    ], None),
    ("app/runtime/execution_governance_v2/__init__.py", [
        ("runtime_sla_enforcement_v1", "runtime_sla_enforcement_v1_stub"),
        ("runtime_audit_retention_v1", "runtime_audit_retention_v1_stub"),
        ("runtime_operational_policy_runtime_v1", "runtime_operational_policy_runtime_v1_stub"),
        ("runtime_governance_summary_v1", "runtime_governance_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_execution_quotas/__init__.py", [
        ("runtime_policy_enforcement_v1", "runtime_policy_enforcement_v1_stub"),
        ("runtime_operational_compliance_v1", "runtime_operational_compliance_v1_stub"),
    ], None),
    ("app/runtime/runtime_resource_governance/__init__.py", [
        ("runtime_quota_enforcement_v1", "runtime_quota_enforcement_v1_stub"),
        ("runtime_incident_governance_v1", "runtime_incident_governance_v1_stub"),
    ], None),
    ("app/runtime/runtime_slo/__init__.py", [
        ("runtime_billing_readiness_v1", "runtime_billing_readiness_v1_stub"),
        ("runtime_operational_governance_v1", "runtime_operational_governance_v1_stub"),
    ], None),
    ("app/runtime/performance_engineering/__init__.py", [
        ("runtime_profiling_runtime_v1", "runtime_profiling_runtime_v1_stub"),
        ("runtime_memory_runtime_v1", "runtime_memory_runtime_v1_stub"),
        ("runtime_replay_compression_v1", "runtime_replay_compression_v1_stub"),
        ("runtime_snapshot_deduplication_v1", "runtime_snapshot_deduplication_v1_stub"),
        ("runtime_persistence_tuning_v1", "runtime_persistence_tuning_v1_stub"),
        ("runtime_federation_balancing_v1", "runtime_federation_balancing_v1_stub"),
        ("runtime_operational_latency_v1", "runtime_operational_latency_v1_stub"),
        ("runtime_operational_hotspots_v1", "runtime_operational_hotspots_v1_stub"),
        ("runtime_operational_efficiency_v1", "runtime_operational_efficiency_v1_stub"),
        ("runtime_performance_summary_v1", "runtime_performance_summary_v1_stub"),
    ], None),
    ("app/runtime/enterprise_readiness/__init__.py", [
        ("runtime_api_stability_v1", "runtime_api_stability_v1_stub"),
        ("runtime_sdk_stability_v1", "runtime_sdk_stability_v1_stub"),
        ("runtime_semantic_versioning_v1", "runtime_semantic_versioning_v1_stub"),
        ("runtime_migration_policy_v1", "runtime_migration_policy_v1_stub"),
        ("runtime_support_matrix_v1", "runtime_support_matrix_v1_stub"),
        ("runtime_compatibility_guarantees_v1", "runtime_compatibility_guarantees_v1_stub"),
        ("runtime_contract_stability_v1", "runtime_contract_stability_v1_stub"),
        ("runtime_enterprise_readiness_v1", "runtime_enterprise_readiness_v1_stub"),
        ("runtime_public_release_v1", "runtime_public_release_v1_stub"),
        ("runtime_enterprise_summary_v1", "runtime_enterprise_summary_v1_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_trace_storage_v4", "runtime_trace_storage_v4_stub"),
        ("runtime_live_sampling_v4", "runtime_live_sampling_v4_stub"),
        ("runtime_metrics_persistence_v4", "runtime_metrics_persistence_v4_stub"),
        ("runtime_incident_observability_v4", "runtime_incident_observability_v4_stub"),
        ("runtime_federation_observability_v4", "runtime_federation_observability_v4_stub"),
        ("runtime_mobile_observability_v4", "runtime_mobile_observability_v4_stub"),
        ("runtime_replay_observability_v4", "runtime_replay_observability_v4_stub"),
        ("runtime_operational_telemetry_v4", "runtime_operational_telemetry_v4_stub"),
        ("runtime_operational_alerting_v4", "runtime_operational_alerting_v4_stub"),
        ("runtime_observability_summary_v4", "runtime_observability_summary_v4_stub"),
    ], "app.observability.runtime_exporters"),
    ("app/api/openapi_runtime_real/__init__.py", [
        ("runtime_semantic_release_v1", "runtime_semantic_release_v1_stub"),
        ("runtime_contract_regression_v1", "runtime_contract_regression_v1_stub"),
        ("runtime_release_validation_v1", "runtime_release_validation_v1_stub"),
        ("runtime_release_distribution_v1", "runtime_release_distribution_v1_stub"),
        ("runtime_release_readiness_v1", "runtime_release_readiness_v1_stub"),
        ("runtime_release_migration_v1", "runtime_release_migration_v1_stub"),
        ("runtime_release_support_v1", "runtime_release_support_v1_stub"),
        ("runtime_release_operational_summary_v1", "runtime_release_operational_summary_v1_stub"),
        ("runtime_release_finalization_v1", "runtime_release_finalization_v1_stub"),
        ("runtime_release_management_v1", "runtime_release_management_v1_stub"),
    ], None),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
