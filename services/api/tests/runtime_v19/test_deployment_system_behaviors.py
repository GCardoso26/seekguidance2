"""Deployment system behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.runtime_distribution.runtime_deployment_summary_v2 import (
    runtime_deployment_system_engine_v2,
)


def test_deployment_system_engine() -> None:
    r = runtime_deployment_system_engine_v2("ga19-deploy")
    assert r["deployment_score"] > 0


def test_deployment_infra_manifests() -> None:
    repo = Path(__file__).resolve().parents[4]
    root = repo / "infra" / "runtime_deployment"
    assert (root / "manifests" / "deployment.manifest.json").is_file()
