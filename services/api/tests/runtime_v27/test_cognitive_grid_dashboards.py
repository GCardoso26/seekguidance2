"""cognitive grid dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "runtime_cognitive_grid_console_v1.html",
    "runtime_resilience_mesh_console_v1.html",
    "runtime_coordination_network_console_v1.html",
    "operational_forecasting_console_v1.html",
    "runtime_ecosystem_convergence_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
