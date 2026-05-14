"""Score de proveniência (integridade de transporte + checksum)."""

from __future__ import annotations


def provenance_score(*, has_checksum: bool, tls_ok: bool) -> float:
    s = 0.45
    if tls_ok:
        s += 0.3
    if has_checksum:
        s += 0.25
    return min(1.0, s)
