"""Append GA Readiness exports."""
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
    ("app/runtime/production_rollout_v2/__init__.py", [
        ("production_rollout_staged_profiles_v2", "production_rollout_staged_profiles_v2_stub"),
        ("production_rollout_canary_scoring_v2", "production_rollout_canary_scoring_v2_stub"),
        ("production_rollout_tenant_isolation_v2", "production_rollout_tenant_isolation_v2_stub"),
        ("production_rollout_rollback_v2", "production_rollout_rollback_v2_stub"),
        ("production_rollout_freeze_v2", "production_rollout_freeze_v2_stub"),
        ("production_rollout_deployment_waves_v2", "production_rollout_deployment_waves_v2_stub"),
        ("production_rollout_health_aggregation_v2", "production_rollout_health_aggregation_v2_stub"),
        ("production_rollout_audit_trails_v2", "production_rollout_audit_trails_v2_stub"),
        ("production_rollout_blast_radius_v2", "production_rollout_blast_radius_v2_stub"),
        ("production_rollout_orchestration_v2", "production_rollout_orchestration_v2_stub"),
    ], None),
    ("app/runtime/security_compliance/__init__.py", [
        ("runtime_auth_flow_orchestration_v2", "runtime_auth_flow_orchestration_v2_stub"),
        ("runtime_rbac_policy_evaluation_v2", "runtime_rbac_policy_evaluation_v2_stub"),
        ("runtime_tenant_isolation_validation_v2", "runtime_tenant_isolation_validation_v2_stub"),
        ("runtime_api_key_lifecycle_v2", "runtime_api_key_lifecycle_v2_stub"),
        ("runtime_oauth_connector_v2", "runtime_oauth_connector_v2_stub"),
        ("runtime_oidc_connector_v2", "runtime_oidc_connector_v2_stub"),
        ("runtime_audit_retention_index_v2", "runtime_audit_retention_index_v2_stub"),
        ("runtime_secrets_rotation_hints_v2", "runtime_secrets_rotation_hints_v2_stub"),
        ("runtime_governance_policy_enforcement_v2", "runtime_governance_policy_enforcement_v2_stub"),
        ("runtime_compliance_readiness_v2", "runtime_compliance_readiness_v2_stub"),
        ("runtime_security_operational_engine_v2", "runtime_security_operational_engine_v2_stub"),
    ], None),
    ("app/runtime/runtime_packaging_v2/__init__.py", [
        ("runtime_bundle_manifests_v2", "runtime_bundle_manifests_v2_stub"),
        ("runtime_deployment_packaging_v2", "runtime_deployment_packaging_v2_stub"),
        ("runtime_installer_manifests_v2", "runtime_installer_manifests_v2_stub"),
        ("runtime_distribution_channels_v2", "runtime_distribution_channels_v2_stub"),
        ("runtime_deployment_target_profiles_v2", "runtime_deployment_target_profiles_v2_stub"),
        ("runtime_release_bundles_v2", "runtime_release_bundles_v2_stub"),
        ("runtime_artifact_signing_hints_v2", "runtime_artifact_signing_hints_v2_stub"),
        ("runtime_package_integrity_v2", "runtime_package_integrity_v2_stub"),
        ("runtime_deployment_packaging_runtime_v2", "runtime_deployment_packaging_runtime_v2_stub"),
        ("runtime_release_distribution_summary_v2", "runtime_release_distribution_summary_v2_stub"),
    ], None),
    ("app/runtime/runtime_infrastructure/__init__.py", [
        ("runtime_otlp_connector_v2", "runtime_otlp_connector_v2_stub"),
        ("runtime_prometheus_scrape_v2", "runtime_prometheus_scrape_v2_stub"),
        ("runtime_grafana_registry_v2", "runtime_grafana_registry_v2_stub"),
        ("runtime_postgres_readiness_v2", "runtime_postgres_readiness_v2_stub"),
        ("runtime_redis_federation_buffer_v2", "runtime_redis_federation_buffer_v2_stub"),
        ("runtime_kubernetes_hints_v2", "runtime_kubernetes_hints_v2_stub"),
        ("runtime_federation_node_registry_v2", "runtime_federation_node_registry_v2_stub"),
        ("runtime_infra_degradation_v2", "runtime_infra_degradation_v2_stub"),
        ("runtime_infra_failover_scoring_v2", "runtime_infra_failover_scoring_v2_stub"),
        ("runtime_infrastructure_health_aggregation_v2", "runtime_infrastructure_health_aggregation_v2_stub"),
    ], None),
    ("app/runtime/runtime_scale_reliability/__init__.py", [
        ("runtime_soak_orchestration_v2", "runtime_soak_orchestration_v2_stub"),
        ("runtime_stress_orchestration_v2", "runtime_stress_orchestration_v2_stub"),
        ("runtime_chaos_injection_v2", "runtime_chaos_injection_v2_stub"),
        ("runtime_replay_corruption_orchestration_v2", "runtime_replay_corruption_orchestration_v2_stub"),
        ("runtime_federation_failover_orchestration_v2", "runtime_federation_failover_orchestration_v2_stub"),
        ("runtime_ha_simulation_v2", "runtime_ha_simulation_v2_stub"),
        ("runtime_multinode_balancing_v2", "runtime_multinode_balancing_v2_stub"),
        ("runtime_replay_recovery_scoring_v2", "runtime_replay_recovery_scoring_v2_stub"),
        ("runtime_pressure_forecasting_v2", "runtime_pressure_forecasting_v2_stub"),
        ("runtime_operational_resilience_scoring_v2", "runtime_operational_resilience_scoring_v2_stub"),
    ], None),
    ("app/runtime/product_runtime/__init__.py", [
        ("runtime_onboarding_orchestration_v2", "runtime_onboarding_orchestration_v2_stub"),
        ("runtime_tenant_provisioning_v2", "runtime_tenant_provisioning_v2_stub"),
        ("runtime_user_provisioning_v2", "runtime_user_provisioning_v2_stub"),
        ("runtime_governance_ui_summary_v2", "runtime_governance_ui_summary_v2_stub"),
        ("runtime_dashboard_personalization_v2", "runtime_dashboard_personalization_v2_stub"),
        ("runtime_auth_flow_summary_v2", "runtime_auth_flow_summary_v2_stub"),
        ("runtime_operational_ux_scoring_v2", "runtime_operational_ux_scoring_v2_stub"),
        ("runtime_tenant_isolation_v2", "runtime_tenant_isolation_v2_stub"),
        ("runtime_usage_summary_v2", "runtime_usage_summary_v2_stub"),
        ("runtime_operator_activity_v2", "runtime_operator_activity_v2_stub"),
    ], None),
    ("app/runtime/enterprise_readiness/__init__.py", [
        ("runtime_semver_enforcement_v2", "runtime_semver_enforcement_v2_stub"),
        ("runtime_api_compatibility_v2", "runtime_api_compatibility_v2_stub"),
        ("runtime_sdk_compatibility_v2", "runtime_sdk_compatibility_v2_stub"),
        ("runtime_migration_policy_v2", "runtime_migration_policy_v2_stub"),
        ("runtime_release_governance_workflow_v2", "runtime_release_governance_workflow_v2_stub"),
        ("runtime_compatibility_guarantees_v2", "runtime_compatibility_guarantees_v2_stub"),
        ("runtime_support_lifecycle_summary_v2", "runtime_support_lifecycle_summary_v2_stub"),
        ("runtime_enterprise_support_readiness_v2", "runtime_enterprise_support_readiness_v2_stub"),
        ("runtime_api_freeze_validation_v2", "runtime_api_freeze_validation_v2_stub"),
        ("runtime_sdk_freeze_validation_v2", "runtime_sdk_freeze_validation_v2_stub"),
    ], None),
    ("app/runtime/commercial_runtime/__init__.py", [
        ("runtime_billing_readiness_v2", "runtime_billing_readiness_v2_stub"),
        ("runtime_quota_enforcement_summary_v2", "runtime_quota_enforcement_summary_v2_stub"),
        ("runtime_saas_profile_summary_v2", "runtime_saas_profile_summary_v2_stub"),
        ("runtime_support_workflow_summary_v2", "runtime_support_workflow_summary_v2_stub"),
        ("runtime_customer_segmentation_v2", "runtime_customer_segmentation_v2_stub"),
        ("runtime_runbook_summary_v2", "runtime_runbook_summary_v2_stub"),
        ("runtime_licensing_readiness_v2", "runtime_licensing_readiness_v2_stub"),
        ("runtime_enterprise_customer_readiness_v2", "runtime_enterprise_customer_readiness_v2_stub"),
        ("runtime_escalation_summary_v2", "runtime_escalation_summary_v2_stub"),
        ("runtime_support_orchestration_v2", "runtime_support_orchestration_v2_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_otlp_bridge_summary_v6", "runtime_otlp_bridge_summary_v6_stub"),
        ("runtime_prometheus_summary_v6", "runtime_prometheus_summary_v6_stub"),
        ("runtime_trace_correlation_vnext_v6", "runtime_trace_correlation_vnext_v6_stub"),
        ("runtime_operational_anomaly_summary_v6", "runtime_operational_anomaly_summary_v6_stub"),
        ("runtime_replay_latency_histograms_v6", "runtime_replay_latency_histograms_v6_stub"),
        ("runtime_federation_operational_metrics_v6", "runtime_federation_operational_metrics_v6_stub"),
        ("runtime_mobile_operational_metrics_v6", "runtime_mobile_operational_metrics_v6_stub"),
        ("runtime_rollout_metrics_v6", "runtime_rollout_metrics_v6_stub"),
        ("runtime_deployment_health_metrics_v6", "runtime_deployment_health_metrics_v6_stub"),
        ("runtime_slo_aggregation_v6", "runtime_slo_aggregation_v6_stub"),
    ], "app.observability.runtime_exporters"),
    ("app/runtime/platform_ga_readiness/__init__.py", [
        ("platform_ga_scoring_v1", "platform_ga_scoring_v1_stub"),
        ("platform_deployment_readiness_v1", "platform_deployment_readiness_v1_stub"),
        ("platform_rollout_readiness_v1", "platform_rollout_readiness_v1_stub"),
        ("platform_federation_readiness_v1", "platform_federation_readiness_v1_stub"),
        ("platform_replay_certification_v1", "platform_replay_certification_v1_stub"),
        ("platform_support_readiness_v1", "platform_support_readiness_v1_stub"),
        ("platform_operational_governance_v1", "platform_operational_governance_v1_stub"),
        ("platform_enterprise_readiness_v1", "platform_enterprise_readiness_v1_stub"),
        ("platform_production_confidence_v1", "platform_production_confidence_v1_stub"),
        ("platform_ga_operational_summary_v1", "platform_ga_operational_summary_v1_stub"),
    ], None),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
