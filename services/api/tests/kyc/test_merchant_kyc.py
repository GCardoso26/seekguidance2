"""Testes KYC lojista — mapeamento Stripe Account."""

from app.kyc.merchant_kyc import stripe_account_to_kyc_status


def test_verified_requires_charges_and_payouts():
    status, reason = stripe_account_to_kyc_status(
        {"charges_enabled": True, "payouts_enabled": True, "requirements": {}}
    )
    assert status == "verified"
    assert reason is None


def test_charges_without_payouts_is_restricted():
    status, reason = stripe_account_to_kyc_status(
        {"charges_enabled": True, "payouts_enabled": False, "requirements": {}}
    )
    assert status == "restricted"
    assert "bancária" in (reason or "").lower()


def test_disabled_reason_rejected():
    status, reason = stripe_account_to_kyc_status(
        {
            "charges_enabled": False,
            "payouts_enabled": False,
            "requirements": {"disabled_reason": "rejected.fraud"},
        }
    )
    assert status == "rejected"
    assert reason == "rejected.fraud"


def test_currently_due_is_pending():
    status, reason = stripe_account_to_kyc_status(
        {
            "charges_enabled": False,
            "payouts_enabled": False,
            "requirements": {"currently_due": ["individual.id_number"]},
        }
    )
    assert status == "pending"
    assert reason and "individual.id_number" in reason


def test_pending_verification_is_pending():
    status, _ = stripe_account_to_kyc_status(
        {
            "charges_enabled": False,
            "payouts_enabled": False,
            "requirements": {"pending_verification": ["individual.verification.document"]},
        }
    )
    assert status == "pending"
