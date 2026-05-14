"""Extração heurística de secções (caminho para parsing formal por documento)."""

from __future__ import annotations

import re
from typing import Any


_SECTION = re.compile(r"^\s{0,3}(#{1,3})\s+(.+)$", re.MULTILINE)


def extract_semantic_sections(text: str) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for m in _SECTION.finditer(text):
        level = len(m.group(1))
        title = m.group(2).strip()
        sections.append({"level": level, "title": title, "kind": "heading"})
    if not sections and text.strip():
        sections.append({"level": 0, "title": "body", "kind": "implicit"})
    return sections
