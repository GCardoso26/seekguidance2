"""Hashing determinístico de estados e transições simbólicas."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def _stable_blob(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)


def state_hash(state: dict[str, Any]) -> str:
    return hashlib.sha256(_stable_blob(state).encode("utf-8")).hexdigest()


def transition_hash(parent_hash: str, transition: dict[str, Any]) -> str:
    return hashlib.sha256(_stable_blob({"parent": parent_hash, "t": transition}).encode("utf-8")).hexdigest()


def semantic_checksum(semantic_slice: dict[str, Any]) -> str:
    return hashlib.sha256(_stable_blob(semantic_slice).encode("utf-8")).hexdigest()
