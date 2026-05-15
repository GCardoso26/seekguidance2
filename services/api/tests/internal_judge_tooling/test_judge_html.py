"""Judge console HTML."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_runtime_ci_console_html() -> None:
    p = REPO / "apps/judge_console/runtime_ci_console.html"
    assert p.is_file()
    assert "Explainability" in p.read_text(encoding="utf-8")
