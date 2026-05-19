"""Catálogo de PDFs oficiais por TCG (URLs whitelisted)."""

from __future__ import annotations

from dataclasses import dataclass, field

# Warmup play.pokemon.com antes de PDFs em pokemon.com (reduz bloqueio Incapsula em alguns IPs).
POKEMON_PLAY_DOCUMENTS = "https://play.pokemon.com/en-us/resources/documents/"
POKEMON_PLAY_RULES = "https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/"


@dataclass(frozen=True)
class OfficialPdf:
    url: str
    doc_type: str
    title: str
    publisher: str
    kind: str = "pdf"  # pdf | html
    fallback_urls: tuple[str, ...] = field(default_factory=tuple)
    download_referer: str | None = None
    download_warmup_url: str | None = None


def _pokemon_pdf(path: str, **kwargs) -> OfficialPdf:
    """PDF Play! Pokémon em pokemon.com com warmup opcional."""
    return OfficialPdf(
        url=f"{POKEMON_PLAY_RULES}{path}",
        download_referer=POKEMON_PLAY_DOCUMENTS,
        download_warmup_url=POKEMON_PLAY_DOCUMENTS,
        publisher="The Pokémon Company International",
        **kwargs,
    )


# URLs oficiais (publisher sites). Atualizar quando houver nova edição.
TCG_OFFICIAL_PDFS: dict[str, list[OfficialPdf]] = {
    "pokemon": [
        OfficialPdf(
            url="https://assets.pokemon.com/assets/cms2/pdf/trading-card-game/rulebook/swsh10_rulebook_en.pdf",
            fallback_urls=(
                "https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/jtg_rulebook_en.pdf",
                "https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/dri_rulebook_en.pdf",
            ),
            doc_type="CR",
            title="Pokémon TCG Rulebook",
            publisher="The Pokémon Company International",
        ),
        _pokemon_pdf(
            "play-pokemon-deck-list-a4-tef.pdf",
            fallback_urls=(
                f"{POKEMON_PLAY_RULES}play-pokemon-deck-list-a4-dri.pdf",
            ),
            doc_type="FORMAT_STANDARD",
            title="Play! Pokémon TCG Standard Format — Regulation & Deck List (TEf)",
        ),
        _pokemon_pdf(
            "play-pokemon-deck-list-85x11-tef.pdf",
            fallback_urls=(
                f"{POKEMON_PLAY_RULES}play-pokemon-deck-list-85x11-dri.pdf",
            ),
            doc_type="FORMAT_EXPANDED",
            title="Play! Pokémon TCG Expanded Format — Regulation & Deck List (TEf)",
        ),
        _pokemon_pdf(
            "play-pokemon-tcg-tournament-handbook-en.pdf",
            fallback_urls=(
                f"{POKEMON_PLAY_RULES}play-pokemon-tournament-rules-handbook-en.pdf",
                f"{POKEMON_PLAY_RULES}play-pokemon-tournament-rules-handbook-05152024-en.pdf",
            ),
            doc_type="MTR",
            title="Play! Pokémon TCG Tournament Handbook",
        ),
        # Resumo HTML (rotation / legality) quando PDFs em pokemon.com estiverem bloqueados.
        OfficialPdf(
            url="https://play.pokemon.com/en-us/resources/rules/?category=tcg",
            kind="html",
            doc_type="FORMAT_NOTES",
            title="Play! Pokémon TCG — Competitive formats overview",
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
            url="https://files.disneylorcana.com/Disney%20Lorcana%20TCG%20Tournament%20Rules%20S2_09-Sep-25.pdf",
            doc_type="MTR",
            title="Disney Lorcana TCG Tournament Rules",
            publisher="Ravensburger",
        ),
    ],
    "yugioh": [
        OfficialPdf(
            url="https://img.yugioh-card.com/eu/wp-content/uploads/2022/07/Rulebook_v9_en.pdf",
            fallback_urls=(
                "https://img.yugioh-card.com/ygo_cms/ygo/all/uploads/Rulebook_v9_en.pdf",
            ),
            doc_type="CR",
            title="Yu-Gi-Oh! TRADING CARD GAME Official Rulebook",
            publisher="Konami",
        ),
        OfficialPdf(
            url="https://img.yugioh-card.com/en/downloads/penalty_guide/YGOTCG_Tournament_Policy_v_2_5.pdf",
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
