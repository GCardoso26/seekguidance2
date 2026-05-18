"""verifiable governance dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "verifiable_governance_console_v1.html",
    "operational_causality_console_v1.html",
    "runtime_constitution_console_v1.html",
    "operational_safety_console_v1.html",
    "meta_operational_simulation_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
