import json
import sys
from pathlib import Path

metrics = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "interactive",
    "speed-index",
]

for path in sys.argv[1:]:
    p = Path(path)
    if not p.exists():
        print(f"=== {p.name} (missing) ===\n")
        continue
    d = json.loads(p.read_text(encoding="utf-8"))
    form = d.get("configSettings", {}).get("formFactor", "?")
    print(f"=== {p.name} ({form}) ===")
    print("URL:", d.get("requestedUrl") or d.get("finalUrl"))
    for k, v in d["categories"].items():
        if v.get("score") is not None:
            print(f"  {k}: {int(v['score'] * 100)}")
    for k in metrics:
        a = d["audits"].get(k, {})
        if a.get("displayValue"):
            print(f"  {k}: {a['displayValue']}")
    print()
