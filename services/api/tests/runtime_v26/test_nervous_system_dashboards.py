"""nervous system dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "runtime_nervous_system_console_v1.html",
    "runtime_mesh_global_console_v1.html",
    "federation_cognition_console_v1.html",
    "operational_adaptation_console_v1.html",
    "runtime_longevity_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
