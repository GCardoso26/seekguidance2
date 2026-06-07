"""Lógica de conquistas."""

from __future__ import annotations

from typing import Any

ACHIEVEMENT_RULES: dict[str, callable] = {}


def _register(code: str):
    def deco(fn):
        ACHIEVEMENT_RULES[code] = fn
        return fn
    return deco


@_register("FIRST_TOURNAMENT")
def _first_tournament(ctx: dict[str, Any]) -> bool:
    return ctx.get("tournaments_played", 0) == 1


@_register("FIRST_WIN")
def _first_win(ctx: dict[str, Any]) -> bool:
    return ctx.get("tournaments_won", 0) >= 1 and ctx.get("placement") == 1


@_register("TOP_CUT_8")
def _top_cut(ctx: dict[str, Any]) -> bool:
    p = ctx.get("placement", 999)
    return 1 <= p <= 8


@_register("TOP_CUT_1")
def _champion(ctx: dict[str, Any]) -> bool:
    return ctx.get("placement") == 1


@_register("STREAK_3")
def _streak_3(ctx: dict[str, Any]) -> bool:
    return ctx.get("win_streak", 0) >= 3


@_register("STREAK_5")
def _streak_5(ctx: dict[str, Any]) -> bool:
    return ctx.get("win_streak", 0) >= 5


@_register("GAME_MASTER_POKEMON")
def _gm_pokemon(ctx: dict[str, Any]) -> bool:
    return ctx.get("game_code") == "POKEMON" and ctx.get("tournaments_played", 0) >= 50


@_register("GAME_MASTER_MTG")
def _gm_mtg(ctx: dict[str, Any]) -> bool:
    return ctx.get("game_code") == "MTG" and ctx.get("tournaments_played", 0) >= 50


@_register("GAME_MASTER_LORCANA")
def _gm_lorcana(ctx: dict[str, Any]) -> bool:
    return ctx.get("game_code") == "LORCANA" and ctx.get("tournaments_played", 0) >= 50


@_register("GAME_MASTER_SWU")
def _gm_swu(ctx: dict[str, Any]) -> bool:
    return ctx.get("game_code") == "SWU" and ctx.get("tournaments_played", 0) >= 50


@_register("MULTI_GAME")
def _multi_game(ctx: dict[str, Any]) -> bool:
    return ctx.get("distinct_games", 0) >= 4


@_register("PERFECT_SWISS")
def _perfect_swiss(ctx: dict[str, Any]) -> bool:
    return ctx.get("match_losses", 0) == 0 and ctx.get("match_wins", 0) >= 9


def codes_to_unlock(ctx: dict[str, Any]) -> list[str]:
    return [code for code, fn in ACHIEVEMENT_RULES.items() if fn(ctx)]
