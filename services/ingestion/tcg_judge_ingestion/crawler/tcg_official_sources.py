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
    "fab": [
        OfficialPdf(
            url="https://dhhim4ltzu1pj.cloudfront.net/media/documents/FaB_Comprehensive_Rules_v2_10_1_access.pdf",
            fallback_urls=(
                "https://rules.fabtcg.com/en-fab-cr.pdf",
            ),
            doc_type="CR",
            title="Flesh and Blood Comprehensive Rules",
            publisher="Legend Story Studios",
            download_referer="https://rules.fabtcg.com/",
        ),
    ],
    "digimon": [
        OfficialPdf(
            url="https://world.digimoncard.com/rule/pdf/manual.pdf?20260401=",
            doc_type="CR",
            title="Digimon Card Game Official Rule Manual",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://world.digimoncard.com/rule/pdf/general_rule.pdf?20260401=",
            doc_type="CR_ADV",
            title="Digimon Card Game Comprehensive Rules Manual",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://world.digimoncard.com/event/online_event/pdf/tournament_rules.pdf?20240606=",
            doc_type="MTR",
            title="Digimon Card Game Tournament Rules Manual",
            publisher="Bandai",
        ),
    ],
    "gundam": [
        OfficialPdf(
            url="https://www.gundam-gcg.com/en/pdf/comprehensiverules_en.pdf",
            doc_type="CR",
            title="Gundam Card Game Comprehensive Rules",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://www.gundam-gcg.com/en/pdf/floor_rule_en.pdf?2508291=",
            doc_type="MTR",
            title="Gundam Card Game Tournament Rules Manual",
            publisher="Bandai",
        ),
    ],
    "dbfw": [
        OfficialPdf(
            url="https://www.dbs-cardgame.com/fw/pdf/rules/fw_comprehensive_rules_en.pdf",
            doc_type="CR",
            title="Dragon Ball Super Card Game Fusion World Rule Manual",
            publisher="Bandai",
        ),
    ],
    "sorcery": [
        # Download automático bloqueado (redirect HTML). Usar PDF em data/ingest/sorcery/.
        OfficialPdf(
            url="https://sorcerytcg.com/how-to-play",
            doc_type="CR",
            title="Sorcery: Contested Realm Rulebook",
            publisher="Erik's Curiosa",
        ),
    ],
    "vanguard": [
        OfficialPdf(
            url="https://en.cf-vanguard.com/wordpress/wp-content/uploads/Cardfight-Vanguard-Comprehensive-Rules-4.52.pdf",
            fallback_urls=(
                "https://en.cf-vanguard.com/wordpress/wp-content/uploads/Cardfight-Vanguard-Comprehensive-Rules-4.42.pdf",
            ),
            doc_type="CR",
            title="Cardfight!! Vanguard Comprehensive Rules",
            publisher="Bushiroad",
        ),
    ],
    "riftbound": [
        OfficialPdf(
            url="https://riftbound.gg/wp-content/uploads/sites/67/2025/06/Riftbound-Core-Rules-2025-06-02.pdf",
            doc_type="CR",
            title="Riftbound Core Rules",
            publisher="Riot Games",
        ),
    ],
    "union_arena": [
        OfficialPdf(
            url="https://www.unionarena-tcg.com/na/pdf/rule_manual.pdf",
            doc_type="CR",
            title="Union Arena Official Rule Manual",
            publisher="Bandai",
        ),
        OfficialPdf(
            url="https://www.unionarena-tcg.com/na/pdf/tournament_rules_manual.pdf?v20250522=",
            doc_type="MTR",
            title="Union Arena Tournament Rules Manual",
            publisher="Bandai",
        ),
    ],
}

# Alias de slug Postgres → chave do catálogo (ingest_tcg --game)
INGEST_GAME_ALIASES: dict[str, str] = {
    "flesh_and_blood": "fab",
    "dragon_ball": "dbfw",
    "dragon_ball_super_fusion_world": "dbfw",
}


def resolve_ingest_game_slug(raw: str) -> str:
    g = raw.strip().lower().replace("-", "_")
    return INGEST_GAME_ALIASES.get(g, g)


def list_official_pdfs(game_slug: str) -> list[OfficialPdf]:
    slug = resolve_ingest_game_slug(game_slug)
    return list(TCG_OFFICIAL_PDFS.get(slug, []))


# PDFs em data/ingest/<game>/ (download automático bloqueado ou indisponível).
LOCAL_PDF_FILENAMES: dict[tuple[str, str], tuple[str, ...]] = {
    ("pokemon", "MTR"): (
        "play-pokemon-tcg-tournament-handbook-en.pdf",
        "play-pokemon-tournament-rules-handbook-en.pdf",
    ),
    ("sorcery", "CR"): (
        "Sorcery-Contested-Realm-Rulebook-October-2024.pdf",
        "Sorcery-Contested-Realm-Rulebook.pdf",
        "Sorcery-Rulebook.pdf",
        "sorcery-rulebook.pdf",
    ),
}

# Não tentar download HTTP — só ficheiro local (ver LOCAL_PDF_FILENAMES).
LOCAL_PDF_ONLY: frozenset[tuple[str, str]] = frozenset({("sorcery", "CR")})


def resolve_local_pdf(
    game_slug: str,
    doc_type: str,
    *,
    ingest_root: str | Path = "data/ingest",
) -> Path | None:
    slug = resolve_ingest_game_slug(game_slug)
    names = LOCAL_PDF_FILENAMES.get((slug, doc_type))
    if not names:
        return None
    base = Path(ingest_root) / slug
    for name in names:
        path = base / name
        if path.is_file():
            return path.resolve()
    return None


def local_ingest_hint(
    game_slug: str,
    doc_type: str,
    *,
    ingest_root: str | Path = "data/ingest",
) -> str:
    slug = resolve_ingest_game_slug(game_slug)
    names = LOCAL_PDF_FILENAMES.get((slug, doc_type), ())
    folder = (Path(ingest_root) / slug).resolve()
    names_txt = ", ".join(names) if names else "rulebook.pdf"
    origin = "https://sorcerytcg.com/how-to-play"
    if slug == "sorcery":
        origin = "https://sorcerytcg.com/how-to-play (link «Rulebook» / December 2025 update)"
    return (
        f"PDF local obrigatório para {slug}/{doc_type}. "
        f"Coloque um destes ficheiros em {folder}: {names_txt}. "
        f"Origem: {origin}. "
        f"Depois: python scripts/ingest_tcg.py --game {slug} --all"
    )
