"""Asserções formais (hooks para futura SMT)."""

from __future__ import annotations

from typing import Any


def assert_formal_invariants(*, constraints_ok: bool, precedence_ok: bool, mutations_ok: bool) -> dict[str, Any]:
    passed = bool(constraints_ok and precedence_ok and mutations_ok)
    failed = []
    if not constraints_ok:
        failed.append("constraints")
    if not precedence_ok:
        failed.append("precedence")
    if not mutations_ok:
        failed.append("mutations")
    return {"verification_passed": passed, "failed_assertions": failed}
