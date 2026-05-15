"""Append GA Runtime Platform exports."""
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
    ("app/runtime/runtime_canonical/__init__.py", [
        ("canonical_runtime_api_v1", "canonical_runtime_api_v1_stub"),
        ("canonical_execution_interface_v1", "canonical_execution_interface_v1_stub"),
        ("canonical_replay_interface_v1", "canonical_replay_interface_v1_stub"),
        ("canonical_federation_interface_v1", "canonical_federation_interface_v1_stub"),
        ("canonical_observability_interface_v1", "canonical_observability_interface_v1_stub"),
        ("canonical_governance_interface_v1", "canonical_governance_interface_v1_stub"),
        ("canonical_persistence_interface_v3", "canonical_persistence_interface_v3_stub"),
        ("canonical_runtime_contracts_v1", "canonical_runtime_contracts_v1_stub"),
        ("canonical_runtime_adapter_registry_v1", "canonical_runtime_adapter_registry_v1_stub"),
        ("canonical_runtime_deprecation_registry_v1", "canonical_runtime_deprecation_registry_v1_stub"),
    ], None),
    ("app/runtime/runtime_hardening_v2/__init__.py", [
        ("runtime_memory_guard_v2", "runtime_memory_guard_v2_stub"),
        ("runtime_deadlock_detector_v2", "runtime_deadlock_detector_v2_stub"),
        ("runtime_queue_pressure_controller_v2", "runtime_queue_pressure_controller_v2_stub"),
        ("runtime_retry_stability_engine_v2", "runtime_retry_stability_engine_v2_stub"),
        ("runtime_failure_domain_engine_v2", "runtime_failure_domain_engine_v2_stub"),
        ("runtime_resource_protection_v2", "runtime_resource_protection_v2_stub"),
        ("runtime_execution_safety_v2", "runtime_execution_safety_v2_stub"),
        ("runtime_operational_safeguards_v2", "runtime_operational_safeguards_v2_stub"),
        ("runtime_recovery_stability_v2", "runtime_recovery_stability_v2_stub"),
        ("runtime_long_running_soak_engine_v2", "runtime_long_running_soak_engine_v2_stub"),
    ], None),
    ("app/runtime/federation_multinode/__init__.py", [
        ("federation_cluster_runtime_v3", "federation_cluster_runtime_v3_stub"),
        ("federation_real_node_runtime_v2", "federation_real_node_runtime_v2_stub"),
        ("federation_failover_runtime_v3", "federation_failover_runtime_v3_stub"),
        ("federation_partition_runtime_v2", "federation_partition_runtime_v2_stub"),
        ("federation_recovery_runtime_v2", "federation_recovery_runtime_v2_stub"),
        ("federation_consensus_runtime_v5", "federation_consensus_runtime_v5_stub"),
        ("federation_balancing_runtime_v4", "federation_balancing_runtime_v4_stub"),
        ("federation_distributed_health_v3", "federation_distributed_health_v3_stub"),
        ("federation_distributed_tracing_v2", "federation_distributed_tracing_v2_stub"),
        ("federation_operational_cluster_summary_v3", "federation_operational_cluster_summary_v3_stub"),
    ], None),
    ("app/runtime/runtime_connected_observability/__init__.py", [
        ("runtime_real_otlp_connector_v1", "runtime_real_otlp_connector_v1_stub"),
        ("runtime_real_prometheus_exporter_v1", "runtime_real_prometheus_exporter_v1_stub"),
        ("runtime_real_grafana_bridge_v1", "runtime_real_grafana_bridge_v1_stub"),
        ("runtime_real_trace_stream_v1", "runtime_real_trace_stream_v1_stub"),
        ("runtime_real_metric_stream_v1", "runtime_real_metric_stream_v1_stub"),
        ("runtime_real_slo_tracking_v1", "runtime_real_slo_tracking_v1_stub"),
        ("runtime_real_incident_correlation_v1", "runtime_real_incident_correlation_v1_stub"),
        ("runtime_real_operational_telemetry_v1", "runtime_real_operational_telemetry_v1_stub"),
        ("runtime_real_runtime_dashboard_feed_v1", "runtime_real_runtime_dashboard_feed_v1_stub"),
        ("runtime_real_observability_summary_v1", "runtime_real_observability_summary_v1_stub"),
    ], None),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_real_otlp_connector_v1", "runtime_real_otlp_connector_v1_stub"),
        ("runtime_real_prometheus_exporter_v1", "runtime_real_prometheus_exporter_v1_stub"),
        ("runtime_real_grafana_bridge_v1", "runtime_real_grafana_bridge_v1_stub"),
        ("runtime_real_trace_stream_v1", "runtime_real_trace_stream_v1_stub"),
        ("runtime_real_metric_stream_v1", "runtime_real_metric_stream_v1_stub"),
        ("runtime_real_slo_tracking_v1", "runtime_real_slo_tracking_v1_stub"),
        ("runtime_real_incident_correlation_v1", "runtime_real_incident_correlation_v1_stub"),
        ("runtime_real_operational_telemetry_v1", "runtime_real_operational_telemetry_v1_stub"),
        ("runtime_real_runtime_dashboard_feed_v1", "runtime_real_runtime_dashboard_feed_v1_stub"),
        ("runtime_real_observability_summary_v1", "runtime_real_observability_summary_v1_stub"),
    ], "app.observability.runtime_exporters"),
    ("app/runtime/security_compliance/__init__.py", [
        ("runtime_real_auth_engine_v1", "runtime_real_auth_engine_v1_stub"),
        ("runtime_real_rbac_engine_v1", "runtime_real_rbac_engine_v1_stub"),
        ("runtime_real_api_key_engine_v1", "runtime_real_api_key_engine_v1_stub"),
        ("runtime_real_oauth_bridge_v1", "runtime_real_oauth_bridge_v1_stub"),
        ("runtime_real_audit_retention_v1", "runtime_real_audit_retention_v1_stub"),
        ("runtime_real_compliance_registry_v1", "runtime_real_compliance_registry_v1_stub"),
        ("runtime_real_policy_enforcement_v1", "runtime_real_policy_enforcement_v1_stub"),
        ("runtime_real_tenant_isolation_v1", "runtime_real_tenant_isolation_v1_stub"),
        ("runtime_real_incident_governance_v1", "runtime_real_incident_governance_v1_stub"),
        ("runtime_real_governance_summary_v1", "runtime_real_governance_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_governance/__init__.py", [
        ("runtime_real_auth_engine_v1", "runtime_real_auth_engine_v1_stub"),
        ("runtime_real_rbac_engine_v1", "runtime_real_rbac_engine_v1_stub"),
        ("runtime_real_governance_summary_v1", "runtime_real_governance_summary_v1_stub"),
    ], None),
    ("app/runtime/runtime_distribution/__init__.py", [
        ("runtime_deployment_bundle_engine_v1", "runtime_deployment_bundle_engine_v1_stub"),
        ("runtime_runtime_installer_v2", "runtime_runtime_installer_v2_stub"),
        ("runtime_release_channel_runtime_v2", "runtime_release_channel_runtime_v2_stub"),
        ("runtime_semantic_versioning_engine_v1", "runtime_semantic_versioning_engine_v1_stub"),
        ("runtime_upgrade_planner_v1", "runtime_upgrade_planner_v1_stub"),
        ("runtime_migration_runtime_v1", "runtime_migration_runtime_v1_stub"),
        ("runtime_rollback_runtime_v2", "runtime_rollback_runtime_v2_stub"),
        ("runtime_environment_profile_v2", "runtime_environment_profile_v2_stub"),
        ("runtime_deployment_validation_v3", "runtime_deployment_validation_v3_stub"),
        ("runtime_deployment_summary_v2", "runtime_deployment_summary_v2_stub"),
    ], None),
    ("app/runtime/performance_engineering/__init__.py", [
        ("runtime_snapshot_compaction_v4", "runtime_snapshot_compaction_v4_stub"),
        ("runtime_snapshot_deduplication_v4", "runtime_snapshot_deduplication_v4_stub"),
        ("runtime_replay_compression_v2", "runtime_replay_compression_v2_stub"),
        ("runtime_storage_tuning_v4", "runtime_storage_tuning_v4_stub"),
        ("runtime_queue_optimization_v4", "runtime_queue_optimization_v4_stub"),
        ("runtime_memory_optimization_v2", "runtime_memory_optimization_v2_stub"),
        ("runtime_cost_optimization_v2", "runtime_cost_optimization_v2_stub"),
        ("runtime_persistence_efficiency_v2", "runtime_persistence_efficiency_v2_stub"),
        ("runtime_execution_latency_engine_v2", "runtime_execution_latency_engine_v2_stub"),
        ("runtime_performance_summary_v4", "runtime_performance_summary_v4_stub"),
    ], None),
    ("app/runtime/product_runtime/__init__.py", [
        ("runtime_admin_console_v3", "runtime_admin_console_v3_stub"),
        ("runtime_tenant_console_v2", "runtime_tenant_console_v2_stub"),
        ("runtime_operator_console_v2", "runtime_operator_console_v2_stub"),
        ("runtime_governance_console_v2", "runtime_governance_console_v2_stub"),
        ("runtime_incident_console_v2", "runtime_incident_console_v2_stub"),
        ("runtime_federation_console_v2", "runtime_federation_console_v2_stub"),
        ("runtime_deployment_console_v2", "runtime_deployment_console_v2_stub"),
        ("runtime_certification_console_v2", "runtime_certification_console_v2_stub"),
        ("runtime_observability_console_v2", "runtime_observability_console_v2_stub"),
        ("runtime_operational_portal_v2", "runtime_operational_portal_v2_stub"),
    ], None),
    ("app/runtime/public_runtime_api/__init__.py", [
        ("public_runtime_api_registry_v1", "public_runtime_api_registry_v1_stub"),
        ("public_runtime_contracts_v1", "public_runtime_contracts_v1_stub"),
        ("public_runtime_versioning_v1", "public_runtime_versioning_v1_stub"),
        ("public_runtime_sdk_registry_v1", "public_runtime_sdk_registry_v1_stub"),
        ("public_runtime_compatibility_v1", "public_runtime_compatibility_v1_stub"),
        ("public_runtime_support_matrix_v1", "public_runtime_support_matrix_v1_stub"),
        ("public_runtime_migration_policy_v1", "public_runtime_migration_policy_v1_stub"),
        ("public_runtime_release_policy_v1", "public_runtime_release_policy_v1_stub"),
        ("public_runtime_semver_v1", "public_runtime_semver_v1_stub"),
        ("public_runtime_api_summary_v1", "public_runtime_api_summary_v1_stub"),
    ], None),
    ("app/runtime/production_certification/__init__.py", [
        ("runtime_final_soak_certification_v1", "runtime_final_soak_certification_v1_stub"),
        ("runtime_final_chaos_certification_v1", "runtime_final_chaos_certification_v1_stub"),
        ("runtime_final_failover_certification_v1", "runtime_final_failover_certification_v1_stub"),
        ("runtime_final_drift_certification_v1", "runtime_final_drift_certification_v1_stub"),
        ("runtime_final_replay_certification_v1", "runtime_final_replay_certification_v1_stub"),
        ("runtime_final_operational_readiness_v1", "runtime_final_operational_readiness_v1_stub"),
        ("runtime_final_enterprise_readiness_v1", "runtime_final_enterprise_readiness_v1_stub"),
        ("runtime_final_public_runtime_readiness_v1", "runtime_final_public_runtime_readiness_v1_stub"),
        ("runtime_final_release_candidate_summary_v1", "runtime_final_release_candidate_summary_v1_stub"),
        ("runtime_ga_platform_summary_v1", "runtime_ga_platform_summary_v1_stub"),
    ], None),
    ("app/runtime/platform_ga_readiness/__init__.py", [
        ("runtime_final_release_candidate_summary_v1", "runtime_final_release_candidate_summary_v1_stub"),
        ("runtime_ga_platform_summary_v1", "runtime_ga_platform_summary_v1_stub"),
    ], None),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
