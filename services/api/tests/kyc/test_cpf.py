"""Testes CPF / registro."""

from app.kyc.cpf import cpf_last4, is_valid_cpf, normalize_cpf


def test_normalize_cpf():
    assert normalize_cpf("123.456.789-09") == "12345678909"


def test_invalid_cpf_sequence():
    assert not is_valid_cpf("11111111111")


def test_valid_cpf_known():
    assert is_valid_cpf("52998224725")


def test_hash_cpf_deterministic(monkeypatch):
    monkeypatch.setenv("CPF_SALT", "test-salt-for-unit-tests-only")
    from importlib import reload

    import app.kyc.cpf as cpf_mod

    reload(cpf_mod)
    assert cpf_mod.hash_cpf("529.982.247-25") == cpf_mod.hash_cpf("52998224725")


def test_hash_cpf_uses_hmac_not_plain_sha256(monkeypatch):
    import hashlib

    monkeypatch.setenv("CPF_SALT", "another-test-salt")
    from importlib import reload

    import app.kyc.cpf as cpf_mod

    reload(cpf_mod)
    plain = hashlib.sha256(b"52998224725").hexdigest()
    assert cpf_mod.hash_cpf("52998224725") != plain


def test_cpf_last4():
    assert cpf_last4("52998224725") == "4725"
