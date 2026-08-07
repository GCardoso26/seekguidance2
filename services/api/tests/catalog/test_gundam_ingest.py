"""Testes Gundam: partition beta + resolve_apitcg_set."""

from app.tcg_adapters.sync_github_apitcg import resolve_apitcg_set
from app.tcg_adapters.sync_gundam import partition_gundam_cards


def test_resolve_gundam_set_prefers_explicit_id():
    card = {
        "_file_set": "gd01",
        "set": {"id": "gd01", "name": "Newtype Rising [GD01]"},
    }
    code, name = resolve_apitcg_set(card, default_code="GD")
    assert code == "gd01"
    assert name == "Newtype Rising [GD01]"


def test_resolve_gundam_beta_file_keeps_beta_set():
    card = {
        "_file_set": "beta",
        "id": "ST01-001",
        "code": "ST01-001",
        "set": {"id": "beta", "name": "Beta"},
    }
    code, name = resolve_apitcg_set(card, default_code="GD")
    assert code == "beta"
    assert name == "Beta"


def test_resolve_gundam_starter_from_file_when_set_missing():
    card = {"_file_set": "st01", "id": "ST01-001", "code": "ST01-001"}
    code, name = resolve_apitcg_set(card, default_code="GD")
    assert code == "st01"
    assert name == "st01"


def test_partition_gundam_skips_beta_duplicates_keeps_beta_only():
    cards = [
        {
            "_file_set": "st01",
            "id": "ST01-001",
            "code": "ST01-001",
            "set": {"id": "st01", "name": "Heroic Beginnings [ST01]"},
        },
        {
            "_file_set": "gd01",
            "id": "GD01-001",
            "code": "GD01-001",
            "set": {"id": "gd01", "name": "Newtype Rising [GD01]"},
        },
        {
            "_file_set": "beta",
            "id": "ST01-001",
            "code": "ST01-001",
            "set": {"id": "beta", "name": "Beta"},
        },
        {
            "_file_set": "beta",
            "id": "BETA-ONLY-1",
            "code": "BETA-ONLY-1",
            "set": {"id": "beta", "name": "Beta"},
        },
    ]
    authoritative, beta_only, skipped = partition_gundam_cards(cards)
    assert len(authoritative) == 2
    assert skipped == 1
    assert len(beta_only) == 1
    assert beta_only[0]["id"] == "BETA-ONLY-1"
    # Contagem de sync = únicos efetivos
    assert len(authoritative) + len(beta_only) == 3


def test_partition_gundam_empty_beta():
    cards = [
        {"_file_set": "gd02", "id": "GD02-001"},
        {"_file_set": "promotion", "id": "P-001"},
    ]
    authoritative, beta_only, skipped = partition_gundam_cards(cards)
    assert len(authoritative) == 2
    assert beta_only == []
    assert skipped == 0
