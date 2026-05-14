"""Consenso simples entre hashes de replay (quorum)."""

from __future__ import annotations

from typing import Any

from app.distributed_state.consistency_protocol import quorum_consistent


def replay_consensus(hashes: list[str], min_agree: int) -> dict[str, Any]:
    mode = max(set(hashes), key=hashes.count) if hashes else ""
    ok = quorum_consistent(hashes, min_agree=min_agree)
    return {"consistent": ok, "mode_hash": mode}
