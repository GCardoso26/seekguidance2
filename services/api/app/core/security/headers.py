"""Headers de segurança HTTP."""

from __future__ import annotations

from app.core.config import Settings


def apply_security_headers(headers: dict[str, str], request_path: str, cfg: Settings) -> None:
    headers.setdefault("X-Content-Type-Options", "nosniff")
    headers.setdefault("X-Frame-Options", "DENY")
    headers.setdefault("Content-Security-Policy", cfg.security_csp_policy)
    headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")
    headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
    headers.setdefault("Cross-Origin-Resource-Policy", "same-site")

    if cfg.security_hsts_enabled:
        headers.setdefault(
            "Strict-Transport-Security",
            f"max-age={int(cfg.security_hsts_max_age)}; includeSubDomains; preload",
        )

    if request_path.startswith("/runtime/judge") or "/auth" in request_path:
        headers.setdefault("Cache-Control", "no-store, no-cache, must-revalidate")
        headers.setdefault("Pragma", "no-cache")
