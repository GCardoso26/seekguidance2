"""Parsers de decklist por formato de texto."""

from __future__ import annotations

import json
import re

from app.tcg_adapters.types import DeckCard, ParsedDecklist, normalize_card_name

_LINE_RE = re.compile(
    r"^(?P<qty>\d+)\s+(?P<name>.+?)(?:\s+\((?P<set>[A-Z0-9]+)\)\s*(?P<num>\d+))?$",
    re.IGNORECASE,
)
_ARENA_RE = re.compile(r"^(?P<qty>\d+)\s+(?P<name>.+)$")


def _card_from_line(
    qty: int,
    name: str,
    set_code: str | None = None,
    collector_number: str | None = None,
    card_type: str | None = None,
) -> DeckCard:
    norm = normalize_card_name(name)
    return DeckCard(
        definition_id=norm.replace(" ", "-"),
        name=name.strip(),
        quantity=qty,
        set_code=set_code,
        collector_number=collector_number,
        card_type=card_type,
    )


def parse_generic_lines(raw: str, tcg: str, fmt: str) -> ParsedDecklist:
    main: list[DeckCard] = []
    sideboard: list[DeckCard] = []
    section = "main"
    commander: DeckCard | None = None

    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("#"):
            continue
        lower = stripped.lower()
        if lower in ("sideboard", "sb:", "side board"):
            section = "sideboard"
            continue
        if lower.startswith("commander:"):
            rest = stripped.split(":", 1)[1].strip()
            m = _LINE_RE.match(rest) or _ARENA_RE.match(rest)
            if m:
                commander = _card_from_line(int(m.group("qty")), m.group("name"))
            continue
        if lower.startswith("deck") or lower.startswith("maindeck"):
            section = "main"
            continue

        m = _LINE_RE.match(stripped) or _ARENA_RE.match(stripped)
        if not m:
            continue
        card = _card_from_line(
            int(m.group("qty")),
            m.group("name"),
            m.groupdict().get("set"),
            m.groupdict().get("num"),
        )
        if section == "sideboard":
            sideboard.append(card)
        else:
            main.append(card)

    return ParsedDecklist(tcg=tcg, format=fmt, main_deck=main, sideboard=sideboard, commander=commander)


def parse_ptcgo(raw: str, fmt: str) -> ParsedDecklist:
    """Parser Pokémon — PTCGO / texto com secções Pokémon/Trainer/Energy."""
    if raw.strip().startswith("{"):
        data = json.loads(raw)
        main = [
            _card_from_line(int(c.get("quantity", 1)), c["name"], c.get("set"), c.get("number"), c.get("type"))
            for c in data.get("main_deck", data.get("cards", []))
        ]
        return ParsedDecklist(tcg="pokemon", format=fmt, main_deck=main)

    main: list[DeckCard] = []
    card_type: str | None = None
    _section = re.compile(
        r"^(pokémon|pokemon|trainer|treinador|energy|energia)\s*:\s*\d*\s*$",
        re.IGNORECASE,
    )
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        section_m = _section.match(stripped)
        if section_m:
            header = section_m.group(1).lower()
            if "pokémon" in header or "pokemon" in header:
                card_type = "pokemon"
            elif "trainer" in header or "treinador" in header:
                card_type = "trainer"
            elif "energy" in header or "energia" in header:
                card_type = "energy"
            continue
        m = _LINE_RE.match(stripped) or _ARENA_RE.match(stripped)
        if m:
            main.append(_card_from_line(int(m.group("qty")), m.group("name"), card_type=card_type))
    return ParsedDecklist(tcg="pokemon", format=fmt, main_deck=main)


def parse_mtg_dec(raw: str, fmt: str) -> ParsedDecklist:
    return parse_generic_lines(raw, "mtg", fmt)


def parse_lorcana(raw: str, fmt: str) -> ParsedDecklist:
    if raw.strip().startswith("{"):
        data = json.loads(raw)
        main = [
            _card_from_line(int(c.get("quantity", 1)), c["name"])
            for c in data.get("main_deck", data.get("cards", []))
        ]
        return ParsedDecklist(tcg="lorcana", format=fmt, main_deck=main)
    return parse_generic_lines(raw, "lorcana", fmt)
