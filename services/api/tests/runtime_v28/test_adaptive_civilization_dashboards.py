"""adaptive civilization dashboards."""
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]
_DASH = [
    "adaptive_civilization_console_v1.html",
    "ecosystem_convergence_console_v1.html",
    "operational_consensus_console_v1.html",
    "evolutionary_intelligence_console_v1.html",
    "self_organizing_resilience_console_v1.html",
]


@pytest.mark.parametrize("name", _DASH)
def test_dashboard(name: str) -> None:
    assert (REPO / "apps" / "admin_console_v2" / name).is_file()
