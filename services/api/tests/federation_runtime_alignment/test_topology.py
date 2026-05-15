"""Federation topology assets."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_federation_topology_json() -> None:
    p = REPO / "infra/runtime_federation_sandbox/topology/federation.runtime.topology.json"
    assert p.is_file()
