"""Violações de ordenação explícita e mutex."""

from __future__ import annotations

from typing import Any


def ordering_violations(roles: list[str], must_precede: list[tuple[str, str]]) -> list[dict[str, Any]]:
    pos = {r: i for i, r in enumerate(roles)}
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for r in roles:
        if r in seen:
            out.append(
                {
                    "type": "duplicate_role",
                    "rules": [r],
                    "severity": "high",
                    "reason": "Duplicate semantic role in chain.",
                }
            )
        seen.add(r)
    for a, b in must_precede:
        if a in pos and b in pos and pos[a] > pos[b]:
            out.append(
                {
                    "type": "ordering_violation",
                    "rules": [a, b],
                    "severity": "critical",
                    "reason": f"{a} must precede {b} under game constraints.",
                }
            )
    return out


def mutex_violations(roles_present: set[str], mutex_pairs: list[tuple[str, str]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for a, b in mutex_pairs:
        if a in roles_present and b in roles_present:
            out.append(
                {
                    "type": "mutually_exclusive_roles",
                    "rules": [a, b],
                    "severity": "critical",
                    "reason": "Both roles cannot hold in the same minimal resolution path.",
                }
            )
    return out
