"""Addon formal em reasoning_v8+."""

from __future__ import annotations

from unittest.mock import MagicMock

from app.reasoning.formal_response_addon import augment_reasoning_v8_to_v11


def test_augment_disabled() -> None:
    s = MagicMock()
    s.reasoning_formal_explainability_enabled = False
    v8: dict = {"x": 1}
    o8, _, _, _ = augment_reasoning_v8_to_v11(
        s, game_slug="mtg", reasoning_v8=v8, reasoning_v9=None, reasoning_v10=None, reasoning_v11=None
    )
    assert o8 == v8
    assert "formal_proofs" not in o8


def test_augment_enabled_adds_keys() -> None:
    s = MagicMock()
    s.reasoning_formal_explainability_enabled = True
    v8 = {"formal_verification": {"ok": True}}
    o8, _, _, _ = augment_reasoning_v8_to_v11(
        s, game_slug="yugioh", reasoning_v8=v8, reasoning_v9=None, reasoning_v10=None, reasoning_v11=None
    )
    assert o8 is not None
    assert "formal_proofs" in o8
    assert o8["formal_verification"]["ok"] is True
