"""dashboards v5."""
from pathlib import Path

_NAMES = [
    "executive_stewardship_console_v1.html",
    "real_world_validation_console_v1.html",
    "operational_guardianship_console_v1.html",
    "long_horizon_resilience_console_v1.html",
    "structural_alignment_console_v1.html",
]


def test_dashboards_exist() -> None:
    root = Path(__file__).resolve().parents[4] / "apps" / "admin_console_v2"
    for name in _NAMES:
        assert (root / name).is_file()
