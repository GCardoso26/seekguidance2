"""Bootstrap one Accounts V2 connected account + onboarding link (local)."""
from __future__ import annotations

import os
from pathlib import Path

from stripe import StripeClient


def _load_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    for line in env_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main() -> None:
    _load_env()
    key = os.environ.get("STRIPE_SECRET_KEY") or ""
    if not key.startswith("sk_"):
        raise SystemExit("STRIPE_SECRET_KEY missing")
    print("mode", "test" if key.startswith("sk_test") else "live")

    client = StripeClient(key)
    account = client.v2.core.accounts.create(
        {
            "display_name": "JudgeTCG Test Seller V2",
            "contact_email": "stripe-v2-test@judgetcg.local",
            "configuration": {
                "recipient": {
                    "capabilities": {
                        "stripe_balance": {
                            "stripe_transfers": {"requested": True},
                        },
                    },
                },
                "merchant": {
                    "capabilities": {
                        "card_payments": {"requested": True},
                    },
                },
            },
            "defaults": {
                "responsibilities": {
                    "losses_collector": "application",
                    "fees_collector": "application",
                },
            },
            "dashboard": "express",
            "include": [
                "configuration.merchant",
                "configuration.recipient",
                "identity",
                "defaults",
                "configuration.customer",
            ],
            "identity": {"country": "br"},
            "metadata": {"source": "cursor_bootstrap", "connect_api": "v2"},
        }
    )
    account_id = account.id
    print("account_id", account_id)

    link = client.v2.core.account_links.create(
        {
            "account": account_id,
            "use_case": {
                "type": "account_onboarding",
                "account_onboarding": {
                    "configurations": ["recipient", "merchant"],
                    "refresh_url": (
                        "https://judgetcg.com.br/vendedor/painel/configuracoes/pagamentos"
                        "?onboarding=refresh"
                    ),
                    "return_url": (
                        "https://judgetcg.com.br/vendedor/painel/configuracoes/pagamentos"
                        "?onboarding=success"
                    ),
                },
            },
        }
    )
    url = str(link.url)
    print("onboarding_url_prefix", url[:96])
    print("OK")


if __name__ == "__main__":
    main()
