"""Explicações de diferenças de replay."""

from __future__ import annotations


def explain_replay_differences(diff_names: list[str]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for d in diff_names:
        out.append({"difference": d, "severity": "medium" if "mismatch" in d else "low"})
    return out
