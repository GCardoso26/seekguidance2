"""Star Wars Unlimited no registry."""

from app.judge.registry import TCG_BETA, TCG_COMING_SOON, game_slug_for_tcg, tcg_id_for_game_slug


def test_swu_not_coming_soon() -> None:
    assert "swu" not in TCG_COMING_SOON
    assert game_slug_for_tcg("star_wars_unlimited") == "swu"


def test_swu_beta_flag() -> None:
    assert "swu" in TCG_BETA
    assert tcg_id_for_game_slug("swu") == "star_wars_unlimited"
