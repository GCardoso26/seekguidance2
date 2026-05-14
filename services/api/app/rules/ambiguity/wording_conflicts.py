"""Conflitos de redação potencialmente ambíguos."""

from __future__ import annotations


def detect_wording_conflicts(text: str) -> list[str]:
    t = (text or "").lower()
    out: list[str] = []
    if "may" in t and "must" in t:
        out.append("optional_vs_mandatory_conflict")
    if "if able" in t:
        out.append("if_able_interpretation_risk")
    return out
