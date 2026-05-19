"""Catálogo de PDFs oficiais por TCG (URLs whitelisted)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OfficialPdf:
    url: str
    doc_type: str
    title: str
    publisher: str


# URLs oficiais (publisher sites). Atualizar quando houver nova edição.
TCG_OFFICIAL_PDFS: dict[str, list[OfficialPdf]] = {
    "pokemon": [
        OfficialPdf(
            url="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/jtg_rulebook_en.pdf",
            doc_type="CR",
            title="Pokémon TCG Rulebook",
            publisher="The Pokémon Company International",
        ),
        OfficialPdf(
            url="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-deck-list-a4-dri.pdf",
            doc_type="FORMAT_STANDARD",
            title="Play! Pokémon TCG Standard Format — Regulation & Deck List",
            publisher="The Pokémon Company International",
        ),
        OfficialPdf(
            url="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-deck-list-85x11-dri.pdf",
            doc_type="FORMAT_EXPANDED",
            title="Play! Pokémon TCG Expanded Format — Regulation & Deck List",
            publisher="The Pokémon Company International",
        ),
        OfficialPdf(
            url="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-tournament-rules-handbook-05152024-en.pdf",
            doc_type="MTR",
            title="Play! Pokémon TCG Tournament Rules Handbook",
            publisher="The Pokémon Company International",
        ),
    ],
    "lorcana": [
        OfficialPdf(
            url="https://files.disneylorcana.com/Disney-Lorcana-Comprehensive-Rules-020526-EN-Edited.pdf",
            doc_type="CR",
            title="Disney Lorcana TCG Comprehensive Rules",
            publisher="Ravensburger",
        ),
        OfficialPdf(
            url="https://files.disneylorcana.com/Disney-Lorcana-Tournament-Rules-090925-EN.pdf",
            doc_type="MTR",
            title="Disney Lorcana TCG Tournament Rules",
            publisher="Ravensburger",
        ),
    ],
    "yugioh": [
        OfficialPdf(
            url="https://img.yugioh-card.com/ygo_cms/ygo/all/uploads/Rulebook_v9_en.pdf",
            doc_type="CR",
            title="Yu-Gi-Oh! TRADING CARD GAME Official Rulebook",
            publisher="Konami",
        ),
        OfficialPdf(
            url="https://www.yugioh-card.com/en/downloads/penalty_guide/YGOTCG_Tournament_Policy_v_2_5.pdf",
            doc_type="MTR",
            title="Yu-Gi-Oh! TCG Tournament Policy v2.5",
            publisher="Konami",
        ),
    ],
    "onepiece": [
        OfficialPdf(
            url="https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260116=",
            doc_type="CR",
            title="ONE PIECE CARD GAME Comprehensive Rules",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://en.onepiece-cardgame.com/pdf/tournament_rules_manual.pdf?20260116=",
            doc_type="MTR",
            title="ONE PIECE CARD GAME Tournament Rules Manual",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://asia-en.onepiece-cardgame.com/pdf/rule_floorrules.pdf?20241011=",
            doc_type="IPG",
            title="ONE PIECE CARD GAME Floor Rules",
            publisher="Bandai",
        ),
    ],
}


def list_official_pdfs(game_slug: str) -> list[OfficialPdf]:
    return list(TCG_OFFICIAL_PDFS.get(game_slug, []))
