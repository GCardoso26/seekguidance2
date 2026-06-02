"""Mapeamento TCG do judge público → slug Postgres."""

from __future__ import annotations

from app.judge.registry import TCG_COMING_SOON, TCG_GAME_SLUG


def test_judge_slug_mapping_multi_tcg() -> None:
    assert TCG_GAME_SLUG["flesh_and_blood"] == "fab"
    assert TCG_GAME_SLUG["dragon_ball"] == "dbfw"
    assert TCG_GAME_SLUG["union_arena"] == "union_arena"
    assert TCG_GAME_SLUG["sorcery"] == "sorcery"


def test_ingestible_tcgs_not_coming_soon() -> None:
    for tcg in (
        "fab",
        "flesh_and_blood",
        "gundam",
        "digimon",
        "dragon_ball",
        "dbfw",
        "sorcery",
        "vanguard",
        "riftbound",
        "union_arena",
    ):
        assert tcg not in TCG_COMING_SOON, tcg
