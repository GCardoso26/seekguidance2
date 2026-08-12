"""Unit tests for CNPJ validation (ADR-018)."""

from app.stores.cnpj import format_cnpj, is_valid_cnpj, require_valid_cnpj
from app.stores.accreditation import publish_block_reason, store_can_publish_offers
from datetime import UTC, datetime, timedelta


def test_valid_known_cnpj():
    # CNPJ de exemplo com dígitos válidos (Receita formula)
    assert is_valid_cnpj("04.252.011/0001-10")
    assert format_cnpj("04252011000110") == "04.252.011/0001-10"


def test_invalid_cnpj():
    assert not is_valid_cnpj("00.000.000/0000-00")
    assert not is_valid_cnpj("123")
    try:
        require_valid_cnpj("11111111111111")
        assert False
    except ValueError:
        pass


def test_publish_requires_approval():
    pending = {
        "cnpj": "04.252.011/0001-10",
        "accreditation_status": "pending",
        "subscription_plan": "pending_accreditation",
    }
    assert store_can_publish_offers(pending) is False
    assert publish_block_reason(pending)


def test_grandfather_within_deadline():
    store = {
        "cnpj": None,
        "accreditation_status": "grandfathered",
        "subscription_plan": "free",
        "accreditation_deadline_at": datetime.now(UTC) + timedelta(days=10),
    }
    assert store_can_publish_offers(store) is True


def test_approved_paid_with_cnpj():
    store = {
        "cnpj": "04.252.011/0001-10",
        "accreditation_status": "approved",
        "subscription_plan": "lojista",
    }
    assert store_can_publish_offers(store) is True
