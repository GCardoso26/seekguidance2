"""Segurança da normalização soft (nunca forçar equivalência forte)."""

from __future__ import annotations


def soft_normalization_safe(hard_equivalence_asserted: bool) -> dict[str, object]:
    return {"safe": not hard_equivalence_asserted, "hard_equivalence": hard_equivalence_asserted}
