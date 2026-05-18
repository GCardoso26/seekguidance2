from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
NAMES = [
    "executable_real_minimal_runtime_v34",
    "executable_real_auth_v34",
    "executable_real_replay_v34",
]


@pytest.mark.parametrize("name", NAMES)
def test_dataset_v34_manifest(name: str) -> None:
    root = API / "evaluation/runtime_execution" / name
    assert (root / "manifest.json").is_file()
    assert (root / "validation.json").is_file()
