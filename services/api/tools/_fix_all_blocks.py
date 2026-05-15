"""Reformat __all__ blocks one entry per line."""
from __future__ import annotations

import re
from pathlib import Path

API = Path(__file__).resolve().parents[1]
FILES = [
    "app/api/openapi_runtime_real/__init__.py",
    "app/mobile_runtime/__init__.py",
    "app/observability/runtime_exporters/__init__.py",
    "app/offline_runtime/__init__.py",
    "app/runtime/persistent_replay_runtime/__init__.py",
    "app/runtime/pilot_runtime/__init__.py",
    "app/runtime/production_runtime/__init__.py",
    "app/runtime/replay_federation/__init__.py",
    "app/runtime/runtime_incident_management/__init__.py",
]


def fix(rel: str) -> None:
    p = API / rel
    text = p.read_text(encoding="utf-8")
    m = re.search(r"^__all__ = \[", text, re.M)
    if not m:
        return
    start = m.end()
    end = text.find("]", start)
    block = text[start:end]
    names = re.findall(r'"([^"]+)"', block)
    new_block = "\n" + "\n".join(f'    "{n}",' for n in names) + "\n"
    p.write_text(text[:start] + new_block + text[end:], encoding="utf-8")
    print("fixed", rel)


for f in FILES:
    fix(f)
