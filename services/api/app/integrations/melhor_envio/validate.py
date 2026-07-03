"""Validação de configuração Melhor Envio (sem expor segredos)."""

from __future__ import annotations

import json
from typing import Any

from app.core.config import get_settings
from app.integrations.melhor_envio.client import MelhorEnvioClient, MelhorEnvioError


def melhor_envio_config_snapshot() -> dict[str, Any]:
    """Estado estático das env vars — safe para /v1/health."""
    settings = get_settings()
    token_set = bool(settings.melhor_envio_token and settings.melhor_envio_token.strip())
    from_raw = settings.melhor_envio_from_address
    from_ok = False
    from_error: str | None = None

    if from_raw:
        try:
            parsed = json.loads(from_raw)
            required = ("address", "city", "state_abbr", "postal_code")
            missing = [k for k in required if not str(parsed.get(k) or "").strip()]
            from_ok = len(missing) == 0
            if missing:
                from_error = f"missing_fields:{','.join(missing)}"
        except json.JSONDecodeError as exc:
            from_error = f"invalid_json:{exc.msg}"

    webhook_secret_set = bool(settings.melhor_envio_webhook_secret)

    if not token_set:
        status = "disabled"
    elif not from_ok:
        status = "partial"
    else:
        status = "configured"

    return {
        "status": status,
        "sandbox": settings.melhor_envio_sandbox,
        "default_service_id": settings.melhor_envio_default_service_id,
        "token_set": token_set,
        "from_address_ok": from_ok,
        "from_address_error": from_error,
        "webhook_secret_set": webhook_secret_set,
    }


async def melhor_envio_live_check() -> dict[str, Any]:
    """Ping GET /api/v2/me — valida token contra API Melhor Envio."""
    snapshot = melhor_envio_config_snapshot()
    if not snapshot["token_set"]:
        return {**snapshot, "api_reachable": False, "api_error": "token_missing"}

    settings = get_settings()
    client = MelhorEnvioClient(
        token=str(settings.melhor_envio_token),
        sandbox=settings.melhor_envio_sandbox,
    )
    try:
        me = await client.get_me()
        email = me.get("email") if isinstance(me, dict) else None
        return {
            **snapshot,
            "api_reachable": True,
            "account_email": email,
        }
    except MelhorEnvioError as exc:
        return {
            **snapshot,
            "api_reachable": False,
            "api_error": str(exc),
            "api_status_code": exc.status_code,
        }
