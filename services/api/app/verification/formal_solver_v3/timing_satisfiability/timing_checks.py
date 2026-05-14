"""Certificados de timing (SEGOC/APNAP/simultâneo — linguagem de mesa)."""

from __future__ import annotations

from typing import Any


def timing_certificate_stub(
    *,
    segoc_ok: bool,
    apnap_ok: bool,
    simultaneous_ok: bool,
) -> dict[str, Any]:
    return {
        "segoc_ok": segoc_ok,
        "apnap_ok": apnap_ok,
        "simultaneous_ok": simultaneous_ok,
        "assistant_summary": "Confirme ordem local ao TCG; certificado é indicativo, não substitui CR.",
    }
