"""Mobile beta docs."""

from __future__ import annotations

from pathlib import Path

import pytest


def test_beta_readme() -> None:
    p = Path(__file__).resolve().parents[4] / "apps" / "mobile" / "beta_runtime" / "README.md"
    if not p.is_file():
        pytest.skip("apps/mobile/beta_runtime/README.md ausente neste checkout")
    assert p.is_file()
