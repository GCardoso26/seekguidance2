"""Analytics de divergência de replay."""

from __future__ import annotations

from typing import Any


def replay_divergence_analytics_stub(hashes: set[str]) -> dict[str, Any]:
    return {"unique_replays": len(hashes), "divergent": len(hashes) > 1}
