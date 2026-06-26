"""Testes CPF / registro."""

from app.kyc.cpf import cpf_last4, hash_cpf, is_valid_cpf, normalize_cpf


def test_normalize_cpf():
    assert normalize_cpf("123.456.789-09") == "12345678909"


def test_invalid_cpf_sequence():
    assert not is_valid_cpf("11111111111")


def test_valid_cpf_known():
    assert is_valid_cpf("52998224725")


def test_hash_cpf_deterministic():
    assert hash_cpf("529.982.247-25") == hash_cpf("52998224725")


def test_cpf_last4():
    assert cpf_last4("52998224725") == "4725"
