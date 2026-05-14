"""Normalização textual pré-chunking (Unicode, espaços)."""

from __future__ import annotations

import re
import unicodedata


def normalize_for_index(text: str) -> str:
    t = unicodedata.normalize("NFKC", text)
    t = re.sub(r"\s+", " ", t).strip()
    return t
