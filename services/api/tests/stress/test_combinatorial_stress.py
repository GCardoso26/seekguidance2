"""Stress combinatório leve (opcional)."""

from __future__ import annotations

import pytest
from app.runtime.explosion_control_v2.symbolic_path_collapse import collapse_symbolic_paths

pytestmark = pytest.mark.stress


def test_symbolic_collapse_many_paths() -> None:
    paths = [[f"c{i}", f"c{i + 1}"] for i in range(30)]
    out = collapse_symbolic_paths(paths)
    assert len(out) <= len(paths)
