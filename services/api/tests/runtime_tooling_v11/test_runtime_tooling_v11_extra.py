"""tooling v11."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_platform_completion_console() -> None:
    p = REPO / "apps" / "judge_console" / "platform_completion_console_v1.html"
    assert p.is_file()
    assert "readiness_score" in p.read_text(encoding="utf-8")
