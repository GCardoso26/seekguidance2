"""Append CPv3 exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

def patch(rel: str, items: list[tuple[str, str]]) -> None:
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

v11 = [
    ("runtime_operational_execution_engine_v2", "runtime_operational_execution_engine_v2_stub"),
    ("runtime_operational_scheduler_v5", "runtime_operational_scheduler_v5_stub"),
    ("runtime_operational_dispatch_runtime_v2", "runtime_operational_dispatch_runtime_v2_stub"),
    ("runtime_operational_retry_runtime_v2", "runtime_operational_retry_runtime_v2_stub"),
    ("runtime_operational_backpressure_runtime_v2", "runtime_operational_backpressure_runtime_v2_stub"),
    ("runtime_operational_priority_runtime_v2", "runtime_operational_priority_runtime_v2_stub"),
    ("runtime_operational_deadletter_runtime_v2", "runtime_operational_deadletter_runtime_v2_stub"),
    ("runtime_operational_state_runtime_v2", "runtime_operational_state_runtime_v2_stub"),
    ("runtime_operational_execution_supervisor_v2", "runtime_operational_execution_supervisor_v2_stub"),
    ("runtime_operational_execution_summary_v2", "runtime_operational_execution_summary_v2_stub"),
]

PATCHES = [
    ("app/runtime/production_runtime_v11/__init__.py", v11),
    ("app/runtime/replay_federation/__init__.py", [
        ("federation_production_router_v3", "federation_production_router_v3_stub"),
        ("federation_production_supervisor_v3", "federation_production_supervisor_v3_stub"),
        ("federation_production_alignment_v3", "federation_production_alignment_v3_stub"),
        ("federation_production_consensus_v6", "federation_production_consensus_v6_stub"),
        ("federation_production_health_v6", "federation_production_health_v6_stub"),
        ("federation_production_failover_v6", "federation_production_failover_v6_stub"),
        ("federation_production_distribution_v4", "federation_production_distribution_v4_stub"),
        ("federation_production_recovery_v4", "federation_production_recovery_v4_stub"),
        ("federation_production_governance_v3", "federation_production_governance_v3_stub"),
        ("federation_production_operational_summary_v3", "federation_production_operational_summary_v3_stub"),
    ]),
    ("app/mobile_runtime/__init__.py", [
        ("mobile_runtime_production_beta_v1", "mobile_runtime_production_beta_v1_stub"),
        ("mobile_runtime_sync_runtime_v4", "mobile_runtime_sync_runtime_v4_stub"),
        ("mobile_runtime_conflict_runtime_v6", "mobile_runtime_conflict_runtime_v6_stub"),
        ("mobile_runtime_recovery_runtime_v5", "mobile_runtime_recovery_runtime_v5_stub"),
        ("mobile_runtime_trace_runtime_v3", "mobile_runtime_trace_runtime_v3_stub"),
        ("mobile_runtime_checkpoint_runtime_v4", "mobile_runtime_checkpoint_runtime_v4_stub"),
        ("mobile_runtime_operational_scoring_v3", "mobile_runtime_operational_scoring_v3_stub"),
        ("mobile_runtime_offline_reconciliation_v4", "mobile_runtime_offline_reconciliation_v4_stub"),
        ("mobile_runtime_operational_governance_v2", "mobile_runtime_operational_governance_v2_stub"),
        ("mobile_runtime_production_summary_v1", "mobile_runtime_production_summary_v1_stub"),
    ]),
    ("app/runtime/persistent_replay_runtime/__init__.py", [
        ("sqlite_runtime_replay_archive_v3", "sqlite_runtime_replay_archive_v3_stub"),
        ("sqlite_runtime_temporal_runtime_v3", "sqlite_runtime_temporal_runtime_v3_stub"),
        ("sqlite_runtime_integrity_runtime_v3", "sqlite_runtime_integrity_runtime_v3_stub"),
        ("sqlite_runtime_recovery_runtime_v3", "sqlite_runtime_recovery_runtime_v3_stub"),
        ("sqlite_runtime_checkpoint_runtime_v3", "sqlite_runtime_checkpoint_runtime_v3_stub"),
        ("replay_runtime_compaction_v4", "replay_runtime_compaction_v4_stub"),
        ("replay_runtime_gc_v4", "replay_runtime_gc_v4_stub"),
        ("replay_runtime_storage_rotation_v4", "replay_runtime_storage_rotation_v4_stub"),
        ("replay_runtime_storage_pressure_v3", "replay_runtime_storage_pressure_v3_stub"),
        ("replay_runtime_operational_summary_v3", "replay_runtime_operational_summary_v3_stub"),
    ]),
    ("app/observability/runtime_exporters/__init__.py", [
        ("runtime_intelligence_engine_v1", "runtime_intelligence_engine_v1_stub"),
        ("runtime_intelligence_scoring_v1", "runtime_intelligence_scoring_v1_stub"),
        ("runtime_intelligence_anomaly_runtime_v1", "runtime_intelligence_anomaly_runtime_v1_stub"),
        ("runtime_intelligence_correlation_runtime_v1", "runtime_intelligence_correlation_runtime_v1_stub"),
        ("runtime_intelligence_slo_runtime_v1", "runtime_intelligence_slo_runtime_v1_stub"),
        ("runtime_intelligence_trace_runtime_v1", "runtime_intelligence_trace_runtime_v1_stub"),
        ("runtime_intelligence_metrics_runtime_v1", "runtime_intelligence_metrics_runtime_v1_stub"),
        ("runtime_intelligence_incident_runtime_v1", "runtime_intelligence_incident_runtime_v1_stub"),
        ("runtime_intelligence_operational_summary_v1", "runtime_intelligence_operational_summary_v1_stub"),
        ("runtime_intelligence_governance_v1", "runtime_intelligence_governance_v1_stub"),
    ]),
    ("app/api/openapi_runtime_real/__init__.py", [
        ("runtime_operational_cicd_engine_v3", "runtime_operational_cicd_engine_v3_stub"),
        ("runtime_operational_release_runtime_v3", "runtime_operational_release_runtime_v3_stub"),
        ("runtime_operational_contract_runtime_v3", "runtime_operational_contract_runtime_v3_stub"),
        ("runtime_operational_integrity_runtime_v3", "runtime_operational_integrity_runtime_v3_stub"),
        ("runtime_operational_governance_runtime_v3", "runtime_operational_governance_runtime_v3_stub"),
        ("runtime_operational_drift_runtime_v3", "runtime_operational_drift_runtime_v3_stub"),
        ("runtime_operational_release_validation_v3", "runtime_operational_release_validation_v3_stub"),
        ("runtime_operational_schema_runtime_v3", "runtime_operational_schema_runtime_v3_stub"),
        ("runtime_operational_hash_registry_v3", "runtime_operational_hash_registry_v3_stub"),
        ("runtime_operational_summary_v3", "runtime_operational_summary_v3_stub"),
    ]),
    ("app/runtime/platform_completion/__init__.py", [
        ("runtime_platform_completion_v3", "runtime_platform_completion_v3_stub"),
        ("runtime_platform_operational_summary_v3", "runtime_platform_operational_summary_v3_stub"),
        ("runtime_platform_reliability_summary_v1", "runtime_platform_reliability_summary_v1_stub"),
        ("runtime_platform_trust_summary_v1", "runtime_platform_trust_summary_v1_stub"),
        ("runtime_platform_federation_summary_v3", "runtime_platform_federation_summary_v3_stub"),
        ("runtime_platform_mobile_summary_v3", "runtime_platform_mobile_summary_v3_stub"),
        ("runtime_platform_observability_summary_v3", "runtime_platform_observability_summary_v3_stub"),
        ("runtime_platform_governance_summary_v3", "runtime_platform_governance_summary_v3_stub"),
        ("runtime_platform_deployment_summary_v3", "runtime_platform_deployment_summary_v3_stub"),
        ("runtime_platform_final_candidate_summary_v1", "runtime_platform_final_candidate_summary_v1_stub"),
    ]),
]

# replay_certification trust modules
cert = API / "app/runtime/replay_certification/__init__.py"
if cert.is_file():
    text = cert.read_text(encoding="utf-8")
    for mod in [
        "replay_operational_trust_engine_v1",
        "replay_operational_trust_scoring_v1",
        "replay_operational_integrity_runtime_v1",
        "replay_operational_reproducibility_runtime_v1",
        "replay_operational_audit_runtime_v1",
        "replay_operational_trace_runtime_v1",
        "replay_operational_alignment_runtime_v1",
        "replay_operational_governance_runtime_v1",
        "replay_operational_consistency_runtime_v1",
        "replay_operational_summary_v1",
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
    cert.write_text(text, encoding="utf-8")

for rel, items in PATCHES:
    patch(rel, items)

print("ok")
