"""Append Operational Production Readiness exports."""
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


v11_v4 = [
    ("runtime_execution_supervisor_v4", "runtime_execution_supervisor_v4_stub"),
    ("runtime_execution_pressure_engine_v4", "runtime_execution_pressure_engine_v4_stub"),
    ("runtime_execution_backpressure_runtime_v4", "runtime_execution_backpressure_runtime_v4_stub"),
    ("runtime_execution_retry_governance_v4", "runtime_execution_retry_governance_v4_stub"),
    ("runtime_execution_degradation_runtime_v4", "runtime_execution_degradation_runtime_v4_stub"),
    ("runtime_execution_recovery_runtime_v4", "runtime_execution_recovery_runtime_v4_stub"),
    ("runtime_execution_starvation_guard_v4", "runtime_execution_starvation_guard_v4_stub"),
    ("runtime_execution_priority_runtime_v4", "runtime_execution_priority_runtime_v4_stub"),
    ("runtime_execution_operational_summary_v4", "runtime_execution_operational_summary_v4_stub"),
    ("runtime_execution_health_runtime_v4", "runtime_execution_health_runtime_v4_stub"),
    ("runtime_execution_operational_engine_v4", "runtime_execution_operational_engine_v4_stub"),
]

rel_v2 = [
    ("runtime_reliability_scoring_v2", "runtime_reliability_scoring_v2_stub"),
    ("runtime_reliability_forecasting_v2", "runtime_reliability_forecasting_v2_stub"),
    ("runtime_failure_probability_v2", "runtime_failure_probability_v2_stub"),
    ("runtime_operational_resilience_v2", "runtime_operational_resilience_v2_stub"),
    ("runtime_runtime_consistency_v2", "runtime_runtime_consistency_v2_stub"),
    ("runtime_recovery_stability_v2", "runtime_recovery_stability_v2_stub"),
    ("runtime_integrity_confidence_v2", "runtime_integrity_confidence_v2_stub"),
    ("runtime_operational_anomaly_v2", "runtime_operational_anomaly_v2_stub"),
    ("runtime_reliability_regression_v2", "runtime_reliability_regression_v2_stub"),
    ("runtime_reliability_summary_v2", "runtime_reliability_summary_v2_stub"),
    ("runtime_reliability_engine_v2", "runtime_reliability_engine_v2_stub"),
]

cert_v3 = [
    ("replay_certification_regression_v3", "replay_certification_regression_v3_stub"),
    ("replay_reproducibility_runtime_v3", "replay_reproducibility_runtime_v3_stub"),
    ("replay_consistency_certification_v3", "replay_consistency_certification_v3_stub"),
    ("replay_temporal_integrity_v3", "replay_temporal_integrity_v3_stub"),
    ("replay_audit_confidence_v3", "replay_audit_confidence_v3_stub"),
    ("replay_hash_regression_v3", "replay_hash_regression_v3_stub"),
    ("replay_trace_certification_v3", "replay_trace_certification_v3_stub"),
    ("replay_recovery_certification_v3", "replay_recovery_certification_v3_stub"),
    ("replay_determinism_confidence_v3", "replay_determinism_confidence_v3_stub"),
    ("replay_operational_certification_summary_v3", "replay_operational_certification_summary_v3_stub"),
    ("replay_certification_engine_v3", "replay_certification_engine_v3_stub"),
]

fed_coord = [
    ("federation_runtime_coordination_engine_v1", "federation_runtime_coordination_engine_v1_stub"),
]

mobile_v2 = [
    ("mobile_runtime_operational_health_v2", "mobile_runtime_operational_health_v2_stub"),
    ("mobile_runtime_sync_queue_v2", "mobile_runtime_sync_queue_v2_stub"),
    ("mobile_runtime_checkpoint_recovery_v2", "mobile_runtime_checkpoint_recovery_v2_stub"),
    ("mobile_runtime_conflict_scoring_v2", "mobile_runtime_conflict_scoring_v2_stub"),
    ("mobile_runtime_sync_stability_v2", "mobile_runtime_sync_stability_v2_stub"),
    ("mobile_runtime_pressure_v2", "mobile_runtime_pressure_v2_stub"),
    ("mobile_runtime_offline_reconciliation_v2", "mobile_runtime_offline_reconciliation_v2_stub"),
    ("mobile_runtime_storage_integrity_v2", "mobile_runtime_storage_integrity_v2_stub"),
    ("mobile_runtime_operational_readiness_v2", "mobile_runtime_operational_readiness_v2_stub"),
    ("mobile_runtime_operational_summary_v2", "mobile_runtime_operational_summary_v2_stub"),
    ("mobile_runtime_operational_engine_v2", "mobile_runtime_operational_engine_v2_stub"),
]

