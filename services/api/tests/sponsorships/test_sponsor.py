"""Testes de patrocínios."""

from __future__ import annotations

from app.sponsorships.sponsor import SPONSORSHIP_TIERS


class TestSponsorships:
    def test_tiers_defined(self):
        assert SPONSORSHIP_TIERS["medium"]["amount_cents"] == 15000
        assert any(b["type"] == "logo_on_stream" for b in SPONSORSHIP_TIERS["large"]["benefits"])
