"""Sandbox infra docs."""

from __future__ import annotations

from pathlib import Path


def test_sandbox_readme_exists() -> None:
    p = Path(__file__).resolve().parents[4] / "infra" / "runtime_federation_sandbox" / "README.md"
    assert p.is_file()
