"""Shorten RC stub assistant_notes."""
from __future__ import annotations

import re
from pathlib import Path

API = Path(__file__).resolve().parents[1] / "app"
pat = re.compile(r'"assistant_notes": \["[^"]+: sprint RC; operational release candidate\."\]')
rep = '"assistant_notes": ["sprint RC."]'
n = 0
for p in API.rglob("*.py"):
    t = p.read_text(encoding="utf-8")
    if "operational release candidate" not in t:
        continue
    nt = pat.sub(rep, t)
    if nt != t:
        p.write_text(nt, encoding="utf-8")
        n += 1
print("fixed", n)
