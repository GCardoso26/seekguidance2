"""Legalidade cross-version — casos executáveis."""

from __future__ import annotations

from typing import Any


def executable_cross_version_legality_stub(v_old: str, v_new: str) -> dict[str, Any]:
    return {
        "from": v_old,
        "to": v_new,
        "assistant_notes": ["Verificar supersession e errata antes de marcar regressão."],
    }
