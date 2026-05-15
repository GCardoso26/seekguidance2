"""RC tooling consoles."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_release_candidate_console() -> None:
    p = REPO / "apps" / "judge_console" / "runtime_release_candidate_console.html"
    assert p.is_file()
    assert "runtime_confidence" in p.read_text(encoding="utf-8")
