#!/usr/bin/env python3
"""
Smoke test automatizado para Judge-TCG.
Roda em CI/CD (GitHub Actions) ou localmente.
Fail-fast — para no primeiro erro.
"""

from __future__ import annotations

import os
import sys
from datetime import UTC, datetime
from typing import Any

import requests

CONFIG = {
    "frontend": os.getenv("SMOKE_FRONTEND_URL", "https://judgetcg.com.br"),
    "api": os.getenv("SMOKE_API_URL", "https://seekguidance.onrender.com"),
    "timeout": int(os.getenv("SMOKE_TIMEOUT", "10")),
    "fail_fast": os.getenv("SMOKE_FAIL_FAST", "1") != "0",
}

GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
OK_MARK = "OK"
FAIL_MARK = "FAIL"


def _mark(ok: bool) -> str:
    if os.name == "nt":
        return OK_MARK if ok else FAIL_MARK
    sym = "✓" if ok else "✗"
    color = GREEN if ok else RED
    return f"{color}{sym}{RESET}"


class SmokeTest:
    def __init__(self) -> None:
        self.results: list[dict[str, Any]] = []
        self.passed = 0
        self.failed = 0

    def run(self) -> int:
        print(f"\n{'=' * 60}")
        print("  JUDGE-TCG SMOKE TEST")
        print(f"  {datetime.now(UTC).isoformat()}")
        print(f"  Frontend: {CONFIG['frontend']}")
        print(f"  API:      {CONFIG['api']}")
        print(f"{'=' * 60}\n")

        tests = [
            self.test_api_health,
            self.test_catalog_health,
            self.test_bff_health,
            self.test_frontend_home,
            self.test_frontend_search,
            self.test_frontend_loja,
            self.test_game_hub,
            self.test_game_search,
            self.test_games_api,
            self.test_games_cards_api,
            self.test_catalog_search_bff,
            self.test_gamification_auth,
            self.test_analytics_dashboard_auth,
            self.test_leaderboard,
            self.test_decks_new,
            self.test_checkout_page,
            self.test_marketplace_checkout_page,
            self.test_checkout_expire_stale,
            self.test_seller_profile_api,
            self.test_vendedor_route,
            self.test_store_redirects,
            self.test_vendedor_painel_routes,
        ]

        for test_fn in tests:
            if not test_fn() and CONFIG["fail_fast"]:
                break

        print(f"\n{'=' * 60}")
        print(f"  RESULTADO: {self.passed} passaram, {self.failed} falharam")
        print(f"{'=' * 60}\n")
        return 0 if self.failed == 0 else 1

    def _check(
        self,
        name: str,
        url: str,
        *,
        method: str = "GET",
        headers: dict[str, str] | None = None,
        expected_status: int | tuple[int, ...] = 200,
        expected_in_body: str | None = None,
        json_path: str | None = None,
        json_predicate: str | None = None,
    ) -> bool:
        try:
            response = requests.request(
                method,
                url,
                headers=headers or {},
                timeout=CONFIG["timeout"],
            )

            if isinstance(expected_status, int):
                status_ok = response.status_code == expected_status
            else:
                status_ok = response.status_code in expected_status

            body_ok = True
            if expected_in_body:
                body_ok = expected_in_body.lower() in response.text.lower()

            json_ok = True
            data: Any = None
            if json_path or json_predicate:
                try:
                    data = response.json()
                except ValueError:
                    json_ok = False
                    data = None

            if json_ok and json_path and status_ok and data is not None:
                node: Any = data
                for key in json_path.split("."):
                    if isinstance(node, dict):
                        node = node.get(key)
                    elif isinstance(node, list) and key.isdigit():
                        node = node[int(key)]
                    else:
                        json_ok = False
                        break
                json_ok = node is not None

            if json_ok and json_predicate == "cards_list" and status_ok:
                json_ok = isinstance(data, dict) and isinstance(data.get("cards"), list)

            if json_ok and json_predicate == "status_ok" and status_ok:
                json_ok = isinstance(data, dict) and data.get("status") in {
                    "ok",
                    "healthy",
                    "ready",
                    "loading",
                }

            success = status_ok and body_ok and json_ok

            if success:
                self.passed += 1
                print(f"  {_mark(True)} {name}")
            else:
                self.failed += 1
                print(f"  {_mark(False)} {name}")
                if not status_ok:
                    print(f"      Status: {response.status_code} (esperado {expected_status})")
                if not body_ok:
                    print(f"      Body não contém: {expected_in_body}")
                if not json_ok:
                    hint = json_predicate or json_path
                    print(f"      JSON inválido: {hint}")

            self.results.append(
                {
                    "name": name,
                    "success": success,
                    "status": response.status_code,
                    "url": url,
                    "timestamp": datetime.now(UTC).isoformat(),
                }
            )
            return success

        except requests.exceptions.Timeout:
            self.failed += 1
            print(f"  {_mark(False)} {name} — TIMEOUT")
            self.results.append(
                {"name": name, "success": False, "status": 0, "url": url, "error": "timeout"}
            )
            return False
        except requests.exceptions.ConnectionError:
            self.failed += 1
            print(f"  {_mark(False)} {name} — CONNECTION ERROR")
            self.results.append(
                {"name": name, "success": False, "status": 0, "url": url, "error": "connection"}
            )
            return False
        except Exception as exc:
            self.failed += 1
            print(f"  {_mark(False)} {name} — {exc}")
            self.results.append(
                {"name": name, "success": False, "status": 0, "url": url, "error": str(exc)}
            )
            return False

    def test_api_health(self) -> bool:
        return self._check(
            "API Health",
            f"{CONFIG['api']}/runtime/judge/health",
            json_predicate="status_ok",
        )

    def test_catalog_health(self) -> bool:
        return self._check(
            "Catalog Health",
            f"{CONFIG['api']}/runtime/judge/catalog/health",
            json_predicate="status_ok",
        )

    def test_bff_health(self) -> bool:
        return self._check(
            "BFF Health",
            f"{CONFIG['frontend']}/api/health",
            json_path="status",
        )

    def test_frontend_home(self) -> bool:
        return self._check(
            "Frontend Homepage",
            CONFIG["frontend"],
            expected_status=(200, 307),
            expected_in_body="Judge TCG",
        )

    def test_frontend_search(self) -> bool:
        return self._check(
            "Frontend Search",
            f"{CONFIG['frontend']}/loja/busca?q=lightning",
            expected_in_body="loja/busca",
        )

    def test_frontend_loja(self) -> bool:
        return self._check(
            "Frontend Loja (TCG Library)",
            f"{CONFIG['frontend']}/loja",
            expected_in_body="Biblioteca",
        )

    def test_games_api(self) -> bool:
        return self._check(
            "BFF Games API",
            f"{CONFIG['frontend']}/api/games",
            json_path="games",
        )

    def test_game_hub(self) -> bool:
        return self._check(
            "Frontend Game Hub",
            f"{CONFIG['frontend']}/loja/mtg",
            expected_in_body="Magic",
        )

    def test_game_search(self) -> bool:
        return self._check(
            "Frontend Game Search",
            f"{CONFIG['frontend']}/loja/mtg/busca?q=bolt",
            expected_in_body="Busca",
        )

    def test_games_cards_api(self) -> bool:
        return self._check(
            "BFF Games Cards API",
            f"{CONFIG['frontend']}/api/games/mtg/cards?q=bolt",
            json_predicate="cards_list",
        )

    def test_catalog_search_bff(self) -> bool:
        return self._check(
            "BFF Catalog Search",
            f"{CONFIG['frontend']}/api/catalog/cards/search?q=bolas&game=MTG",
            json_predicate="cards_list",
        )

    def test_gamification_auth(self) -> bool:
        return self._check(
            "Gamification XP (auth)",
            f"{CONFIG['api']}/runtime/judge/gamification/xp/me",
            expected_status=401,
        )

    def test_analytics_dashboard_auth(self) -> bool:
        return self._check(
            "Analytics Dashboard (auth)",
            f"{CONFIG['api']}/runtime/judge/admin/analytics/dashboard",
            expected_status=401,
        )

    def test_leaderboard(self) -> bool:
        return self._check(
            "Leaderboard",
            f"{CONFIG['frontend']}/comunidade/leaderboard",
            expected_in_body="leaderboard",
        )

    def test_decks_new(self) -> bool:
        return self._check(
            "Decks Novo",
            f"{CONFIG['frontend']}/decks/novo",
            expected_status=(200, 307),
        )

    def test_checkout_page(self) -> bool:
        return self._check(
            "Checkout Page",
            f"{CONFIG['frontend']}/checkout",
            expected_in_body="checkout",
        )

    def test_marketplace_checkout_page(self) -> bool:
        return self._check(
            "Marketplace Checkout",
            f"{CONFIG['frontend']}/marketplace/checkout",
            expected_in_body="checkout",
        )

    def test_checkout_expire_stale(self) -> bool:
        return self._check(
            "Checkout Expire Stale (API)",
            f"{CONFIG['api']}/runtime/judge/checkout/expire-stale",
            method="POST",
            expected_status=200,
            json_path="expired",
        )

    def test_seller_profile_api(self) -> bool:
        return self._check(
            "Seller Profile API (404 esperado)",
            f"{CONFIG['api']}/runtime/judge/sellers/smoke-test-invalid-seller/profile",
            expected_status=404,
        )

    def test_vendedor_route(self) -> bool:
        return self._check(
            "Vendedor Painel",
            f"{CONFIG['frontend']}/vendedor/painel",
            expected_status=(200, 307),
        )

    STORE_REDIRECTS = [
        ("/store", "/vendedor/painel"),
        ("/store/dashboard", "/vendedor/painel"),
        ("/store/listings", "/vendedor/painel/listagens"),
        ("/store/listings/new", "/vendedor/painel/listagens/nova"),
        ("/store/orders", "/vendedor/painel/vendas"),
        ("/store/analytics", "/vendedor/painel/estatisticas"),
        ("/store/settings", "/vendedor/painel/configuracoes"),
    ]

    def test_store_redirects(self) -> bool:
        ok = True
        for old_path, expected in self.STORE_REDIRECTS:
            if not self._check_redirect(old_path, expected):
                ok = False
                if CONFIG["fail_fast"]:
                    break
        return ok

    def _check_redirect(self, old_path: str, expected_location: str) -> bool:
        url = f"{CONFIG['frontend']}{old_path}"
        try:
            response = requests.head(url, allow_redirects=False, timeout=CONFIG["timeout"])
            status_ok = response.status_code in (301, 308, 307)
            location = response.headers.get("Location", "")
            # Location may be absolute URL
            if location.startswith("http"):
                from urllib.parse import urlparse

                location = urlparse(location).path or location
            loc_ok = location.rstrip("/") == expected_location.rstrip("/")
            success = status_ok and loc_ok
            if success:
                self.passed += 1
                print(f"  {_mark(True)} Redirect {old_path} → {expected_location}")
            else:
                self.failed += 1
                print(f"  {_mark(False)} Redirect {old_path} → {expected_location}")
                if not status_ok:
                    print(f"      Status: {response.status_code}")
                if not loc_ok:
                    print(f"      Location: {location!r}")
            self.results.append(
                {"name": f"Redirect {old_path}", "success": success, "status": response.status_code, "url": url}
            )
            return success
        except requests.exceptions.RequestException as exc:
            self.failed += 1
            print(f"  {_mark(False)} Redirect {old_path} — {exc}")
            return False

    VENDEDOR_PAINEL_ROUTES = [
        "/vendedor/painel/listagens",
        "/vendedor/painel/vendas",
        "/vendedor/painel/estatisticas",
        "/vendedor/painel/configuracoes",
    ]

    def test_vendedor_painel_routes(self) -> bool:
        ok = True
        for path in self.VENDEDOR_PAINEL_ROUTES:
            if not self._check(
                f"Painel {path}",
                f"{CONFIG['frontend']}{path}",
                expected_status=(200, 307, 401),
            ):
                ok = False
                if CONFIG["fail_fast"]:
                    break
        return ok

    def test_collection_page(self) -> bool:
        return self._check(
            "Collection Page",
            f"{CONFIG['frontend']}/perfil/colecao",
            expected_status=(200, 307),
        )

    def test_formats_api(self) -> bool:
        return self._check(
            "BFF Formats API",
            f"{CONFIG['frontend']}/api/formats/mtg",
            json_path="formats",
        )


def generate_report(results: list[dict[str, Any]]) -> str:
    rows = "".join(
        f'<tr><td>{r["name"]}</td><td>{"✅ PASS" if r["success"] else "❌ FAIL"}</td>'
        f'<td>{r.get("status", "")}</td><td>{r.get("url", "")}</td></tr>'
        for r in results
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Smoke Test Report</title></head>
<body>
  <h1>Judge-TCG Smoke Test</h1>
  <p>{datetime.now(UTC).isoformat()}</p>
  <table border="1" cellpadding="8">
    <tr><th>Teste</th><th>Status</th><th>HTTP</th><th>URL</th></tr>
    {rows}
  </table>
</body>
</html>"""


if __name__ == "__main__":
    tester = SmokeTest()
    code = tester.run()
    if code != 0:
        report_path = os.getenv("SMOKE_REPORT_PATH", "smoke_test_report.html")
        with open(report_path, "w", encoding="utf-8") as fh:
            fh.write(generate_report(tester.results))
        print(f"\nRelatório salvo em: {report_path}")
    sys.exit(code)
