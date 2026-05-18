"""institutional continuity dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "institutional_continuity_console_v1.html",
    "predictive_intelligence_console_v1.html",
    "constitutional_evolution_console_v1.html",
    "survivability_network_console_v1.html",
    "collective_equilibrium_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
