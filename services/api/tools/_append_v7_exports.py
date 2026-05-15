"""Append v7 exports safely (one entry per line)."""
from __future__ import annotations

import re
from pathlib import Path

API = Path(__file__).resolve().parents[1]

PATCHES: list[tuple[str, list[tuple[str, str, str]]]] = [
    # rel, [(module, fn, import_style)]
]

# Build patches
def add(rel: str, mod_fn_list: list[tuple[str, str, str]]) -> None:
    PATCHES.append((rel, mod_fn_list))


add("app/runtime/production_runtime/__init__.py", [
    ("runtime_lifecycle_core_v7", "lifecycle_bootstrap", "prod"),
    ("runtime_lifecycle_manager_v1", "runtime_lifecycle_manager_v1_stub", "prod"),
    ("runtime_bootstrap_runtime_v1", "runtime_bootstrap_runtime_v1_stub", "prod"),
    ("runtime_shutdown_runtime_v1", "runtime_shutdown_runtime_v1_stub", "prod"),
    ("runtime_restart_runtime_v1", "runtime_restart_runtime_v1_stub", "prod"),
    ("runtime_health_supervisor_v1", "runtime_health_supervisor_v1_stub", "prod"),
    ("runtime_state_transition_runtime_v1", "runtime_state_transition_runtime_v1_stub", "prod"),
    ("runtime_execution_lifecycle_v1", "runtime_execution_lifecycle_v1_stub", "prod"),
    ("runtime_lifecycle_reconciliation_v1", "runtime_lifecycle_reconciliation_v1_stub", "prod"),
    ("runtime_lifecycle_recovery_v1", "runtime_lifecycle_recovery_v1_stub", "prod"),
    ("runtime_lifecycle_integrity_v1", "runtime_lifecycle_integrity_v1_stub", "prod"),
])

add("app/runtime/persistent_replay_runtime/__init__.py", [
    ("replay_integrity_engine_v4", "replay_integrity_engine_v4_stub", "persist"),
    ("replay_execution_audit_runtime_v1", "replay_execution_audit_runtime_v1_stub", "persist"),
    ("replay_integrity_scoring_runtime_v1", "replay_integrity_scoring_runtime_v1_stub", "persist"),
    ("replay_integrity_validation_runtime_v1", "replay_integrity_validation_runtime_v1_stub", "persist"),
    ("replay_integrity_recovery_runtime_v1", "replay_integrity_recovery_runtime_v1_stub", "persist"),
    ("replay_temporal_integrity_runtime_v1", "replay_temporal_integrity_runtime_v1_stub", "persist"),
    ("replay_execution_consensus_runtime_v1", "replay_execution_consensus_runtime_v1_stub", "persist"),
    ("replay_execution_integrity_trace_runtime_v1", "replay_execution_integrity_trace_runtime_v1_stub", "persist"),
    ("replay_integrity_governance_runtime_v1", "replay_integrity_governance_runtime_v1_stub", "persist"),
    ("replay_integrity_operational_summary_v1", "replay_integrity_operational_summary_v1_stub", "persist"),
    ("replay_rollback_runtime_v1", "replay_rollback_runtime_v1_stub", "persist"),
    ("replay_recovery_workflow_v1", "replay_recovery_workflow_v1_stub", "persist"),
    ("replay_reconstruction_runtime_v1", "replay_reconstruction_runtime_v1_stub", "persist"),
    ("replay_snapshot_restore_runtime_v1", "replay_snapshot_restore_runtime_v1_stub", "persist"),
    ("replay_temporal_restore_runtime_v1", "replay_temporal_restore_runtime_v1_stub", "persist"),
    ("replay_branch_restore_runtime_v1", "replay_branch_restore_runtime_v1_stub", "persist"),
    ("replay_integrity_restore_runtime_v1", "replay_integrity_restore_runtime_v1_stub", "persist"),
    ("replay_recovery_alignment_runtime_v1", "replay_recovery_alignment_runtime_v1_stub", "persist"),
    ("replay_recovery_trace_runtime_v1", "replay_recovery_trace_runtime_v1_stub", "persist"),
    ("replay_recovery_operational_summary_v1", "replay_recovery_operational_summary_v1_stub", "persist"),
])

add("app/runtime/replay_federation/__init__.py", [
    ("federation_rollout_safety_v1", "federation_rollout_safety_v1_stub", "fed"),
    ("federation_rollout_alignment_v1", "federation_rollout_alignment_v1_stub", "fed"),
    ("federation_rollout_budget_v1", "federation_rollout_budget_v1_stub", "fed"),
    ("federation_rollout_health_v1", "federation_rollout_health_v1_stub", "fed"),
    ("federation_rollout_reconciliation_v1", "federation_rollout_reconciliation_v1_stub", "fed"),
    ("federation_rollout_failover_v1", "federation_rollout_failover_v1_stub", "fed"),
    ("federation_rollout_consensus_v1", "federation_rollout_consensus_v1_stub", "fed"),
    ("federation_rollout_integrity_v1", "federation_rollout_integrity_v1_stub", "fed"),
    ("federation_rollout_trace_v1", "federation_rollout_trace_v1_stub", "fed"),
    ("federation_rollout_operational_summary_v1", "federation_rollout_operational_summary_v1_stub", "fed"),
])

