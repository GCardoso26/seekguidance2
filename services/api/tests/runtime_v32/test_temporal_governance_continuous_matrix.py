"""Matriz continuous v4–v43."""
import importlib

import pytest

_VERSIONS = list(range(4, 44))


@pytest.mark.parametrize("ver", _VERSIONS)
def test_continuous_version_importable(ver: int) -> None:
    mod = importlib.import_module(f"app.evaluation.continuous_v{ver}")
    assert mod.__all__
