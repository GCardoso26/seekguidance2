"""Append v9 exports."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str, str]]]] = []


def add(rel: str, items: list[tuple[str, str, str]]) -> None:
    PATCHES.append((rel, items))


add("app/runtime/production_runtime/__init__.py", [
    ("runtime_execution_core_v9", "dispatch_execution", "prod"),
    ("runtime_execution_worker_v1", "runtime_execution_worker_v1_stub", "prod"),
    ("runtime_execution_queue_v1", "runtime_execution_queue_v1_stub", "prod"),
    ("runtime_execution_dispatcher_v1", "runtime_execution_dispatcher_v1_stub", "prod"),
    ("runtime_execution_retry_runtime_v1", "runtime_execution_retry_runtime_v1_stub", "prod"),
    ("runtime_execution_backpressure_runtime_v1", "runtime_execution_backpressure_runtime_v1_stub", "prod"),
    ("runtime_execution_priority_runtime_v1", "runtime_execution_priority_runtime_v1_stub", "prod"),
    ("runtime_execution_timeout_runtime_v1", "runtime_execution_timeout_runtime_v1_stub", "prod"),
    ("runtime_execution_cancellation_runtime_v1", "runtime_execution_cancellation_runtime_v1_stub", "prod"),
    ("runtime_execution_recovery_runtime_v1", "runtime_execution_recovery_runtime_v1_stub", "prod"),
    ("runtime_execution_deadletter_runtime_v1", "runtime_execution_deadletter_runtime_v1_stub", "prod"),
])

add("app/runtime/persistent_replay_runtime/__init__.py", [
    ("replay_execution_runtime_engine_v1", "replay_execution_runtime_engine_v1_stub", "persist"),
    ("replay_execution_snapshot_runtime_v1", "replay_execution_snapshot_runtime_v1_stub", "persist"),
    ("replay_execution_journal_runtime_v1", "replay_execution_journal_runtime_v1_stub", "persist"),
    ("replay_execution_locking_runtime_v1", "replay_execution_locking_runtime_v1_stub", "persist"),
    ("replay_execution_integrity_runtime_v1", "replay_execution_integrity_runtime_v1_stub", "persist"),
    ("replay_execution_recovery_runtime_v1", "replay_execution_recovery_runtime_v1_stub", "persist"),
    ("replay_execution_compaction_runtime_v1", "replay_execution_compaction_runtime_v1_stub", "persist"),
    ("replay_execution_rotation_runtime_v1", "replay_execution_rotation_runtime_v1_stub", "persist"),
    ("replay_execution_archive_runtime_v1", "replay_execution_archive_runtime_v1_stub", "persist"),
    ("replay_execution_temporal_runtime_v1", "replay_execution_temporal_runtime_v1_stub", "persist"),
])

add("app/runtime/replay_federation/__init__.py", [
    ("federation_supervision_runtime_v1", "federation_supervision_runtime_v1_stub", "fed"),
    ("federation_node_runtime_v1", "federation_node_runtime_v1_stub", "fed"),
    ("federation_health_runtime_v1", "federation_health_runtime_v1_stub", "fed"),
    ("federation_topology_runtime_v1", "federation_topology_runtime_v1_stub", "fed"),
    ("federation_sync_runtime_v1", "federation_sync_runtime_v1_stub", "fed"),
    ("federation_failover_runtime_v1", "federation_failover_runtime_v1_stub", "fed"),
    ("federation_consensus_runtime_v1", "federation_consensus_runtime_v1_stub", "fed"),
    ("federation_pressure_runtime_v1", "federation_pressure_runtime_v1_stub", "fed"),
    ("federation_drift_runtime_v1", "federation_drift_runtime_v1_stub", "fed"),
    ("federation_recovery_runtime_v1", "federation_recovery_runtime_v1_stub", "fed"),
])

add("app/runtime/runtime_incident_management/__init__.py", [
    ("runtime_incident_storage_v1", "runtime_incident_storage_v1_stub", "inc"),
    ("runtime_incident_queue_v1", "runtime_incident_queue_v1_stub", "inc"),
    ("runtime_incident_recovery_workflow_v1", "runtime_incident_recovery_workflow_v1_stub", "inc"),
    ("runtime_incident_resolution_runtime_v1", "runtime_incident_resolution_runtime_v1_stub", "inc"),
    ("runtime_incident_alert_runtime_v1", "runtime_incident_alert_runtime_v1_stub", "inc"),
    ("runtime_incident_escalation_runtime_v1", "runtime_incident_escalation_runtime_v1_stub", "inc"),
    ("runtime_incident_slo_runtime_v1", "runtime_incident_slo_runtime_v1_stub", "inc"),
    ("runtime_incident_reconciliation_runtime_v1", "runtime_incident_reconciliation_runtime_v1_stub", "inc"),
    ("runtime_incident_timeline_runtime_v1", "runtime_incident_timeline_runtime_v1_stub", "inc"),
    ("runtime_incident_audit_runtime_v1", "runtime_incident_audit_runtime_v1_stub", "inc"),
])

add("app/api/openapi_runtime_real/__init__.py", [
    ("runtime_openapi_enforcement_v9", "runtime_openapi_enforcement_v9_stub", "oa"),
    ("runtime_openapi_diff_runtime_v1", "runtime_openapi_diff_runtime_v1_stub", "oa"),
    ("runtime_schema_hash_runtime_v1", "runtime_schema_hash_runtime_v1_stub", "oa"),
    ("runtime_contract_drift_runtime_v1", "runtime_contract_drift_runtime_v1_stub", "oa"),
    ("runtime_route_validation_runtime_v1", "runtime_route_validation_runtime_v1_stub", "oa"),
    ("runtime_openapi_registry_runtime_v1", "runtime_openapi_registry_runtime_v1_stub", "oa"),
    ("runtime_ci_validation_runtime_v1", "runtime_ci_validation_runtime_v1_stub", "oa"),
    ("runtime_ci_report_runtime_v1", "runtime_ci_report_runtime_v1_stub", "oa"),
    ("runtime_ci_failure_runtime_v1", "runtime_ci_failure_runtime_v1_stub", "oa"),
    ("runtime_ci_summary_runtime_v1", "runtime_ci_summary_runtime_v1_stub", "oa"),
    ("runtime_ci_operational_runtime_v1", "runtime_ci_operational_runtime_v1_stub", "oa"),
])

add("app/observability/runtime_exporters/__init__.py", [
    ("runtime_histogram_runtime_v6", "runtime_histogram_runtime_v6_stub", "exp"),
    ("runtime_metrics_runtime_v6", "runtime_metrics_runtime_v6_stub", "exp"),
    ("runtime_trace_runtime_v6", "runtime_trace_runtime_v6_stub", "exp"),
    ("runtime_sampling_runtime_v6", "runtime_sampling_runtime_v6_stub", "exp"),
    ("runtime_alert_runtime_v6", "runtime_alert_runtime_v6_stub", "exp"),
    ("runtime_slo_runtime_v6", "runtime_slo_runtime_v6_stub", "exp"),
    ("runtime_incident_metrics_runtime_v6", "runtime_incident_metrics_runtime_v6_stub", "exp"),
    ("runtime_federation_metrics_runtime_v6", "runtime_federation_metrics_runtime_v6_stub", "exp"),
    ("runtime_mobile_metrics_runtime_v6", "runtime_mobile_metrics_runtime_v6_stub", "exp"),
    ("runtime_operational_analytics_runtime_v6", "runtime_operational_analytics_runtime_v6_stub", "exp"),
])

add("app/mobile_runtime/__init__.py", [
    ("mobile_runtime_sync_engine_v1", "mobile_runtime_sync_engine_v1_stub", "mobile"),
    ("mobile_runtime_delta_runtime_v1", "mobile_runtime_delta_runtime_v1_stub", "mobile"),
    ("mobile_runtime_checkpoint_runtime_v1", "mobile_runtime_checkpoint_runtime_v1_stub", "mobile"),
    ("mobile_runtime_retry_runtime_v1", "mobile_runtime_retry_runtime_v1_stub", "mobile"),
    ("mobile_runtime_conflict_runtime_v1", "mobile_runtime_conflict_runtime_v1_stub", "mobile"),
    ("mobile_runtime_recovery_runtime_v1", "mobile_runtime_recovery_runtime_v1_stub", "mobile"),
    ("mobile_runtime_rotation_runtime_v1", "mobile_runtime_rotation_runtime_v1_stub", "mobile"),
    ("mobile_runtime_integrity_runtime_v1", "mobile_runtime_integrity_runtime_v1_stub", "mobile"),
    ("mobile_runtime_health_runtime_v1", "mobile_runtime_health_runtime_v1_stub", "mobile"),
    ("mobile_runtime_trace_runtime_v1", "mobile_runtime_trace_runtime_v1_stub", "mobile"),
])

add("app/runtime/pilot_runtime/__init__.py", [
    ("pilot_runtime_execution_runtime_v4", "pilot_runtime_execution_runtime_v4_stub", "rel"),
    ("pilot_runtime_operational_runtime_v4", "pilot_runtime_operational_runtime_v4_stub", "rel"),
    ("pilot_runtime_governance_runtime_v4", "pilot_runtime_governance_runtime_v4_stub", "rel"),
    ("pilot_runtime_safety_runtime_v4", "pilot_runtime_safety_runtime_v4_stub", "rel"),
    ("pilot_runtime_deployment_runtime_v4", "pilot_runtime_deployment_runtime_v4_stub", "rel"),
    ("pilot_runtime_alignment_runtime_v4", "pilot_runtime_alignment_runtime_v4_stub", "rel"),
    ("pilot_runtime_mobile_runtime_v4", "pilot_runtime_mobile_runtime_v4_stub", "rel"),
    ("pilot_runtime_recovery_runtime_v4", "pilot_runtime_recovery_runtime_v4_stub", "rel"),
    ("pilot_runtime_incident_runtime_v4", "pilot_runtime_incident_runtime_v4_stub", "rel"),
    ("pilot_runtime_observability_runtime_v4", "pilot_runtime_observability_runtime_v4_stub", "rel"),
])

STYLES = {
    "prod": "from app.runtime.production_runtime.{mod} import {fn}\n",
    "persist": "from app.runtime.persistent_replay_runtime.{mod} import {fn}\n",
    "fed": "from app.runtime.replay_federation.{mod} import {fn}\n",
    "oa": "from app.api.openapi_runtime_real.{mod} import {fn}\n",
    "inc": "from app.runtime.runtime_incident_management.{mod} import {fn}\n",
    "mobile": "from app.mobile_runtime.{mod} import {fn}\n",
    "exp": "from app.observability.runtime_exporters.{mod} import {fn}\n",
    "rel": "from .{mod} import {fn}\n",
}


def append(rel: str, pairs: list[tuple[str, str, str]]) -> None:
    path = API / rel
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for mod, fn, style in pairs:
        imp = STYLES[style].format(mod=mod, fn=fn)
        if imp not in text:
            text = text.replace("__all__ = [", imp + "__all__ = [", 1)
        if f'"{fn}"' not in text:
            idx = text.rfind("\n]")
            if idx < 0:
                idx = text.rfind("]")
            text = text[:idx] + f'\n    "{fn}",' + text[idx:]
    path.write_text(text, encoding="utf-8")
    print("patched", rel)


for rel, pairs in PATCHES:
    append(rel, pairs)

# hardening package already has __init__ from generator
