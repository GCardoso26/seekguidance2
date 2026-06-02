from app.judge_prompts.registry import get_game_prompt_bundle


def test_mtg_prompt_has_stack_keywords():
    b = get_game_prompt_bundle("mtg")
    assert "stack" in b.system_prompt.lower()
    assert b.few_shot_block


def test_unknown_game_default():
    b = get_game_prompt_bundle("unknown_game_xyz")
    assert "português" in b.system_prompt.lower() or "regras" in b.system_prompt.lower()
