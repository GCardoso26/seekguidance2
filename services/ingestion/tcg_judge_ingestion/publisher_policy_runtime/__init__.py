"""Runtime de política de publisher."""

from __future__ import annotations

from typing import Any


def publisher_policy_runtime_stub(pub: str) -> dict[str, Any]:
    return {"publisher": pub, "errata_propagation": True, "assistant_notes": ["Policy deltas lineage."]}
