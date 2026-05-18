"""public operational trust."""
from __future__ import annotations

import importlib
from pathlib import Path

import pytest


@pytest.mark.parametrize(
    "name",
    [
        "runtime_public_operational_trust_engine_v1",
        "runtime_compatibility_trust_v1",
        "runtime_sdk_survivability_v1",
        "runtime_public_ecosystem_continuity_v1",
        "runtime_release_stability_v1",
        "runtime_migration_continuity_v1",
        "runtime_semantic_governance_verification_v1",
        "runtime_public_operational_trust_summary_v1",
    ],
)
def test_pot_stub(name: str) -> None:
    mod = importlib.import_module(f"app.runtime.public_runtime_api.{name}")
    r = getattr(mod, f"{name}_stub")(f"pot-{name}")
    assert r["integrity_status"] == "ok"


def test_pot_engine_artifact() -> None:
    fn = importlib.import_module(
        "app.runtime.public_runtime_api.runtime_public_operational_trust_engine_v1"
    ).runtime_public_operational_trust_engine_v1
    fn("pot-art")
    p = Path("generated/runtime_artifacts/public_operational_trust_v1")
    assert (p / "pot-art-public_operational_trust_summary.json").is_file()
