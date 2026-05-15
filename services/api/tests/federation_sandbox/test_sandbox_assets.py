"""Sandbox federation assets."""
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]

def test_sandbox_examples_exist() -> None:
    sandbox = REPO / "infra/runtime_federation_sandbox"
    ex = sandbox / "examples"
    assert (ex / "edge_runtime_example.json").is_file()
    assert (sandbox / "docker_compose.runtime_sandbox.yml").is_file()
