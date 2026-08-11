from app.catalog.game_codes import resolve_game_code


def test_resolve_game_code_accepts_slug_and_code():
    assert resolve_game_code("yugioh") == "YGO"
    assert resolve_game_code("YGO") == "YGO"
    assert resolve_game_code("onepiece") == "ONEPIECE"
    assert resolve_game_code("db-fusion-world") == "DBFW"
    assert resolve_game_code("dbfw") == "DBFW"
