"""Helpers de validação partilhados."""

from __future__ import annotations

from collections import defaultdict

from app.tcg_adapters.types import (
    DeckCard,
    ParsedDecklist,
    ValidationIssue,
    ValidationResult,
    normalize_card_name,
)


def count_cards(cards: list[DeckCard]) -> int:
    return sum(c.quantity for c in cards)


def count_by_name(cards: list[DeckCard], *, use_normalized: bool = True) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for card in cards:
        key = normalize_card_name(card.name) if use_normalized else card.definition_id
        counts[key] += card.quantity
    return dict(counts)


def validate_size(
    deck: ParsedDecklist,
    *,
    min_size: int,
    max_size: int | None,
    exact: bool = False,
) -> list[ValidationIssue]:
    total = count_cards(deck.main_deck)
    issues: list[ValidationIssue] = []
    if total < min_size:
        issues.append(
            ValidationIssue(
                code="DECK_TOO_SMALL",
                message=f"Deck tem {total} cartas. Mínimo: {min_size}",
                rule_reference=f"{deck.tcg}:{deck.format}",
            )
        )
    if max_size is not None and total > max_size:
        issues.append(
            ValidationIssue(
                code="DECK_TOO_LARGE",
                message=f"Deck tem {total} cartas. Máximo: {max_size}",
            )
        )
    if exact and total != min_size:
        issues.append(
            ValidationIssue(
                code="DECK_SIZE_EXACT",
                message=f"Deck deve ter exatamente {min_size} cartas (tem {total})",
            )
        )
    return issues


def validate_copies(
    deck: ParsedDecklist,
    *,
    max_copies: int,
    unlimited_names: frozenset[str] | None = None,
    use_normalized: bool = True,
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    counts = count_by_name(deck.main_deck, use_normalized=use_normalized)
    unlimited = unlimited_names or frozenset()
    for name, qty in counts.items():
        if name in unlimited:
            continue
        if qty > max_copies:
            issues.append(
                ValidationIssue(
                    code="TOO_MANY_COPIES",
                    message=f"'{name}' aparece {qty} vezes. Máximo: {max_copies}",
                    cards_involved=[name],
                )
            )
    return issues


def validate_banlist(
    deck: ParsedDecklist,
    banlist: dict[str, str],
    fmt: str,
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    counts = count_by_name(deck.main_deck)
    for name, qty in counts.items():
        status = banlist.get(name)
        if status == "banned":
            issues.append(
                ValidationIssue(
                    code="BANNED_CARD",
                    message=f"'{name}' está banida em {fmt}",
                    cards_involved=[name],
                    rule_reference=f"{fmt} banlist",
                )
            )
        elif status == "restricted" and qty > 1:
            issues.append(
                ValidationIssue(
                    code="RESTRICTED_CARD",
                    message=f"'{name}' é restricted (máx. 1 cópia)",
                    cards_involved=[name],
                )
            )
    return issues


def build_result(
    deck: ParsedDecklist,
    errors: list[ValidationIssue],
    warnings: list[ValidationIssue] | None = None,
    banlist_version: str = "2026-06-01",
) -> ValidationResult:
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings or [],
        format_rules_applied=f"{deck.tcg}:{deck.format}",
        banlist_version=banlist_version,
    )
