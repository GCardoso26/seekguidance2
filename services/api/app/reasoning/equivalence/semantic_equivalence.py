"""Equivalência semântica profunda (normalização + hash estável)."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def semantic_hash(normalized: dict[str, Any]) -> str:
    blob = json.dumps(normalized, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()[:16]


def semantically_equivalent(a: dict[str, Any], b: dict[str, Any]) -> bool:
    return semantic_hash(a) == semantic_hash(b)
