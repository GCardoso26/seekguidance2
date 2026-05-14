"""Validação de checksum (bytes → SHA-256)."""

from __future__ import annotations

import hashlib


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def assert_checksum(data: bytes, expected_hex: str) -> bool:
    return sha256_bytes(data).lower() == expected_hex.strip().lower()
