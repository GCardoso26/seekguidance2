from pathlib import Path

root = Path(__file__).resolve().parent / "app" / "mobile_runtime"
for p in root.glob("mobile_runtime_*.py"):
    t = p.read_text(encoding="utf-8")
    if '"dma-{scope}"' in t:
        p.write_text(
            t.replace('"token": "dma-{scope}"', '"token": f"dma-{device_id}"'),
            encoding="utf-8",
        )
for p in [root / "replay_sync_retry_runtime_v2.py", root / "mobile_snapshot_compaction_runtime.py"]:
    if p.is_file():
        t = p.read_text(encoding="utf-8")
        if '"dma-{scope}"' in t:
            p.write_text(
                t.replace('"token": "dma-{scope}"', '"token": f"dma-{device_id}"'),
                encoding="utf-8",
            )
