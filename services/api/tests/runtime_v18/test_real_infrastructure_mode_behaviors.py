"""Real infrastructure mode v2 behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.runtime_real_infrastructure.runtime_real_deployment_engine_v2 import (
    runtime_real_infrastructure_engine_v2,
)


def test_real_infrastructure_engine_v2() -> None:
    r = runtime_real_infrastructure_engine_v2("ep18-infra")
    assert r["infrastructure_score"] > 0
    assert "deployment_automation" in r


def test_infra_examples_exist() -> None:
    repo = Path(__file__).resolve().parents[4]
    root = repo / "infra" / "runtime_real_infrastructure"
    assert (root / "docker-compose" / "docker-compose.example.yml").is_file()
    assert (root / "kubernetes" / "deployment.example.yaml").is_file()
