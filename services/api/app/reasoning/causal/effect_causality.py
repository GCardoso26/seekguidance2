"""Mapeamento leve de causalidade de efeitos."""

from __future__ import annotations


def replacement_causes_modified_event() -> tuple[str, str]:
    return ("ReplacementEffect", "ModifiedDamageOrZoneEvent")


def sba_follows_resolution() -> tuple[str, str]:
    return ("ResolutionComplete", "SBAProcessed")
