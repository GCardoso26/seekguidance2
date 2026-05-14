"""Integração lazy com solvers externos (Z3 / PySMT / cvc5) — sem dependência hard."""

from __future__ import annotations

from typing import Any


def try_import_z3() -> Any | None:
    try:
        import z3  # type: ignore[import-not-found]

        return z3
    except Exception:
        return None


def external_solver_status() -> dict[str, Any]:
    return {"z3_available": try_import_z3() is not None, "pysmt": "lazy", "cvc5": "lazy"}
