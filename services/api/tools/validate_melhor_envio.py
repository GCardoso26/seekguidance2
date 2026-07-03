"""CLI: validar MELHOR_ENVIO_* (local ou Render shell)."""
from __future__ import annotations

import asyncio
import json
import sys

from app.integrations.melhor_envio.validate import melhor_envio_config_snapshot, melhor_envio_live_check


async def main() -> int:
    snap = melhor_envio_config_snapshot()
    print("=== Config (env vars) ===")
    print(json.dumps(snap, indent=2, ensure_ascii=False))

    if not snap["token_set"]:
        print("\n❌ MELHOR_ENVIO_TOKEN ausente")
        return 1

    if not snap["from_address_ok"]:
        print(f"\n⚠️  MELHOR_ENVIO_FROM_ADDRESS inválido: {snap.get('from_address_error')}")
        return 1

    print("\n=== Live API (GET /api/v2/me) ===")
    live = await melhor_envio_live_check()
    print(json.dumps({k: v for k, v in live.items() if k != "account_email"}, indent=2))
    if live.get("account_email"):
        print(f"account_email: {live['account_email']}")

    if live.get("api_reachable"):
        print("\n✅ Melhor Envio configurado e token válido")
        return 0

    print(f"\n❌ Token rejeitado pela API: {live.get('api_error')}")
    if snap["sandbox"]:
        print("   Dica: token do sandbox exige MELHOR_ENVIO_SANDBOX=true")
    else:
        print("   Dica: token de produção exige MELHOR_ENVIO_SANDBOX=false")
    return 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
