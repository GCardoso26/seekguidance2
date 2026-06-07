"""Testes dos adaptadores multi-TCG."""

from __future__ import annotations

from app.tcg_adapters.lorcana import LorcanaAdapter
from app.tcg_adapters.mtg import MtgAdapter
from app.tcg_adapters.pokemon import PokemonAdapter
from app.tcg_adapters.registry import get_adapter, list_tournament_games, normalize_game_code
from app.tcg_adapters.swu import SwuAdapter
from app.tcg_adapters.validation import count_cards


class TestRegistry:
    def test_lista_quatro_jogos_v1(self):
        games = list_tournament_games()
        codes = {g["code"] for g in games}
        assert codes == {"POKEMON", "LORCANA", "MTG", "SWU"}

    def test_normaliza_slug(self):
        assert normalize_game_code("pokemon") == "POKEMON"
        assert normalize_game_code("MTG") == "MTG"


class TestMtgAdapter:
    adapter = MtgAdapter()

    def test_parse_dec(self):
        raw = "4 Lightning Bolt\n4 Counterspell\n52 Island"
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        assert count_cards(deck.main_deck) == 60

    def test_valida_standard_60_cartas(self):
        raw = "\n".join(f"1 Card {i}" for i in range(60))
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert result.valid is True

    def test_rejeita_deck_pequeno(self):
        deck = self.adapter.parse_decklist("10 Lightning Bolt", "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert result.valid is False
        assert any(e.code == "DECK_TOO_SMALL" for e in result.errors)

    def test_commander_singleton(self):
        raw = "Commander: 1 Atraxa\n" + "\n".join(f"1 Card {i}" for i in range(100))
        deck = self.adapter.parse_decklist(raw, "COMMANDER")
        result = self.adapter.validate_decklist(deck)
        assert result.valid is True

    def test_sideboard_max_15(self):
        main = "\n".join(f"1 Main {i}" for i in range(60))
        sb = "\n".join(f"1 Side {i}" for i in range(16))
        deck = self.adapter.parse_decklist(f"{main}\nSideboard\n{sb}", "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert any(e.code == "SIDEBOARD_TOO_LARGE" for e in result.errors)


class TestPokemonAdapter:
    adapter = PokemonAdapter()

    def test_parse_ptcgo(self):
        raw = "Pokémon: 24\n4 Pikachu\nTrainer: 20\n4 Professor Research\nEnergy: 16\n16 Lightning Energy"
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        assert count_cards(deck.main_deck) == 24

    def test_energy_ilimitada_nao_dispara_too_many_copies(self):
        raw = "\n".join(["4 Pikachu"] + ["4 Lightning Energy" for _ in range(14)])
        deck = self.adapter.parse_decklist(raw, "STANDARD")
        assert count_cards(deck.main_deck) == 60
        result = self.adapter.validate_decklist(deck)
        assert not any(e.code == "TOO_MANY_COPIES" for e in result.errors)

    def test_exige_60_cartas(self):
        deck = self.adapter.parse_decklist("4 Pikachu\n4 Professor Research", "STANDARD")
        result = self.adapter.validate_decklist(deck)
        assert any(e.code in ("DECK_TOO_SMALL", "DECK_SIZE_EXACT") for e in result.errors)


class TestLorcanaAdapter:
    adapter = LorcanaAdapter()

    def test_exige_60_exatas(self):
        raw = "\n".join(f"1 Card {i}" for i in range(59))
        deck = self.adapter.parse_decklist(raw, "CONSTRUCTED")
        result = self.adapter.validate_decklist(deck)
        assert result.valid is False

    def test_banlist(self):
        raw = "\n".join(
            ["4 lorcana-banned-001"] + [f"1 Card {i}" for i in range(56)]
        )
        deck = self.adapter.parse_decklist(raw, "CONSTRUCTED")
        result = self.adapter.validate_decklist(deck)
        assert any(e.code == "BANNED_CARD" for e in result.errors)


class TestSwuAdapter:
    adapter = SwuAdapter()

    def test_50_cartas_3_copias(self):
        "\n".join(f"3 Card {i % 17}" for i in range(17))  # 51 cards worth of lines - need exactly 50
        # 17 lines * 3 = 51, adjust
        lines = []
        total = 0
        i = 0
        while total < 50:
            qty = min(3, 50 - total)
            lines.append(f"{qty} SWU Card {i}")
            total += qty
            i += 1
        deck = self.adapter.parse_decklist("\n".join(lines), "STANDARD")
        assert count_cards(deck.main_deck) == 50
        result = self.adapter.validate_decklist(deck)
        assert result.valid is True


class TestApiIntegration:
    def test_get_adapter_all(self):
        for code in ("POKEMON", "LORCANA", "MTG", "SWU"):
            adapter = get_adapter(code)
            assert len(adapter.supported_formats()) >= 2
