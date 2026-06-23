"""Autorização para jobs cron de sync do catálogo (CRON_SECRET)."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException


def require_catalog_cron_auth(
    authorization: str | None = Header(default=None),
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
) -> None:
    secret = (os.getenv("CRON_SECRET") or "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="CRON_SECRET não configurado no servidor")

    token: str | None = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif x_cron_secret:
        token = x_cron_secret.strip()

    if not token or token != secret:
        raise HTTPException(status_code=401, detail="Autenticação cron inválida")
