"""civilization coordination dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "civilization_coordination_console_v1.html",
    "meta_stability_console_v1.html",
    "ecosystem_equilibrium_console_v1.html",
    "operational_diplomacy_console_v1.html",
    "collective_forecasting_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
