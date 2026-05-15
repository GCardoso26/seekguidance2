"""Append operational platform v2 exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

# replay_certification v2 - patch __init__
cert_init = API / "app/runtime/replay_certification/__init__.py"
if cert_init.is_file():
    text = cert_init.read_text(encoding="utf-8")
    for mod in [
        "replay_certification_engine_v2",
        "replay_reproducibility_runtime_v2",
        "replay_consistency_verifier_v2",
        "replay_audit_trace_runtime_v2",
        "replay_hash_integrity_runtime_v2",
        "replay_temporal_reproducibility_v2",
        "replay_execution_proof_runtime_v2",
        "replay_alignment_certification_v2",
        "replay_branch_certification_v2",
        "replay_runtime_certification_summary_v2",
    ]:
        fn = f"{mod}_stub"
        imp = f"from .{mod} import {fn}\n"
        if f"import {fn}" not in text:
            idx = text.rfind("\n__all__")
            text = text[:idx] + imp + text[idx:] if idx >= 0 else text + imp
        entry = f'    "{fn}",\n'
        if entry not in text:
            close = text.rfind("\n]")
            text = text[:close] + entry + text[close:]
    cert_init.write_text(text, encoding="utf-8")

PATCHES: list[tuple[str, list[tuple[str, str]]]] = [
    ("app/runtime/replay_federation/__init__.py", [
        ("federation_operational_router_v2", "federation_operational_router_v2_stub"),
        ("federation_runtime_supervisor_v2", "federation_runtime_supervisor_v2_stub"),
        ("federation_runtime_failover_v5", "federation_runtime_failover_v5_stub"),
        ("federation_runtime_health_v5", "federation_runtime_health_v5_stub"),
        ("federation_runtime_degradation_v3", "federation_runtime_degradation_v3_stub"),
        ("federation_runtime_alignment_v5", "federation_runtime_alignment_v5_stub"),
        ("federation_runtime_consensus_v5", "federation_runtime_consensus_v5_stub"),
        ("federation_runtime_distribution_v3", "federation_runtime_distribution_v3_stub"),
        ("federation_runtime_recovery_v3", "federation_runtime_recovery_v3_stub"),
        ("federation_runtime_operational_summary_v2", "federation_runtime_operational_summary_v2_stub"),
    ]),
    ("app/mobile_runtime/__init__.py", [
        ("mobile_runtime_operational_beta_v2", "mobile_runtime_operational_beta_v2_stub"),
        ("mobile_runtime_sync_engine_v3", "mobile_runtime_sync_engine_v3_stub"),
        ("mobile_runtime_checkpoint_rotation_v3", "mobile_runtime_checkpoint_rotation_v3_stub"),
        ("mobile_runtime_conflict_resolution_v5", "mobile_runtime_conflict_resolution_v5_stub"),
        ("mobile_runtime_recovery_v4", "mobile_runtime_recovery_v4_stub"),
        ("mobile_runtime_operational_trace_v2", "mobile_runtime_operational_trace_v2_stub"),
        ("mobile_runtime_offline_alignment_v3", "mobile_runtime_offline_alignment_v3_stub"),
        ("mobile_runtime_operational_health_v3", "mobile_runtime_operational_health_v3_stub"),
        ("mobile_runtime_queue_runtime_v3", "mobile_runtime_queue_runtime_v3_stub"),
        ("mobile_runtime_operational_summary_v2", "mobile_runtime_operational_summary_v2_stub"),
    ]),
    ("app/runtime/persistent_replay_runtime/__init__.py", [
        ("sqlite_runtime_execution_store_v3", "sqlite_runtime_execution_store_v3_stub"),
        ("sqlite_runtime_replay_trace_store_v2", "sqlite_runtime_replay_trace_store_v2_stub"),
        ("sqlite_runtime_temporal_index_v2", "sqlite_runtime_temporal_index_v2_stub"),
        ("sqlite_runtime_integrity_index_v2", "sqlite_runtime_integrity_index_v2_stub"),
        ("sqlite_runtime_recovery_runtime_v2", "sqlite_runtime_recovery_runtime_v2_stub"),
        ("replay_runtime_snapshot_rotation_v3", "replay_runtime_snapshot_rotation_v3_stub"),
        ("replay_runtime_compaction_runtime_v3", "replay_runtime_compaction_runtime_v3_stub"),
        ("replay_runtime_gc_runtime_v3", "replay_runtime_gc_runtime_v3_stub"),
        ("replay_runtime_storage_pressure_v2", "replay_runtime_storage_pressure_v2_stub"),
        ("replay_runtime_persistence_summary_v2", "replay_runtime_persistence_summary_v2_stub"),
    ]),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_live_metrics_engine_v2", "runtime_live_metrics_engine_v2_stub"),
        ("runtime_live_trace_engine_v2", "runtime_live_trace_engine_v2_stub"),
        ("runtime_operational_slo_engine_v2", "runtime_operational_slo_engine_v2_stub"),
        ("runtime_operational_alerting_v2", "runtime_operational_alerting_v2_stub"),
        ("runtime_operational_incident_metrics_v2", "runtime_operational_incident_metrics_v2_stub"),
        ("runtime_operational_dashboard_bridge_v2", "runtime_operational_dashboard_bridge_v2_stub"),
        ("runtime_trace_correlation_engine_v5", "runtime_trace_correlation_engine_v5_stub"),
        ("runtime_histogram_engine_v8", "runtime_histogram_engine_v8_stub"),
        ("runtime_otel_connector_v2", "runtime_otel_connector_v2_stub"),
        ("runtime_prometheus_bridge_v2", "runtime_prometheus_bridge_v2_stub"),
    ]),
    ("app/runtime/runtime_incident_management/__init__.py", [
        ("runtime_incident_recovery_engine_v3", "runtime_incident_recovery_engine_v3_stub"),
        ("runtime_incident_timeline_runtime_v3", "runtime_incident_timeline_runtime_v3_stub"),
        ("runtime_incident_alerting_runtime_v3", "runtime_incident_alerting_runtime_v3_stub"),
        ("runtime_incident_reconciliation_runtime_v2", "runtime_incident_reconciliation_runtime_v2_stub"),
        ("runtime_incident_repair_runtime_v2", "runtime_incident_repair_runtime_v2_stub"),
        ("runtime_incident_failover_runtime_v2", "runtime_incident_failover_runtime_v2_stub"),
        ("runtime_incident_recovery_summary_v2", "runtime_incident_recovery_summary_v2_stub"),
        ("runtime_incident_operational_metrics_v2", "runtime_incident_operational_metrics_v2_stub"),
        ("runtime_incident_governance_runtime_v2", "runtime_incident_governance_runtime_v2_stub"),
        ("runtime_incident_operational_summary_v2", "runtime_incident_operational_summary_v2_stub"),
    ]),
    ("app/api/openapi_runtime_real/__init__.py", [
        ("runtime_operational_cicd_engine_v2", "runtime_operational_cicd_engine_v2_stub"),
        ("runtime_operational_contract_diff_v2", "runtime_operational_contract_diff_v2_stub"),
        ("runtime_operational_schema_regression_v2", "runtime_operational_schema_regression_v2_stub"),
        ("runtime_operational_openapi_registry_v2", "runtime_operational_openapi_registry_v2_stub"),
        ("runtime_operational_contract_integrity_v2", "runtime_operational_contract_integrity_v2_stub"),
        ("runtime_operational_contract_scoring_v2", "runtime_operational_contract_scoring_v2_stub"),
        ("runtime_operational_release_validation_v2", "runtime_operational_release_validation_v2_stub"),
        ("runtime_operational_release_summary_v2", "runtime_operational_release_summary_v2_stub"),
        ("runtime_operational_drift_runtime_v2", "runtime_operational_drift_runtime_v2_stub"),
        ("runtime_operational_ci_summary_v2", "runtime_operational_ci_summary_v2_stub"),
    ]),
    ("app/runtime/platform_completion/__init__.py", [
        ("runtime_platform_completion_v2", "runtime_platform_completion_v2_stub"),
        ("runtime_platform_governance_summary_v2", "runtime_platform_governance_summary_v2_stub"),
        ("runtime_platform_operational_readiness_v2", "runtime_platform_operational_readiness_v2_stub"),
        ("runtime_platform_observability_summary_v2", "runtime_platform_observability_summary_v2_stub"),
        ("runtime_platform_replay_certification_summary_v2", "runtime_platform_replay_certification_summary_v2_stub"),
        ("runtime_platform_federation_summary_v2", "runtime_platform_federation_summary_v2_stub"),
        ("runtime_platform_mobile_summary_v2", "runtime_platform_mobile_summary_v2_stub"),
        ("runtime_platform_deployment_summary_v2", "runtime_platform_deployment_summary_v2_stub"),
        ("runtime_platform_integrity_summary_v2", "runtime_platform_integrity_summary_v2_stub"),
        ("runtime_platform_release_candidate_summary_v2", "runtime_platform_release_candidate_summary_v2_stub"),
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
