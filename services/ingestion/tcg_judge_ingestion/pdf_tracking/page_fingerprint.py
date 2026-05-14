"""Fingerprint por página (hash de texto da página PDF extraído)."""

from __future__ import annotations

import hashlib


def page_fingerprint(page_text: str, page_index: int) -> str:
    blob = f"{page_index}|{page_text}".encode()
    return hashlib.sha256(blob).hexdigest()
