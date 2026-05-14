"""PDF mutability, checksum lineage, snapshots reprodutíveis."""

from __future__ import annotations

import hashlib
from typing import Any


def archival_fingerprint(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()[:16]


def pdf_mutability_tracking(*, checksum_prev: str, checksum_new: str) -> dict[str, object]:
    return {"mutated": checksum_prev != checksum_new, "checksum_prev": checksum_prev, "checksum_new": checksum_new}


def semantic_diff_snapshot(a: str, b: str) -> dict[str, object]:
    return {"changed": a != b, "len_delta": len(b) - len(a)}


def replayable_ingestion_history(steps: list[str]) -> dict[str, Any]:
    return {"steps": list(steps), "deterministic": True}
