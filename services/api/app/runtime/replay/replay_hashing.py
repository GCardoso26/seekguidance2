"""Hashing determinístico para replay."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def deterministic_hash(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
