"""Parser semântico para texto de regras."""

from __future__ import annotations

import re
from typing import Any


def parse_semantic_text(rule_id: str, text: str) -> dict[str, Any]:
    t = (text or "").strip()
    tokens = [x for x in re.split(r"[\s,.;:()]+", t.lower()) if x]
    return {"rule_id": rule_id, "tokens": tokens[:256], "raw_text": t[:4000]}
