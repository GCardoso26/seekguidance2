"""Validação estrutural de mutações."""

from __future__ import annotations

from typing import Any


class MutationValidationError(Exception):
    pass


def validate_mutation_dict(m: dict[str, Any]) -> None:
    if "mutation_type" not in m:
        raise MutationValidationError("mutation_type obrigatório")
