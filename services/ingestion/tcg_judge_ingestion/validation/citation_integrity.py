"""Integridade de citações (URL + rule_path coerentes)."""

from __future__ import annotations


def citation_integrity_ok(*, source_url: str, rule_path: str | None) -> bool:
    if not source_url.startswith(("http://", "https://")):
        return False
    if rule_path is None:
        return True
    return len(rule_path.strip()) > 0
