"""Extensões opcionais de explainability formal em `reasoning_v8`–`reasoning_v11` (additive)."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings


def _stub_extensions(*, game_slug: str) -> dict[str, Any]:
    return {
        "formal_proofs": [{"id": "stub", "kind": "legality_sketch", "game": game_slug}],
        "proof_conflicts": [],
        "solver_trace": ["compile", "solve_stub"],
        "proof_constraints": ["priority_window_open", "stack_legal"],
        "legality_proof_path": ["assume", "check", "replay_bind"],
        "timing_proof_path": ["windows", "ordering_stub"],
    }


def augment_reasoning_v8_to_v11(
    settings: Settings,
    *,
    game_slug: str,
    reasoning_v8: dict[str, Any] | None,
    reasoning_v9: dict[str, Any] | None,
    reasoning_v10: dict[str, Any] | None,
    reasoning_v11: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None, dict[str, Any] | None, dict[str, Any] | None]:
    """Anexa chaves apenas quando `reasoning_formal_explainability_enabled` está ativo."""
    if not settings.reasoning_formal_explainability_enabled:
        return reasoning_v8, reasoning_v9, reasoning_v10, reasoning_v11
    ext = _stub_extensions(game_slug=game_slug)

    def _merge(block: dict[str, Any] | None) -> dict[str, Any] | None:
        if block is None:
            return None
        merged = dict(block)
        for k, v in ext.items():
            merged.setdefault(k, v)
        return merged

    return _merge(reasoning_v8), _merge(reasoning_v9), _merge(reasoning_v10), _merge(reasoning_v11)
