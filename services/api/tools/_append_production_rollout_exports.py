"""Append Production Rollout exports."""
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


pr = [
    ("production_environment_runtime_v1", "production_environment_runtime_v1_stub"),
    ("production_operator_runtime_v1", "production_operator_runtime_v1_stub"),
    ("production_tenant_runtime_v1", "production_tenant_runtime_v1_stub"),
    ("production_usage_metrics_v1", "production_usage_metrics_v1_stub"),
    ("production_observability_runtime_v1", "production_observability_runtime_v1_stub"),
    ("production_rollout_scoring_v1", "production_rollout_scoring_v1_stub"),
    ("production_runtime_governance_v1", "production_runtime_governance_v1_stub"),
    ("production_runtime_health_v1", "production_runtime_health_v1_stub"),
    ("production_rollout_summary_v1", "production_rollout_summary_v1_stub"),
    ("production_rollout_runtime_v1", "production_rollout_runtime_v1_stub"),
]

PATCHES: list[tuple[str, list[tuple[str, str]], str | None]] = [
    ("app/runtime/production_rollout/__init__.py", pr, None),
    ("app/runtime/security_compliance/__init__.py", [
        ("runtime_auth_engine_v1", "runtime_auth_engine_v1_stub"),
        ("runtime_rbac_engine_v1", "runtime_rbac_engine_v1_stub"),
        ("runtime_api_key_engine_v1", "runtime_api_key_engine_v1_stub"),
        ("runtime_oauth_runtime_v1", "runtime_oauth_runtime_v1_stub"),
        ("runtime_oidc_runtime_v1", "runtime_oidc_runtime_v1_stub"),
        ("runtime_secret_management_v1", "runtime_secret_management_v1_stub"),
        ("runtime_audit_retention_v2", "runtime_audit_retention_v2_stub"),
        ("runtime_governance_policy_v2", "runtime_governance_policy_v2_stub"),
        ("runtime_compliance_runtime_v1", "runtime_compliance_runtime_v1_stub"),
        ("runtime_access_control_v1", "runtime_access_control_v1_stub"),
        ("runtime_session_runtime_v1", "runtime_session_runtime_v1_stub"),
        ("runtime_tenant_security_v1", "runtime_tenant_security_v1_stub"),
        ("runtime_security_scoring_v1", "runtime_security_scoring_v1_stub"),
        ("runtime_security_audit_v1", "runtime_security_audit_v1_stub"),
        ("runtime_security_summary_v1", "runtime_security_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_distribution/__init__.py", [
        ("runtime_docker_distribution_v1", "runtime_docker_distribution_v1_stub"),
        ("runtime_container_bundle_v1", "runtime_container_bundle_v1_stub"),
        ("runtime_installer_runtime_v2", "runtime_installer_runtime_v2_stub"),
        ("runtime_release_bundle_v1", "runtime_release_bundle_v1_stub"),
        ("runtime_deployment_cli_v1", "runtime_deployment_cli_v1_stub"),
        ("runtime_runtime_packaging_v2", "runtime_runtime_packaging_v2_stub"),
        ("runtime_release_channel_v2", "runtime_release_channel_v2_stub"),
        ("runtime_distribution_registry_v1", "runtime_distribution_registry_v1_stub"),
        ("runtime_helm_runtime_v1", "runtime_helm_runtime_v1_stub"),
        ("runtime_distribution_manifest_v1", "runtime_distribution_manifest_v1_stub"),
        ("runtime_distribution_integrity_v1", "runtime_distribution_integrity_v1_stub"),
        ("runtime_distribution_summary_v1", "runtime_distribution_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_infrastructure/__init__.py", [
        ("runtime_otlp_live_v1", "runtime_otlp_live_v1_stub"),
        ("runtime_prometheus_live_v1", "runtime_prometheus_live_v1_stub"),
        ("runtime_grafana_live_v1", "runtime_grafana_live_v1_stub"),
        ("runtime_postgres_runtime_v1", "runtime_postgres_runtime_v1_stub"),
        ("runtime_redis_runtime_v1", "runtime_redis_runtime_v1_stub"),
        ("runtime_kubernetes_runtime_v1", "runtime_kubernetes_runtime_v1_stub"),
        ("runtime_federation_node_runtime_v1", "runtime_federation_node_runtime_v1_stub"),
        ("runtime_cluster_runtime_v1", "runtime_cluster_runtime_v1_stub"),
        ("runtime_service_runtime_v1", "runtime_service_runtime_v1_stub"),
        ("runtime_infrastructure_health_v1", "runtime_infrastructure_health_v1_stub"),
        ("runtime_infrastructure_scaling_v1", "runtime_infrastructure_scaling_v1_stub"),
        ("runtime_infrastructure_balancing_v1", "runtime_infrastructure_balancing_v1_stub"),
        ("runtime_infrastructure_resilience_v1", "runtime_infrastructure_resilience_v1_stub"),
        ("runtime_infrastructure_integrity_v1", "runtime_infrastructure_integrity_v1_stub"),
        ("runtime_infrastructure_summary_v1", "runtime_infrastructure_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_scale_reliability/__init__.py", [
        ("runtime_soak_runtime_v2", "runtime_soak_runtime_v2_stub"),
        ("runtime_stress_runtime_v2", "runtime_stress_runtime_v2_stub"),
        ("runtime_chaos_runtime_v2", "runtime_chaos_runtime_v2_stub"),
        ("runtime_replay_corruption_runtime_v2", "runtime_replay_corruption_runtime_v2_stub"),
        ("runtime_multinode_runtime_v2", "runtime_multinode_runtime_v2_stub"),
        ("runtime_ha_failover_v2", "runtime_ha_failover_v2_stub"),
        ("runtime_reliability_runtime_v3", "runtime_reliability_runtime_v3_stub"),
        ("runtime_scaling_runtime_v1", "runtime_scaling_runtime_v1_stub"),
        ("runtime_memory_pressure_v2", "runtime_memory_pressure_v2_stub"),
        ("runtime_runtime_pressure_v2", "runtime_runtime_pressure_v2_stub"),
        ("runtime_failover_runtime_v2", "runtime_failover_runtime_v2_stub"),
        ("runtime_degradation_runtime_v2", "runtime_degradation_runtime_v2_stub"),
        ("runtime_operational_resilience_v2", "runtime_operational_resilience_v2_stub"),
        ("runtime_reliability_metrics_v1", "runtime_reliability_metrics_v1_stub"),
        ("runtime_scale_summary_v1", "runtime_scale_summary_v1_stub"),
    ], None),
    ("app/runtime/product_runtime/__init__.py", [
        ("runtime_onboarding_v2", "runtime_onboarding_v2_stub"),
        ("runtime_admin_console_v1", "runtime_admin_console_v1_stub"),
        ("runtime_dashboard_runtime_v1", "runtime_dashboard_runtime_v1_stub"),
        ("runtime_auth_flow_v1", "runtime_auth_flow_v1_stub"),
        ("runtime_tenant_management_v1", "runtime_tenant_management_v1_stub"),
        ("runtime_user_management_v1", "runtime_user_management_v1_stub"),
        ("runtime_governance_ui_v1", "runtime_governance_ui_v1_stub"),
        ("runtime_runtime_profiles_v1", "runtime_runtime_profiles_v1_stub"),
        ("runtime_operator_experience_v1", "runtime_operator_experience_v1_stub"),
        ("runtime_mobile_experience_v1", "runtime_mobile_experience_v1_stub"),
        ("runtime_runtime_preferences_v1", "runtime_runtime_preferences_v1_stub"),
        ("runtime_product_metrics_v1", "runtime_product_metrics_v1_stub"),
        ("runtime_product_analytics_v1", "runtime_product_analytics_v1_stub"),
        ("runtime_product_readiness_v1", "runtime_product_readiness_v1_stub"),
        ("runtime_product_summary_v1", "runtime_product_summary_v1_stub"),
    ], None),
    ("app/runtime/enterprise_readiness/__init__.py", [
        ("runtime_semver_engine_v2", "runtime_semver_engine_v2_stub"),
        ("runtime_migration_engine_v2", "runtime_migration_engine_v2_stub"),
        ("runtime_api_freeze_v1", "runtime_api_freeze_v1_stub"),
        ("runtime_sdk_freeze_v1", "runtime_sdk_freeze_v1_stub"),
        ("runtime_support_lifecycle_v1", "runtime_support_lifecycle_v1_stub"),
        ("runtime_release_governance_v2", "runtime_release_governance_v2_stub"),
        ("runtime_enterprise_policy_v1", "runtime_enterprise_policy_v1_stub"),
        ("runtime_enterprise_contract_v1", "runtime_enterprise_contract_v1_stub"),
        ("runtime_enterprise_guarantees_v1", "runtime_enterprise_guarantees_v1_stub"),
        ("runtime_enterprise_summary_v2", "runtime_enterprise_summary_v2_stub"),
    ], None),
    ("app/runtime/commercial_runtime/__init__.py", [
        ("runtime_licensing_v1", "runtime_licensing_v1_stub"),
        ("runtime_billing_v1", "runtime_billing_v1_stub"),
        ("runtime_quota_runtime_v2", "runtime_quota_runtime_v2_stub"),
        ("runtime_saas_profile_v1", "runtime_saas_profile_v1_stub"),
        ("runtime_support_workflow_v1", "runtime_support_workflow_v1_stub"),
        ("runtime_incident_operations_v1", "runtime_incident_operations_v1_stub"),
        ("runtime_operational_runbooks_v1", "runtime_operational_runbooks_v1_stub"),
        ("runtime_customer_runtime_v1", "runtime_customer_runtime_v1_stub"),
        ("runtime_usage_tracking_v1", "runtime_usage_tracking_v1_stub"),
        ("runtime_cost_runtime_v1", "runtime_cost_runtime_v1_stub"),
        ("runtime_commercial_metrics_v1", "runtime_commercial_metrics_v1_stub"),
        ("runtime_plan_runtime_v1", "runtime_plan_runtime_v1_stub"),
        ("runtime_subscription_runtime_v1", "runtime_subscription_runtime_v1_stub"),
        ("runtime_organizational_runtime_v1", "runtime_organizational_runtime_v1_stub"),
        ("runtime_commercial_summary_v1", "runtime_commercial_summary_v1_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_live_metrics_v5", "runtime_live_metrics_v5_stub"),
        ("runtime_operational_telemetry_v5", "runtime_operational_telemetry_v5_stub"),
        ("runtime_trace_runtime_v5", "runtime_trace_runtime_v5_stub"),
        ("runtime_metrics_storage_v5", "runtime_metrics_storage_v5_stub"),
        ("runtime_incident_telemetry_v5", "runtime_incident_telemetry_v5_stub"),
        ("runtime_usage_telemetry_v5", "runtime_usage_telemetry_v5_stub"),
        ("runtime_enterprise_telemetry_v5", "runtime_enterprise_telemetry_v5_stub"),
        ("runtime_federation_telemetry_v5", "runtime_federation_telemetry_v5_stub"),
        ("runtime_governance_telemetry_v5", "runtime_governance_telemetry_v5_stub"),
        ("runtime_observability_summary_v5", "runtime_observability_summary_v5_stub"),
    ], "app.observability.runtime_exporters"),
    ("app/api/openapi_runtime_real/__init__.py", [
        ("runtime_release_lifecycle_v1", "runtime_release_lifecycle_v1_stub"),
        ("runtime_release_distribution_v2", "runtime_release_distribution_v2_stub"),
        ("runtime_release_semver_v1", "runtime_release_semver_v1_stub"),
        ("runtime_release_support_matrix_v1", "runtime_release_support_matrix_v1_stub"),
        ("runtime_release_policy_v1", "runtime_release_policy_v1_stub"),
        ("runtime_release_compatibility_v1", "runtime_release_compatibility_v1_stub"),
        ("runtime_release_integrity_v2", "runtime_release_integrity_v2_stub"),
        ("runtime_release_enterprise_v1", "runtime_release_enterprise_v1_stub"),
        ("runtime_release_summary_v2", "runtime_release_summary_v2_stub"),
        ("runtime_release_governance_v3", "runtime_release_governance_v3_stub"),
    ], None),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
