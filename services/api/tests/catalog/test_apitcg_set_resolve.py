"""Testes de resolução de coleção (apitcg + slug)."""

from app.tcg_adapters.sync_common import slug_set_code
from app.tcg_adapters.sync_github_apitcg import resolve_apitcg_set


def test_slug_set_code_normalizes_punctuation():
    assert slug_set_code("BLEACH: Thousand-Year Blood War") == "bleach-thousand-year"
    assert slug_set_code("HUNTER X HUNTER") == "hunter-x-hunter"


def test_resolve_apitcg_set_uses_name_when_id_missing():
    card = {
        "_file_set": "general",
        "set": {"name": "HUNTER X HUNTER"},
    }
    code, name = resolve_apitcg_set(card, default_code="UA")
    assert code == "hunter-x-hunter"
    assert name == "HUNTER X HUNTER"


def test_resolve_apitcg_set_uses_file_set_when_no_set_object():
    card = {"_file_set": "promotion"}
    code, name = resolve_apitcg_set(card, default_code="FB")
    assert code == "promotion"
    assert name == "promotion"


def test_resolve_apitcg_set_prefers_explicit_id():
    card = {
        "_file_set": "fb04",
        "set": {"id": "promotion", "name": "Promotion"},
    }
    code, name = resolve_apitcg_set(card, default_code="FB")
    assert code == "promotion"
    assert name == "Promotion"


def test_resolve_apitcg_set_avoids_literal_none_string():
    card = {"set": {"id": None, "name": "UNION ARENA"}, "_file_set": "general"}
    code, _ = resolve_apitcg_set(card, default_code="UA")
    assert code != "None"
    assert code == "general"


def test_resolve_apitcg_set_slugifies_franchise_name():
    card = {
        "_file_set": "general",
        "set": {"name": "BLEACH: Thousand-Year Blood War"},
    }
    code, name = resolve_apitcg_set(card, default_code="UA")
    assert code == "bleach-thousand-year"
    assert name == "BLEACH: Thousand-Year Blood War"
