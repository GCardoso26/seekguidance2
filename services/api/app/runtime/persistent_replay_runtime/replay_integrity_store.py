"""Verificação e registo de integridade de replay (hashes)."""

from __future__ import annotations

import hashlib
from typing import Any


def replay_integrity_hash_payload(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def replay_integrity_verify(expected_hash: str, payload: str) -> dict[str, Any]:
    actual = replay_integrity_hash_payload(payload)
    return {
        "expected_hash": expected_hash,
        "actual_hash": actual,
        "ok": expected_hash == actual,
        "assistant_notes": ["replay_integrity_store: comparação determinística de bytes."],
    }


def replay_integrity_record_metadata(replay_ref: str, integrity_hash: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "integrity_hash": integrity_hash,
        "replay_integrity_metadata": {"algorithm": "sha256", "scope": "payload_bytes"},
    }
