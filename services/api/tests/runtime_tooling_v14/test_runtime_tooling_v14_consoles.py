"""tooling v14 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_production_rollout_console_v9() -> None:
    p = REPO / "apps" / "judge_console" / "production_rollout_console_v9.html"
    assert p.is_file()
