"""tooling v5 consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_lifecycle_console_v5() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_lifecycle_console_v5.html"
    assert p.is_file()
    assert "runtime_confidence" in p.read_text(encoding="utf-8")
