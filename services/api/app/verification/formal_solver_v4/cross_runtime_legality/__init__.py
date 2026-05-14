"""Legalidade cross-runtime (solver vs replay, assistente)."""

from __future__ import annotations

from typing import Any


def cross_runtime_legality_stub(solver_ok: bool, replay_ok: bool) -> dict[str, Any]:
    aligned = solver_ok == replay_ok
    return {
        "solver_ok": solver_ok,
        "replay_ok": replay_ok,
        "aligned": aligned,
        "legality_reasoning": ["Alinhamento mede acordo de artefactos, não verdade absoluta."],
        "proof_steps": [{"step": 1, "action": "compare_flags"}],
        "assistant_notes": ["Desalinhamento aciona revisão humana."],
        "replay_legality_summary": (
            "Solver e replay concordam." if aligned else "Solver e replay divergem; investigar."
        ),
    }
