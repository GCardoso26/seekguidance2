"""Federation sandbox v2 manifests."""

from __future__ import annotations

from pathlib import Path

REPO = Path(__file__).resolve().parents[4]


def test_topology_v2_manifest() -> None:
    p = REPO / "infra/runtime_federation_sandbox/topology_v2/federation.nodes.manifest.json"
    assert p.is_file()
