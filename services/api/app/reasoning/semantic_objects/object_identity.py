"""Identidade estável através de mudanças de zona / transformações simbólicas."""

from __future__ import annotations


def lineage_for(object_id: str) -> str:
    base = object_id.rsplit("_", 1)[0] if "_" in object_id else object_id
    return f"lineage::{base}"


def identity_continuity_record(lineage_id: str, from_zone: str, to_zone: str, reason: str) -> dict[str, str]:
    return {
        "lineage_id": lineage_id,
        "from_zone": from_zone,
        "to_zone": to_zone,
        "reason": reason,
    }
