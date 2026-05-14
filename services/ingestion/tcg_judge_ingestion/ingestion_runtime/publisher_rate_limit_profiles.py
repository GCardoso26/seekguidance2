"""Perfis de rate limit por publisher."""

from __future__ import annotations


def rate_limit_for_publisher(publisher: str) -> dict[str, float]:
    base = {"requests_per_s": 2.0, "burst": 5.0}
    if publisher.lower() in {"wizards", "konami"}:
        base["requests_per_s"] = 1.0
    return base
