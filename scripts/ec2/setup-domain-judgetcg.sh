#!/usr/bin/env bash
# Orquestra domínio judgetcg.com.br: Caddy + console produção (systemd).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PUBLIC_IP="${1:-}"
if [[ -z "$PUBLIC_IP" ]]; then
  PUBLIC_IP="$(curl -fsS https://checkip.amazonaws.com 2>/dev/null | tr -d '\n' || true)"
fi

echo "========== Domínio judgetcg.com.br =========="
echo ""
echo "1) DNS (Registro.br ou Route53) — ANTES do HTTPS:"
if [[ -n "$PUBLIC_IP" ]]; then
  echo "   Tipo A   judgetcg.com.br      →  ${PUBLIC_IP}"
  echo "   Tipo A   www.judgetcg.com.br  →  ${PUBLIC_IP}"
  echo "   (ou CNAME www → judgetcg.com.br)"
else
  echo "   Tipo A   judgetcg.com.br      →  <IP público desta EC2>"
fi
echo ""
echo "2) Security Group AWS: inbound TCP 80 e 443 (0.0.0.0/0 ou restrito)"
echo "   Recomendado: fechar 3000 e 8000 ao mundo (só localhost + Caddy)"
echo ""
read -r -p "DNS já aponta para esta máquina? [s/N] " dns_ok
if [[ ! "$dns_ok" =~ ^[sS] ]]; then
  echo "Configure o DNS e volte a correr este script."
  exit 0
fi

if [[ ! -f .env.production ]]; then
  echo "==> Carregar secrets"
  bash scripts/ec2/load_secrets.sh
fi

echo "==> API (Docker)"
bash scripts/ec2/start-api.sh

echo "==> Caddy (HTTPS)"
bash scripts/ec2/setup-caddy.sh

echo "==> Console systemd"
bash scripts/ec2/install-judgetcg-console-service.sh
sudo systemctl restart judgetcg-console || sudo systemctl start judgetcg-console

sleep 3
echo ""
echo "==> Testes locais"
curl -sS -o /dev/null -w "Next :3000 → %{http_code}\n" "http://127.0.0.1:3000/judge" || echo "Next ainda a subir — journalctl -u judgetcg-console"
curl -sS -o /dev/null -w "HTTPS → %{http_code}\n" "https://judgetcg.com.br/judge" || echo "HTTPS: aguarde propagação DNS / certificado Caddy (journalctl -u caddy)"

echo ""
echo "Pronto: https://judgetcg.com.br/judge"
echo "Doc: docs/DOMAIN_JUDGETCG.md"
