"""Dry-run validation for GitHub Actions workflows (CI modernization)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml", "-q"])
    import yaml  # type: ignore

ROOT = Path(".github/workflows")
errors: list[str] = []

for path in sorted(ROOT.glob("*.yml")):
    try:
        docs = list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
        if not docs or docs[0] is None:
            raise ValueError("empty document")
        print(f"OK yaml {path.name}")
    except Exception as exc:  # noqa: BLE001
        msg = f"{path.name}: {exc}"
        errors.append(msg)
        print(f"FAIL yaml {msg}")

uses: set[str] = set()
nodes: set[str] = set()
pythons: set[str] = set()
timeouts: dict[str, list[int]] = {}

for path in ROOT.glob("*.yml"):
    text = path.read_text(encoding="utf-8")
    uses.update(re.findall(r"uses:\s*([^\s#]+)", text))
    nodes.update(re.findall(r"node-version:\s*[\"']?([^\s\"'#]+)", text))
    pythons.update(re.findall(r'python-version:\s*[\"\']?([^\s\"\'#]+)', text))
    # job-level timeouts (best-effort)
    for m in re.finditer(r"timeout-minutes:\s*(\d+)", text):
        timeouts.setdefault(path.name, []).append(int(m.group(1)))

print("--- uses ---")
for u in sorted(uses):
    print(u)
print("nodes:", sorted(nodes))
print("pythons:", sorted(pythons))
print("timeouts:", {k: sorted(set(v)) for k, v in sorted(timeouts.items())})

stale = []
for pin in (
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/setup-python@v5",
    "actions/upload-artifact@v4",
):
    for path in ROOT.glob("*.yml"):
        if pin in path.read_text(encoding="utf-8"):
            stale.append(f"{path.name} still has {pin}")

for path in ROOT.glob("*.yml"):
    text = path.read_text(encoding="utf-8")
    if re.search(r'node-version:\s*["\']?20\b', text):
        stale.append(f"{path.name} still on Node 20")
    if re.search(r'python-version:\s*["\']?3\.(11|12)\b', text):
        stale.append(f"{path.name} still on Python 3.11/3.12")

if stale:
    print("--- STALE ---")
    for s in stale:
        print(s)
    errors.extend(stale)

print("errors:", len(errors))
sys.exit(1 if errors else 0)
