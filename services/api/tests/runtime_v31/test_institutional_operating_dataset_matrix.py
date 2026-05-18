"""Matriz datasets executable real v1–v30."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_VERSIONS = list(range(4, 31))


@pytest.mark.parametrize("ver", _VERSIONS)
def test_dataset_manifest_version(ver: int) -> None:
    root = API / "evaluation/runtime_execution"
    matches = list(root.glob(f"executable_real_*_v{ver}"))
    if not matches:
        pytest.skip(f"no dataset v{ver}")
    manifest = json.loads((matches[0] / "manifest.json").read_text(encoding="utf-8"))
    dv = manifest["dataset_version"]
    assert dv == f"real-v{ver}" or dv.startswith("real-")
