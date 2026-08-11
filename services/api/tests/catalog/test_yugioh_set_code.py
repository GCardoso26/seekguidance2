"""YGO: YGOPRODeck embeds collector number in card_sets[].set_code."""

from app.tcg_adapters.sync_yugioh import parse_ygo_set_printing


def test_parse_ygo_set_printing_splits_collector_number():
    assert parse_ygo_set_printing("MAMO-EN015") == ("MAMO", "MAMO-EN015")
    assert parse_ygo_set_printing("BLCR-EN012") == ("BLCR", "BLCR-EN012")
    assert parse_ygo_set_printing("SBCB-ENS08") == ("SBCB", "SBCB-ENS08")
    assert parse_ygo_set_printing("DB2-EN212") == ("DB2", "DB2-EN212")


def test_parse_ygo_set_printing_keeps_bare_set_code():
    assert parse_ygo_set_printing("MAMO") == ("MAMO", "MAMO")
    assert parse_ygo_set_printing(None) == (None, None)
    assert parse_ygo_set_printing("") == (None, None)
