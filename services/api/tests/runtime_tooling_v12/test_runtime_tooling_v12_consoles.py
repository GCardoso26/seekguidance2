"""tooling v12 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_operational_console_v7() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_readiness_console_v7.html"
    assert p.is_file()
