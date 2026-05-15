"""Append v8 exports (safe)."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]

STYLES = {
    "prod": "from app.runtime.production_runtime.{mod} import {fn}\n",
    "persist": "from app.runtime.persistent_replay_runtime.{mod} import {fn}\n",
    "fed": "from app.runtime.replay_federation.{mod} import {fn}\n",
    "oa": "from app.api.openapi_runtime_real.{mod} import {fn}\n",
    "inc": "from app.runtime.runtime_incident_management.{mod} import {fn}\n",
    "mobile": "from app.mobile_runtime.{mod} import {fn}\n",
    "exp": "from app.observability.runtime_exporters.{mod} import {fn}\n",
    "pilot": "from app.runtime.pilot_runtime.{mod} import {fn}\n",
    "sb": "from app.runtime.replay_sandbox.{mod} import {fn}\n",
    "ra": "from app.runtime.replay_auditing.{mod} import {fn}\n",
    "rel": "from .{mod} import {fn}\n",
}


def append(rel: str, pairs: list[tuple[str, str, str]]) -> None:
    path = API / rel
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for mod, fn, style in pairs:
        imp = STYLES[style].format(mod=mod, fn=fn)
        if imp not in text and f"from .{mod} import" not in text:
            text = text.replace("__all__ = [", imp + "__all__ = [", 1)
        if f'"{fn}"' not in text:
            idx = text.rfind("\n]")
            if idx < 0:
                idx = text.rfind("]")
            text = text[:idx] + f'\n    "{fn}",' + text[idx:]
    path.write_text(text, encoding="utf-8")
    print("patched", rel)


# production V8
append("app/runtime/production_runtime/__init__.py", [
    ("runtime_lifecycle_state_v8", "lifecycle_transition_v8", "prod"),
    ("runtime_lifecycle_engine_v8", "runtime_lifecycle_engine_v8_stub", "prod"),
    ("runtime_lifecycle_state_machine_v8", "runtime_lifecycle_state_machine_v8_stub", "prod"),
    ("runtime_runtime_bootstrap_v8", "runtime_runtime_bootstrap_v8_stub", "prod"),
    ("runtime_runtime_shutdown_v8", "runtime_runtime_shutdown_v8_stub", "prod"),
    ("runtime_runtime_restart_v8", "runtime_runtime_restart_v8_stub", "prod"),
    ("runtime_execution_supervisor_v8", "runtime_execution_supervisor_v8_stub", "prod"),
    ("runtime_failure_domain_router_v8", "runtime_failure_domain_router_v8_stub", "prod"),
    ("runtime_lifecycle_guardrails_v8", "runtime_lifecycle_guardrails_v8_stub", "prod"),
    ("runtime_operational_transition_runtime_v8", "runtime_operational_transition_runtime_v8_stub", "prod"),
    ("runtime_runtime_health_gate_v8", "runtime_runtime_health_gate_v8_stub", "prod"),
])

# execution_governance_v2 - new package has init from generator

# deployment_orchestration - new package

append("app/runtime/persistent_replay_runtime/__init__.py", [
    ("replay_hash_validation_runtime_v5", "replay_hash_validation_runtime_v5_stub", "persist"),
    ("replay_execution_integrity_runtime_v5", "replay_execution_integrity_runtime_v5_stub", "persist"),
    ("replay_snapshot_integrity_runtime_v5", "replay_snapshot_integrity_runtime_v5_stub", "persist"),
    ("replay_checkpoint_integrity_runtime_v5", "replay_checkpoint_integrity_runtime_v5_stub", "persist"),
    ("replay_recovery_integrity_runtime_v5", "replay_recovery_integrity_runtime_v5_stub", "persist"),
    ("replay_branch_integrity_runtime_v5", "replay_branch_integrity_runtime_v5_stub", "persist"),
    ("replay_temporal_integrity_runtime_v5", "replay_temporal_integrity_runtime_v5_stub", "persist"),
    ("replay_lineage_integrity_runtime_v5", "replay_lineage_integrity_runtime_v5_stub", "persist"),
    ("replay_integrity_consensus_runtime_v5", "replay_integrity_consensus_runtime_v5_stub", "persist"),
    ("replay_integrity_repair_runtime_v5", "replay_integrity_repair_runtime_v5_stub", "persist"),
])

append("app/runtime/runtime_incident_management/__init__.py", [
    ("runtime_incident_engine_v3", "runtime_incident_engine_v3_stub", "inc"),
    ("runtime_incident_escalation_v3", "runtime_incident_escalation_v3_stub", "inc"),
    ("runtime_incident_classification_v3", "runtime_incident_classification_v3_stub", "inc"),
    ("runtime_incident_response_v3", "runtime_incident_response_v3_stub", "inc"),
    ("runtime_incident_recovery_v3", "runtime_incident_recovery_v3_stub", "inc"),
    ("runtime_incident_timeline_v3", "runtime_incident_timeline_v3_stub", "inc"),
    ("runtime_incident_slo_impact_v3", "runtime_incident_slo_impact_v3_stub", "inc"),
    ("runtime_incident_correlation_v3", "runtime_incident_correlation_v3_stub", "inc"),
    ("runtime_incident_resolution_v3", "runtime_incident_resolution_v3_stub", "inc"),
    ("runtime_incident_postmortem_v3", "runtime_incident_postmortem_v3_stub", "inc"),
])

append("app/runtime/replay_sandbox/__init__.py", [
    ("replay_sandbox_environment_v2", "replay_sandbox_environment_v2_stub", "rel"),
    ("replay_sandbox_runtime_v2", "replay_sandbox_runtime_v2_stub", "rel"),
    ("replay_sandbox_constraints_v2", "replay_sandbox_constraints_v2_stub", "rel"),
    ("replay_sandbox_dataset_runtime_v2", "replay_sandbox_dataset_runtime_v2_stub", "rel"),
    ("replay_sandbox_recovery_v2", "replay_sandbox_recovery_v2_stub", "rel"),
    ("replay_sandbox_alignment_v2", "replay_sandbox_alignment_v2_stub", "rel"),
    ("replay_sandbox_trace_runtime_v2", "replay_sandbox_trace_runtime_v2_stub", "rel"),
    ("replay_sandbox_mobile_runtime_v2", "replay_sandbox_mobile_runtime_v2_stub", "rel"),
    ("replay_sandbox_federation_runtime_v2", "replay_sandbox_federation_runtime_v2_stub", "rel"),
    ("replay_sandbox_governance_runtime_v2", "replay_sandbox_governance_runtime_v2_stub", "rel"),
])

append("app/api/openapi_runtime_real/__init__.py", [
    ("runtime_cicd_pipeline_v2", "runtime_cicd_pipeline_v2_stub", "oa"),
    ("runtime_openapi_enforcement_v3", "runtime_openapi_enforcement_v3_stub", "oa"),
    ("runtime_contract_regression_v3", "runtime_contract_regression_v3_stub", "oa"),
    ("runtime_schema_drift_detection_v3", "runtime_schema_drift_detection_v3_stub", "oa"),
    ("runtime_ci_artifact_registry_v2", "runtime_ci_artifact_registry_v2_stub", "oa"),
    ("runtime_ci_alignment_runtime_v2", "runtime_ci_alignment_runtime_v2_stub", "oa"),
    ("runtime_ci_failure_summary_v2", "runtime_ci_failure_summary_v2_stub", "oa"),
    ("runtime_ci_operational_report_v2", "runtime_ci_operational_report_v2_stub", "oa"),
    ("runtime_ci_replay_validation_v2", "runtime_ci_replay_validation_v2_stub", "oa"),
    ("runtime_ci_mobile_contracts_v2", "runtime_ci_mobile_contracts_v2_stub", "oa"),
])

append("app/runtime/replay_federation/__init__.py", [
    ("federation_rollout_guard_v2", "federation_rollout_guard_v2_stub", "fed"),
    ("federation_rollout_scoring_v2", "federation_rollout_scoring_v2_stub", "fed"),
    ("federation_alignment_safety_v2", "federation_alignment_safety_v2_stub", "fed"),
    ("federation_reconciliation_guard_v2", "federation_reconciliation_guard_v2_stub", "fed"),
    ("federation_operational_consensus_v2", "federation_operational_consensus_v2_stub", "fed"),
    ("federation_shard_integrity_v2", "federation_shard_integrity_v2_stub", "fed"),
    ("federation_mobile_edge_guard_v2", "federation_mobile_edge_guard_v2_stub", "fed"),
    ("federation_runtime_pressure_v2", "federation_runtime_pressure_v2_stub", "fed"),
    ("federation_stability_runtime_v2", "federation_stability_runtime_v2_stub", "fed"),
    ("federation_recovery_governance_v2", "federation_recovery_governance_v2_stub", "fed"),
])

append("app/runtime/replay_auditing/__init__.py", [
    ("replay_determinism_audit_v2", "replay_determinism_audit_v2_stub", "rel"),
    ("replay_trace_audit_v2", "replay_trace_audit_v2_stub", "rel"),
    ("replay_lineage_audit_v2", "replay_lineage_audit_v2_stub", "rel"),
    ("replay_integrity_audit_v2", "replay_integrity_audit_v2_stub", "rel"),
    ("replay_execution_audit_runtime_v2", "replay_execution_audit_runtime_v2_stub", "rel"),
    ("replay_temporal_audit_v2", "replay_temporal_audit_v2_stub", "rel"),
    ("replay_federation_audit_v2", "replay_federation_audit_v2_stub", "rel"),
    ("replay_mobile_runtime_audit_v2", "replay_mobile_runtime_audit_v2_stub", "rel"),
    ("replay_governance_audit_v2", "replay_governance_audit_v2_stub", "rel"),
    ("replay_operational_audit_v2", "replay_operational_audit_v2_stub", "rel"),
])

append("app/mobile_runtime/__init__.py", [
    ("mobile_runtime_stability_v5", "mobile_runtime_stability_v5_stub", "mobile"),
    ("mobile_runtime_pressure_v5", "mobile_runtime_pressure_v5_stub", "mobile"),
    ("mobile_runtime_retry_runtime_v5", "mobile_runtime_retry_runtime_v5_stub", "mobile"),
    ("mobile_runtime_failover_v5", "mobile_runtime_failover_v5_stub", "mobile"),
    ("mobile_runtime_budgeting_v5", "mobile_runtime_budgeting_v5_stub", "mobile"),
    ("mobile_runtime_recovery_v5", "mobile_runtime_recovery_v5_stub", "mobile"),
    ("mobile_runtime_consensus_v5", "mobile_runtime_consensus_v5_stub", "mobile"),
    ("mobile_runtime_trace_runtime_v5", "mobile_runtime_trace_runtime_v5_stub", "mobile"),
    ("mobile_runtime_integrity_v5", "mobile_runtime_integrity_v5_stub", "mobile"),
    ("mobile_runtime_operational_health_v5", "mobile_runtime_operational_health_v5_stub", "mobile"),
])

append("app/observability/runtime_exporters/__init__.py", [
    ("runtime_operational_metrics_v5", "runtime_operational_metrics_v5_stub", "exp"),
    ("runtime_incident_metrics_v5", "runtime_incident_metrics_v5_stub", "exp"),
    ("runtime_governance_metrics_v5", "runtime_governance_metrics_v5_stub", "exp"),
    ("runtime_slo_metrics_v5", "runtime_slo_metrics_v5_stub", "exp"),
    ("replay_integrity_metrics_v5", "replay_integrity_metrics_v5_stub", "exp"),
    ("federation_rollout_metrics_v5", "federation_rollout_metrics_v5_stub", "exp"),
    ("mobile_runtime_metrics_v5", "mobile_runtime_metrics_v5_stub", "exp"),
    ("pilot_runtime_metrics_v5", "pilot_runtime_metrics_v5_stub", "exp"),
    ("runtime_analytics_bridge_v5", "runtime_analytics_bridge_v5_stub", "exp"),
])

append("app/runtime/pilot_runtime/__init__.py", [
    ("pilot_runtime_deployment_v3", "pilot_runtime_deployment_v3_stub", "rel"),
    ("pilot_runtime_scope_v3", "pilot_runtime_scope_v3_stub", "rel"),
    ("pilot_runtime_safety_v3", "pilot_runtime_safety_v3_stub", "rel"),
    ("pilot_runtime_governance_v3", "pilot_runtime_governance_v3_stub", "rel"),
    ("pilot_runtime_alignment_v3", "pilot_runtime_alignment_v3_stub", "rel"),
    ("pilot_runtime_observability_v3", "pilot_runtime_observability_v3_stub", "rel"),
    ("pilot_runtime_incident_v3", "pilot_runtime_incident_v3_stub", "rel"),
    ("pilot_runtime_recovery_v3", "pilot_runtime_recovery_v3_stub", "rel"),
    ("pilot_runtime_mobile_scope_v3", "pilot_runtime_mobile_scope_v3_stub", "rel"),
    ("pilot_runtime_operational_limits_v3", "pilot_runtime_operational_limits_v3_stub", "rel"),
])

# resource/quota/slo - append to existing inits
for rel, mod_prefix, mods in [
    (
        "app/runtime/runtime_resource_governance/__init__.py",
        "runtime_resource",
        [
            "enforcement_v2",
            "forecasting_v2",
            "balancing_v2",
            "degradation_scoring_v2",
        ],
    ),
    (
        "app/runtime/runtime_execution_quotas/__init__.py",
        "runtime_quota",
        ["enforcement_v2", "forecasting_v2", "balancing_v2"],
    ),
    (
        "app/runtime/runtime_slo/__init__.py",
        "runtime_slo",
        [
            "violation_aggregation_v2",
            "operational_budget_scoring_v2",
            "federation_mobile_governance_v2",
        ],
    ),
]:
    pairs = [(f"{mod_prefix}_{s}", f"{mod_prefix}_{s}_stub", "rel") for s in mods]
    append(rel, pairs)
