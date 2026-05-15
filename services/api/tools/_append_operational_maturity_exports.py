"""Append Operational Maturity & Ecosystem Stabilization exports."""
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
    (
        "app/runtime/runtime_canonical/__init__.py",
        [
            ("canonical_runtime_capability_registry_v2", "canonical_runtime_capability_registry_v2_stub"),
            ("canonical_runtime_semver_registry_v1", "canonical_runtime_semver_registry_v1_stub"),
            ("canonical_runtime_migration_engine_v1", "canonical_runtime_migration_engine_v1_stub"),
            ("canonical_runtime_adapter_engine_v2", "canonical_runtime_adapter_engine_v2_stub"),
            ("canonical_runtime_contract_validator_v2", "canonical_runtime_contract_validator_v2_stub"),
            ("canonical_runtime_dependency_registry_v1", "canonical_runtime_dependency_registry_v1_stub"),
            ("canonical_runtime_compatibility_engine_v1", "canonical_runtime_compatibility_engine_v1_stub"),
            ("canonical_runtime_upgrade_graph_v1", "canonical_runtime_upgrade_graph_v1_stub"),
            ("canonical_runtime_release_registry_v1", "canonical_runtime_release_registry_v1_stub"),
            ("canonical_runtime_ecosystem_summary_v1", "canonical_runtime_ecosystem_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/production_runtime_v11/__init__.py",
        [
            ("runtime_real_operational_mode_v1", "runtime_real_operational_mode_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/runtime_real_infrastructure/__init__.py",
        [
            ("runtime_real_runtime_supervisor_v1", "runtime_real_runtime_supervisor_v1_stub"),
            ("runtime_real_failover_engine_v1", "runtime_real_failover_engine_v1_stub"),
            ("runtime_real_scaling_engine_v1", "runtime_real_scaling_engine_v1_stub"),
            ("runtime_real_runtime_monitor_v1", "runtime_real_runtime_monitor_v1_stub"),
            ("runtime_real_runtime_recovery_v1", "runtime_real_runtime_recovery_v1_stub"),
            ("runtime_real_operational_balancer_v1", "runtime_real_operational_balancer_v1_stub"),
            ("runtime_real_operational_queue_engine_v1", "runtime_real_operational_queue_engine_v1_stub"),
            ("runtime_real_operational_summary_v1", "runtime_real_operational_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/runtime_distribution/__init__.py",
        [
            ("runtime_real_deployment_orchestrator_v1", "runtime_real_deployment_orchestrator_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/runtime_connected_observability/__init__.py",
        [
            ("runtime_observability_retention_v1", "runtime_observability_retention_v1_stub"),
            ("runtime_operational_slo_engine_v2", "runtime_operational_slo_engine_v2_stub"),
            ("runtime_operational_alert_engine_v2", "runtime_operational_alert_engine_v2_stub"),
            ("runtime_trace_sampling_engine_v2", "runtime_trace_sampling_engine_v2_stub"),
            ("runtime_metric_aggregation_engine_v2", "runtime_metric_aggregation_engine_v2_stub"),
            ("runtime_operational_dashboard_runtime_v1", "runtime_operational_dashboard_runtime_v1_stub"),
            ("runtime_operational_incident_correlation_v2", "runtime_operational_incident_correlation_v2_stub"),
            ("runtime_observability_cost_engine_v1", "runtime_observability_cost_engine_v1_stub"),
            ("runtime_observability_health_engine_v1", "runtime_observability_health_engine_v1_stub"),
            ("runtime_observability_maturity_summary_v1", "runtime_observability_maturity_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/security_compliance/__init__.py",
        [
            ("runtime_enterprise_auth_v1", "runtime_enterprise_auth_v1_stub"),
            ("runtime_enterprise_rbac_v1", "runtime_enterprise_rbac_v1_stub"),
            ("runtime_enterprise_audit_engine_v1", "runtime_enterprise_audit_engine_v1_stub"),
            ("runtime_enterprise_secret_registry_v1", "runtime_enterprise_secret_registry_v1_stub"),
            ("runtime_enterprise_policy_engine_v1", "runtime_enterprise_policy_engine_v1_stub"),
            ("runtime_enterprise_quota_enforcement_v1", "runtime_enterprise_quota_enforcement_v1_stub"),
            ("runtime_enterprise_tenant_boundary_v1", "runtime_enterprise_tenant_boundary_v1_stub"),
            ("runtime_enterprise_incident_audit_v1", "runtime_enterprise_incident_audit_v1_stub"),
            ("runtime_enterprise_compliance_runtime_v1", "runtime_enterprise_compliance_runtime_v1_stub"),
            ("runtime_enterprise_security_summary_v1", "runtime_enterprise_security_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/runtime_governance/__init__.py",
        [
            ("runtime_enterprise_auth_v1", "runtime_enterprise_auth_v1_stub"),
            ("runtime_enterprise_rbac_v1", "runtime_enterprise_rbac_v1_stub"),
            ("runtime_enterprise_audit_engine_v1", "runtime_enterprise_audit_engine_v1_stub"),
            ("runtime_enterprise_secret_registry_v1", "runtime_enterprise_secret_registry_v1_stub"),
            ("runtime_enterprise_policy_engine_v1", "runtime_enterprise_policy_engine_v1_stub"),
            ("runtime_enterprise_quota_enforcement_v1", "runtime_enterprise_quota_enforcement_v1_stub"),
            ("runtime_enterprise_tenant_boundary_v1", "runtime_enterprise_tenant_boundary_v1_stub"),
            ("runtime_enterprise_incident_audit_v1", "runtime_enterprise_incident_audit_v1_stub"),
            ("runtime_enterprise_compliance_runtime_v1", "runtime_enterprise_compliance_runtime_v1_stub"),
            ("runtime_enterprise_security_summary_v1", "runtime_enterprise_security_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/performance_engineering/__init__.py",
        [
            ("runtime_execution_cost_model_v1", "runtime_execution_cost_model_v1_stub"),
            ("runtime_queue_efficiency_engine_v2", "runtime_queue_efficiency_engine_v2_stub"),
            ("runtime_replay_storage_efficiency_v2", "runtime_replay_storage_efficiency_v2_stub"),
            ("runtime_snapshot_compaction_engine_v5", "runtime_snapshot_compaction_engine_v5_stub"),
            ("runtime_snapshot_dedup_engine_v5", "runtime_snapshot_dedup_engine_v5_stub"),
            ("runtime_runtime_profile_engine_v2", "runtime_runtime_profile_engine_v2_stub"),
            ("runtime_federation_balancing_engine_v5", "runtime_federation_balancing_engine_v5_stub"),
            ("runtime_operational_footprint_engine_v1", "runtime_operational_footprint_engine_v1_stub"),
            ("runtime_performance_maturity_summary_v1", "runtime_performance_maturity_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/product_runtime/__init__.py",
        [
            ("runtime_enterprise_admin_console_v1", "runtime_enterprise_admin_console_v1_stub"),
            ("runtime_enterprise_operator_console_v1", "runtime_enterprise_operator_console_v1_stub"),
            ("runtime_enterprise_tenant_console_v1", "runtime_enterprise_tenant_console_v1_stub"),
            ("runtime_enterprise_governance_console_v1", "runtime_enterprise_governance_console_v1_stub"),
            ("runtime_enterprise_observability_console_v1", "runtime_enterprise_observability_console_v1_stub"),
            ("runtime_enterprise_incident_console_v1", "runtime_enterprise_incident_console_v1_stub"),
            ("runtime_enterprise_deployment_console_v1", "runtime_enterprise_deployment_console_v1_stub"),
            ("runtime_enterprise_release_console_v1", "runtime_enterprise_release_console_v1_stub"),
            ("runtime_enterprise_support_console_v1", "runtime_enterprise_support_console_v1_stub"),
            ("runtime_enterprise_product_summary_v1", "runtime_enterprise_product_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/public_runtime_api/__init__.py",
        [
            ("public_runtime_sdk_v1", "public_runtime_sdk_v1_stub"),
            ("public_runtime_client_registry_v1", "public_runtime_client_registry_v1_stub"),
            ("public_runtime_release_channel_v1", "public_runtime_release_channel_v1_stub"),
            ("public_runtime_support_lifecycle_v1", "public_runtime_support_lifecycle_v1_stub"),
            ("public_runtime_compatibility_matrix_v2", "public_runtime_compatibility_matrix_v2_stub"),
            ("public_runtime_api_contract_engine_v2", "public_runtime_api_contract_engine_v2_stub"),
            ("public_runtime_migration_runtime_v2", "public_runtime_migration_runtime_v2_stub"),
            ("public_runtime_upgrade_assistant_v1", "public_runtime_upgrade_assistant_v1_stub"),
            ("public_runtime_sdk_summary_v1", "public_runtime_sdk_summary_v1_stub"),
            ("public_runtime_ecosystem_readiness_v1", "public_runtime_ecosystem_readiness_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/production_certification/__init__.py",
        [
            ("runtime_operational_soak_engine_v2", "runtime_operational_soak_engine_v2_stub"),
            ("runtime_operational_chaos_engine_v2", "runtime_operational_chaos_engine_v2_stub"),
            ("runtime_operational_failover_engine_v2", "runtime_operational_failover_engine_v2_stub"),
            ("runtime_operational_replay_certification_v2", "runtime_operational_replay_certification_v2_stub"),
            ("runtime_operational_drift_engine_v2", "runtime_operational_drift_engine_v2_stub"),
            ("runtime_operational_recovery_certification_v1", "runtime_operational_recovery_certification_v1_stub"),
            ("runtime_operational_slo_certification_v1", "runtime_operational_slo_certification_v1_stub"),
            ("runtime_operational_deployment_certification_v1", "runtime_operational_deployment_certification_v1_stub"),
            ("runtime_operational_runtime_certification_v1", "runtime_operational_runtime_certification_v1_stub"),
            ("runtime_operational_maturity_summary_v1", "runtime_operational_maturity_summary_v1_stub"),
        ],
        None,
    ),
    (
        "app/runtime/platform_ga_readiness/__init__.py",
        [
            ("runtime_operational_deployment_certification_v1", "runtime_operational_deployment_certification_v1_stub"),
            ("runtime_operational_runtime_certification_v1", "runtime_operational_runtime_certification_v1_stub"),
            ("runtime_operational_maturity_summary_v1", "runtime_operational_maturity_summary_v1_stub"),
        ],
        None,
    ),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