add("app/api/openapi_runtime_real/__init__.py", [
    ("runtime_ci_pipeline_v1", "runtime_ci_pipeline_v1_stub", "oa"),
    ("runtime_ci_governance_v1", "runtime_ci_governance_v1_stub", "oa"),
    ("runtime_ci_artifact_integrity_v1", "runtime_ci_artifact_integrity_v1_stub", "oa"),
    ("runtime_ci_execution_summary_v1", "runtime_ci_execution_summary_v1_stub", "oa"),
    ("runtime_ci_replay_validation_v1", "runtime_ci_replay_validation_v1_stub", "oa"),
    ("runtime_ci_alignment_runtime_v1", "runtime_ci_alignment_runtime_v1_stub", "oa"),
    ("runtime_ci_operational_gates_v1", "runtime_ci_operational_gates_v1_stub", "oa"),
    ("runtime_cd_readiness_v1", "runtime_cd_readiness_v1_stub", "oa"),
    ("runtime_cd_rollout_summary_v1", "runtime_cd_rollout_summary_v1_stub", "oa"),
    ("runtime_ci_drift_detection_v1", "runtime_ci_drift_detection_v1_stub", "oa"),
])

add("app/runtime/runtime_incident_management/__init__.py", [
    ("runtime_incident_workflow_engine_v3", "runtime_incident_workflow_engine_v3_stub", "inc"),
    ("runtime_incident_recovery_workflow_v3", "runtime_incident_recovery_workflow_v3_stub", "inc"),
    ("runtime_incident_escalation_workflow_v3", "runtime_incident_escalation_workflow_v3_stub", "inc"),
    ("runtime_incident_audit_workflow_v3", "runtime_incident_audit_workflow_v3_stub", "inc"),
    ("runtime_incident_reconciliation_workflow_v3", "runtime_incident_reconciliation_workflow_v3_stub", "inc"),
    ("runtime_incident_trace_workflow_v3", "runtime_incident_trace_workflow_v3_stub", "inc"),
    ("runtime_incident_replay_workflow_v3", "runtime_incident_replay_workflow_v3_stub", "inc"),
    ("runtime_incident_governance_workflow_v3", "runtime_incident_governance_workflow_v3_stub", "inc"),
    ("runtime_incident_safety_workflow_v3", "runtime_incident_safety_workflow_v3_stub", "inc"),
    ("runtime_incident_operational_summary_v3", "runtime_incident_operational_summary_v3_stub", "inc"),
])

add("app/mobile_runtime/__init__.py", [
    ("mobile_runtime_stability_v1", "mobile_runtime_stability_v1_stub", "mobile"),
    ("mobile_runtime_resource_limits_v1", "mobile_runtime_resource_limits_v1_stub", "mobile"),
    ("mobile_runtime_recovery_v3", "mobile_runtime_recovery_v3_stub", "mobile"),
    ("mobile_runtime_checkpoint_integrity_v1", "mobile_runtime_checkpoint_integrity_v1_stub", "mobile"),
    ("mobile_runtime_consistency_v3", "mobile_runtime_consistency_v3_stub", "mobile"),
    ("mobile_runtime_sync_audit_v1", "mobile_runtime_sync_audit_v1_stub", "mobile"),
    ("mobile_runtime_trace_runtime_v3", "mobile_runtime_trace_runtime_v3_stub", "mobile"),
    ("mobile_runtime_operational_health_v1", "mobile_runtime_operational_health_v1_stub", "mobile"),
])

add("app/offline_runtime/__init__.py", [
    ("offline_runtime_operational_alignment_v1", "offline_runtime_operational_alignment_v1_stub", "offline"),
    ("offline_runtime_recovery_workflow_v1", "offline_runtime_recovery_workflow_v1_stub", "offline"),
])

STYLES = {
    "prod": "from app.runtime.production_runtime.{mod} import {fn}\n",
    "persist": "from app.runtime.persistent_replay_runtime.{mod} import {fn}\n",
    "fed": "from app.runtime.replay_federation.{mod} import {fn}\n",
    "oa": "from app.api.openapi_runtime_real.{mod} import {fn}\n",
    "inc": "from app.runtime.runtime_incident_management.{mod} import {fn}\n",
    "mobile": "from app.mobile_runtime.{mod} import {fn}\n",
    "offline": "from app.offline_runtime.{mod} import {fn}\n",
}


def append_exports(rel: str, pairs: list[tuple[str, str, str]]) -> None:
    path = API / rel
    text = path.read_text(encoding="utf-8")
    for mod, fn, style in pairs:
        imp = STYLES[style].format(mod=mod, fn=fn)
        if imp not in text:
            text = text.replace("__all__ = [", imp + "__all__ = [", 1)
        if f'"{fn}"' not in text:
            # insert before closing ]
            idx = text.rfind("\n]")
            if idx < 0:
                idx = text.rfind("]")
            text = text[:idx] + f'\n    "{fn}",' + text[idx:]
    path.write_text(text, encoding="utf-8")
    print("patched", rel)


for rel, pairs in PATCHES:
    append_exports(rel, pairs)
