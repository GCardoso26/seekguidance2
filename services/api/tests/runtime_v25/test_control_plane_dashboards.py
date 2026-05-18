"""control plane dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "runtime_control_plane_console_v1.html",
    "federation_global_view_v1.html",
    "runtime_estate_console_v1.html",
    "operational_autonomy_console_v1.html",
    "runtime_intelligence_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
