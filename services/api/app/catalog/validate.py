"""Validação de cartas normalizadas antes de persistir."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str]


def validate_card_payload(card: dict[str, Any]) -> ValidationResult:
    errors: list[str] = []
    if not card.get("game_code"):
        errors.append("game_code obrigatório")
    if not card.get("external_id"):
        errors.append("external_id obrigatório")
    if not card.get("name") or len(str(card["name"]).strip()) < 1:
        errors.append("name inválido")
    if not card.get("normalized_name"):
        errors.append("normalized_name obrigatório")
    return ValidationResult(is_valid=len(errors) == 0, errors=errors)
