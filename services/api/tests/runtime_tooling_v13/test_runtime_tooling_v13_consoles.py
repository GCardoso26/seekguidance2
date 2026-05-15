"""tooling v13 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_external_pilot_console_v8() -> None:
    p = REPO / "apps" / "judge_console" / "external_pilot_console_v8.html"
    assert p.is_file()
