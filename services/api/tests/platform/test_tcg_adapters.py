"""Parsers e validação — suite consolidada."""

from __future__ import annotations

from app.tcg_adapters.lorcana import LorcanaAdapter
from app.tcg_adapters.mtg import MtgAdapter
from app.tcg_adapters.pokemon import PokemonAdapter
from app.tcg_adapters.registry import list_tournament_games, normalize_game_code
from app.tcg_adapters.swu import SwuAdapter
from app.tcg_adapters.validation import count_cards


class TestRegistry:
    def test_four_games(self):
        codes = {g["code"] for g in list_tournament_games()}
        assert codes == {"POKEMON", "LORCANA", "MTG", "SWU"}

    def test_normalize_game_code(self):
        assert normalize_game_code("mtg") == "MTG"


class TestMtgAdapter:
    adapter = MtgAdapter()

    def test_mtg_dec_parse(self):
        deck = self.adapter.parse_decklist("4 Lightning Bolt\n56 Island", "STANDARD")
        assert count_cards(deck.main_deck) == 60

    def test_mtg_deck_too_small(self):
        deck = self.adapter.parse_decklist("10 Lightning Bolt", "STANDARD")
        assert self.adapter.validate_decklist(deck).valid is False


class TestPokemonAdapter:
    adapter = PokemonAdapter()

    def test_pokemon_energy_unlimited(self):
        raw = "\n".join(["4 Pikachu"] + ["4 Lightning Energy" for _ in range(14)])
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert not any(e.code == "TOO_MANY_COPIES" for e in result.errors)


class TestLorcanaAdapter:
    adapter = LorcanaAdapter()

    def test_lorcana_exact_60(self):
        raw = "1 Mickey Mouse\n" + "\n".join(f"1 Card {i}" for i in range(59))
        deck = self.adapter.parse_decklist(raw, "CONSTRUCTED")
        result = self.adapter.validate_decklist(deck)
        assert count_cards(deck.main_deck) == 60


class TestSwuAdapter:
    adapter = SwuAdapter()

    def test_swu_validation_60_cards(self):
        raw = "\n".join(f"1 Unit {i % 10}" for i in range(60))
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert count_cards(deck.main_deck) == 60
