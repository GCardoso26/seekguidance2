"""tooling v16 consolidation."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_admin_console_v2_dashboard() -> None:
    p = REPO / "apps" / "admin_console_v2" / "tenant_management_dashboard_v2.html"
    assert p.is_file()
