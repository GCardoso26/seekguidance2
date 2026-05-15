"""Remove duplicate tail after broken __all__ merge."""
from __future__ import annotations

import re
from pathlib import Path

API = Path(__file__).resolve().parents[1]

FILES = [
    API / "app/api/openapi_runtime_real/__init__.py",
    API / "app/runtime/replay_federation/__init__.py",
    API / "app/runtime/runtime_alignment/__init__.py",
]


def fix(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"^__all__ = \[", text, re.M)
    if not m:
        return
    start = m.start()
    rest = text[start:]
    depth = 0
    end_idx = None
    for i, ch in enumerate(rest):
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end_idx = start + i + 1
                break
    if end_idx is None:
        return
    tail = text[end_idx:].lstrip("\n")
    if not tail or tail.startswith("#"):
        return
    # trailing garbage after first complete __all__
    fixed = text[:end_idx] + "\n"
    path.write_text(fixed, encoding="utf-8")
    print(f"fixed {path.name}: removed {len(tail)} chars")


for f in FILES:
    if f.is_file():
        fix(f)
