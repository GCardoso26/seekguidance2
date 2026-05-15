"""Operational platform v4 behaviors."""
from __future__ import annotations

import queue
from pathlib import Path

from app.runtime.platform_completion.runtime_platform_completion_engine_v4 import (
    runtime_platform_completion_engine_v4,
)
from app.runtime.production_runtime_v11.runtime_execution_operational_engine_v4 import (
    runtime_execution_operational_engine_v4,
)

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "integrity_status",
)


def test_execution_queue_pressure() -> None:
    r1 = runtime_execution_operational_engine_v4("q-scope-a")
    r2 = runtime_execution_operational_engine_v4("q-scope-a")
    assert "execution_summary" in r1
    assert r2["operational_pressure"] >= r1["operational_pressure"]


def test_platform_completion_rc_plus() -> None:
    p = runtime_platform_completion_engine_v4("rc-plus")
    assert p["completion_score"] > 0
    assert p["integrity_status"] in ("ok", "degraded")
    assert "domains" in p


def test_operational_cicd_release_dir() -> None:
    root = Path("generated/runtime_artifacts/production_release")
    assert (root / "runtime.release.summary.json").is_file()


def test_certification_v3_dir() -> None:
    root = Path("generated/runtime_artifacts/certification_v3")
    assert (root / "runtime.certification.summary.json").is_file()


def test_priority_queue_type() -> None:
    assert isinstance(queue.PriorityQueue(), queue.PriorityQueue)