obs_v3 = [
    ("runtime_live_trace_engine_v3", "runtime_live_trace_engine_v3_stub"),
    ("runtime_operational_metrics_v8", "runtime_operational_metrics_v8_stub"),
    ("runtime_slo_tracking_v3", "runtime_slo_tracking_v3_stub"),
    ("runtime_incident_correlation_v3", "runtime_incident_correlation_v3_stub"),
    ("runtime_operational_anomaly_v3", "runtime_operational_anomaly_v3_stub"),
    ("runtime_federation_metrics_v3", "runtime_federation_metrics_v3_stub"),
    ("runtime_mobile_metrics_v3", "runtime_mobile_metrics_v3_stub"),
    ("runtime_replay_metrics_v3", "runtime_replay_metrics_v3_stub"),
    ("runtime_trace_sampling_v3", "runtime_trace_sampling_v3_stub"),
    ("runtime_operational_observability_summary_v3", "runtime_operational_observability_summary_v3_stub"),
    ("runtime_connected_observability_engine_v3", "runtime_connected_observability_engine_v3_stub"),
]

inc_v3 = [
    ("runtime_incident_triage_v3", "runtime_incident_triage_v3_stub"),
    ("runtime_incident_recovery_queue_v3", "runtime_incident_recovery_queue_v3_stub"),
    ("runtime_incident_priority_v3", "runtime_incident_priority_v3_stub"),
    ("runtime_incident_timeline_v3", "runtime_incident_timeline_v3_stub"),
    ("runtime_incident_escalation_v3", "runtime_incident_escalation_v3_stub"),
    ("runtime_incident_correlation_v3", "runtime_incident_correlation_v3_stub"),
    ("runtime_incident_rootcause_v3", "runtime_incident_rootcause_v3_stub"),
    ("runtime_incident_resolution_v3", "runtime_incident_resolution_v3_stub"),
    ("runtime_incident_operational_state_v3", "runtime_incident_operational_state_v3_stub"),
    ("runtime_incident_summary_v3", "runtime_incident_summary_v3_stub"),
    ("runtime_incident_operational_engine_v3", "runtime_incident_operational_engine_v3_stub"),
]

cicd_v4 = [
    ("runtime_operational_release_engine_v4", "runtime_operational_release_engine_v4_stub"),
    ("runtime_openapi_regression_v4", "runtime_openapi_regression_v4_stub"),
    ("runtime_contract_integrity_v4", "runtime_contract_integrity_v4_stub"),
    ("runtime_release_governance_v4", "runtime_release_governance_v4_stub"),
    ("runtime_release_stability_v4", "runtime_release_stability_v4_stub"),
    ("runtime_release_alignment_v4", "runtime_release_alignment_v4_stub"),
    ("runtime_release_reliability_v4", "runtime_release_reliability_v4_stub"),
    ("runtime_release_readiness_v4", "runtime_release_readiness_v4_stub"),
    ("runtime_release_scoring_v4", "runtime_release_scoring_v4_stub"),
    ("runtime_release_summary_v4", "runtime_release_summary_v4_stub"),
    ("runtime_operational_cicd_engine_v4", "runtime_operational_cicd_engine_v4_stub"),
]

plat_v4 = [
    ("runtime_platform_completion_v4", "runtime_platform_completion_v4_stub"),
    ("runtime_platform_operational_readiness_v4", "runtime_platform_operational_readiness_v4_stub"),
    ("runtime_platform_reliability_v4", "runtime_platform_reliability_v4_stub"),
    ("runtime_platform_deployment_v4", "runtime_platform_deployment_v4_stub"),
    ("runtime_platform_mobile_v4", "runtime_platform_mobile_v4_stub"),
    ("runtime_platform_federation_v4", "runtime_platform_federation_v4_stub"),
    ("runtime_platform_certification_v4", "runtime_platform_certification_v4_stub"),
    ("runtime_platform_governance_v4", "runtime_platform_governance_v4_stub"),
    ("runtime_platform_observability_v4", "runtime_platform_observability_v4_stub"),
    ("runtime_platform_summary_v4", "runtime_platform_summary_v4_stub"),
    ("runtime_platform_completion_engine_v4", "runtime_platform_completion_engine_v4_stub"),
]

PATCHES: list[tuple[str, list[tuple[str, str]], str | None]] = [
    ("app/runtime/production_runtime_v11/__init__.py", v11_v4, None),
    ("app/runtime/runtime_reliability/__init__.py", rel_v2, None),
    ("app/runtime/replay_certification/__init__.py", cert_v3, None),
    ("app/runtime/federation_coordination/__init__.py", fed_coord, None),
    ("app/mobile_runtime/__init__.py", mobile_v2, "app.mobile_runtime"),
    ("app/observability/runtime_exporters/__init__.py", obs_v3, "app.observability.runtime_exporters"),
    ("app/runtime/runtime_incident_management/__init__.py", inc_v3, None),
    ("app/api/openapi_runtime_real/__init__.py", cicd_v4, None),
    ("app/runtime/platform_completion/__init__.py", plat_v4, None),
]

for rel, items, absolute in PATCHES:
    patch(rel, items, absolute=absolute)

print("ok")
