"""Deltas de política cross-version."""

from __future__ import annotations


def policy_delta_lineage_stub(old_v: str, new_v: str) -> dict[str, str]:
    return {"from": old_v, "to": new_v}
