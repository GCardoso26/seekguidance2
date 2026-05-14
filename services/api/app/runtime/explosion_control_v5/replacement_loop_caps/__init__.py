"""Caps de loops de replacement."""

from __future__ import annotations

from typing import Any


def replacement_loop_caps_stub(depth: int, cap: int) -> dict[str, Any]:
    return {"capped": depth > cap, "assistant_notes": ["Replacement recursion bounded."]}
