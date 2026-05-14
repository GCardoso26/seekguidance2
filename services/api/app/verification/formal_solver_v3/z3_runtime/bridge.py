"""Ponte determinística ao runtime Z3 (opcional)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.external_solvers import try_import_z3


def z3_deterministic_bridge() -> dict[str, Any]:
    z3 = try_import_z3()
    if z3 is None:
        return {"backend": "stub", "deterministic": True, "assistant_note": "Z3 não instalado; usar stubs."}
    return {"backend": "z3", "deterministic": True, "assistant_note": "Validação formal disponível internamente."}
