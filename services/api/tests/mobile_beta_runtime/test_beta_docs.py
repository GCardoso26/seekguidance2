"""Mobile beta docs."""

from __future__ import annotations

from pathlib import Path


def test_beta_readme() -> None:
    p = Path(__file__).resolve().parents[4] / "apps" / "mobile" / "beta_runtime" / "README.md"
    assert p.is_file()
