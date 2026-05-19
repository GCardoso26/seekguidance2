"""Catálogo de PDFs oficiais por TCG (URLs whitelisted)."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

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
            "play-pokemon-tcg-tournament-handbook-en.pdf",
            fallback_urls=(
                f"{POKEMON_PLAY_RULES}play-pokemon-tournament-rules-handbook-en.pdf",
                f"{POKEMON_PLAY_RULES}play-pokemon-tournament-rules-handbook-05152024-en.pdf",
            ),
            doc_type="MTR",
            title="Play! Pokémon TCG Tournament Handbook",
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


# PDFs em data/ingest/<game>/ (Incapsula bloqueia download automático em datacenters).
LOCAL_PDF_FILENAMES: dict[tuple[str, str], tuple[str, ...]] = {
    ("pokemon", "MTR"): (
        "play-pokemon-tcg-tournament-handbook-en.pdf",
        "play-pokemon-tournament-rules-handbook-en.pdf",
    ),
}


def resolve_local_pdf(
    game_slug: str,
    doc_type: str,
    *,
    ingest_root: str | Path = "data/ingest",
) -> Path | None:
    names = LOCAL_PDF_FILENAMES.get((game_slug, doc_type))
    if not names:
        return None
    base = Path(ingest_root) / game_slug
    for name in names:
        path = base / name
        if path.is_file():
            return path.resolve()
    return None
