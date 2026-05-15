"""Comportamentos semi-reais sprint RC."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_operational_cicd_pipeline_v4 import (
    runtime_operational_cicd_pipeline_v4_stub,
)
from app.mobile_runtime.mobile_runtime_reconciliation_engine_v3 import reconcile_mobile
from app.runtime.persistent_replay_runtime.replay_deterministic_audit_runtime_v3 import (
    audit_replay_determinism,
)
from app.runtime.pilot_runtime.pilot_runtime_release_candidate_summary_v1 import (
    pilot_runtime_release_candidate_summary_v1_stub,
)
from app.runtime.production_runtime.runtime_operational_controller_v1 import (
    enqueue_backlog,
    operational_snapshot,
)
from app.runtime.replay_federation.federation_operational_supervisor_v1 import (
    federation_operational_summary,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
)


def test_operational_backlog_and_pressure() -> None:
    enqueue_backlog("rc-scope", priority=2)
    snap = operational_snapshot("rc-scope")
    assert "backlog_score" in snap
    assert snap["stability_score"] >= 0


def test_replay_audit_scoring() -> None:
    report = audit_replay_determinism("rc-audit-1", {"step": 1})
    assert report["audit_score"] > 0
    assert report["trace_token"]


def test_federation_operational_summary() -> None:
    summary = federation_operational_summary("rc-cluster")
    assert summary["avg_health"] > 0


def test_mobile_reconcile() -> None:
    report = reconcile_mobile("rc-device")
    assert report["mobile_operational_score"] > 0


def test_cicd_rc_artifacts() -> None:
    p = runtime_operational_cicd_pipeline_v4_stub("rc-run")
    for k in _KEYS:
        assert k in p
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "release_candidate"
    assert (root / "runtime.release.integrity.json").is_file()


def test_pilot_release_candidate_summary() -> None:
    p = pilot_runtime_release_candidate_summary_v1_stub("rc-beta")
    for k in _KEYS:
        assert k in p
    assert p["release_candidate_score"] > 0
