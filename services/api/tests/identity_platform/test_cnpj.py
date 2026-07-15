"""CNPJ checksum tests."""

from app.identity_platform.domain.cnpj import is_valid_cnpj, normalize_cnpj


def test_normalize_cnpj():
    assert normalize_cnpj("11.222.333/0001-81") == "11222333000181"


def test_reject_repeated_digits():
    assert not is_valid_cnpj("11111111111111")


def test_valid_known_cnpj():
    # Valid checksum example commonly used in docs
    assert is_valid_cnpj("04.252.011/0001-10")


def test_invalid_checksum():
    assert not is_valid_cnpj("11222333000100")
