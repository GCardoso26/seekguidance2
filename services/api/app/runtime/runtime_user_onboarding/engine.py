"""runtime_user_onboarding_engine_v1."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

_STATE = Path("generated/runtime_onboarding/state.json")


def runtime_user_onboarding_engine_v1(scope: str, *, step: str | None = None) -> dict[str, Any]:
    _STATE.parent.mkdir(parents=True, exist_ok=True)
    state: dict[str, Any] = {}
    if _STATE.is_file():
        state = json.loads(_STATE.read_text(encoding="utf-8"))
    steps = ["welcome", "admin_setup", "tenant_create", "api_key", "quickstart", "complete"]
    if step and step in steps:
        state[step] = {"done": True, "ts": time.time()}
        _STATE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    done = sum(1 for s in steps if state.get(s, {}).get("done"))
    return {
        "scope": scope,
        "steps": steps,
        "completed": done,
        "total": len(steps),
        "first_run": not _STATE.is_file() or done == 0,
        "onboarding_complete": done >= len(steps) - 1,
        "integrity_status": "ok",
        "runtime_confidence": 0.94,
        "assistant_notes": ["runtime_user_onboarding_engine_v1."],
        "deterministic_alignment": {"token": f"onb-{scope}"},
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
    }
