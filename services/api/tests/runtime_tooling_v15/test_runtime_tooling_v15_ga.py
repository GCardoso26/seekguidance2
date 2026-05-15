"""tooling v15 GA."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_admin_console_dashboard() -> None:
    p = REPO / "apps" / "admin_console" / "rollout_monitoring_dashboard.html"
    assert p.is_file()
