"""institutional operating dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "institutional_governance_console_v1.html",
    "operational_memory_console_v1.html",
    "organizational_resilience_console_v1.html",
    "executive_oversight_console_v1.html",
    "long_horizon_sustainability_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
