"""tooling v3."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_lifecycle_console_v3() -> None:
    assert (REPO / "apps/judge_console/runtime_lifecycle_console_v3.html").is_file()
