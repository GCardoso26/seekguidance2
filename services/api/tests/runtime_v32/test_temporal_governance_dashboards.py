"""temporal governance dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "temporal_governance_console_v1.html",
    "evolutionary_stability_console_v1.html",
    "operational_time_continuity_console_v1.html",
    "change_governance_console_v1.html",
    "long_horizon_continuity_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
