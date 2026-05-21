# Domínio judgetcg.com.br — produção na EC2

Stack público:

```text
Internet → :443/:80 (Caddy + TLS)
              → 127.0.0.1:3000 (Next.js /judge)
              → /api/proxy → 127.0.0.1:8000 (FastAPI Docker)
```

A API **não** precisa de subdomínio público; o browser usa o mesmo origin (`https://judgetcg.com.br/api/proxy/...`).

---

## 1. DNS (Registro.br)

No painel do domínio **judgetcg.com.br**:

| Tipo | Nome | Valor | TTL |
|------|------|--------|-----|
| **A** | `@` (vazio) | IP público da EC2 | 300 |
| **A** | `www` | mesmo IP | 300 |

Alternativa: `www` como **CNAME** → `judgetcg.com.br`.

Descobrir IP da EC2:

```bash
curl -s https://checkip.amazonaws.com   # na própria EC2
# ou AWS Console → EC2 → Public IPv4
```

Propagação: alguns minutos a 48h (`.br` costuma ser rápido).

Testar:

```bash
dig +short judgetcg.com.br
dig +short www.judgetcg.com.br
```

Ambos devem devolver o IP da EC2.

---

## 2. Security Group (AWS)

| Porta | Origem | Uso |
|-------|--------|-----|
| 22 | seu IP | SSH |
| 80 | 0.0.0.0/0 | HTTP (redirect + ACME Let's Encrypt) |
| 443 | 0.0.0.0/0 | HTTPS |
| 3000 | — | **fechar** ao público (só localhost) |
| 8000 | — | **fechar** ao público (só localhost) |

---

## 3. Deploy na EC2 (automático)

```bash
cd ~/seekguidance2
git pull origin main
chmod +x scripts/ec2/*.sh

# Mostra IP sugerido para o DNS
bash scripts/ec2/setup-domain-judgetcg.sh
```

Ou passo a passo:

```bash
bash scripts/ec2/load_secrets.sh
bash scripts/ec2/start-api.sh
bash scripts/ec2/setup-caddy.sh
bash scripts/ec2/install-judgetcg-console-service.sh
sudo systemctl start judgetcg-console
```

---

## 4. Verificação

```bash
# API local
curl -s http://127.0.0.1:8000/health

# Next local
curl -sI http://127.0.0.1:3000/judge

# HTTPS público
curl -sI https://judgetcg.com.br/judge

# Certificado Caddy
sudo journalctl -u caddy -n 50 --no-pager
sudo journalctl -u judgetcg-console -n 50 --no-pager
```

No browser: **https://judgetcg.com.br/judge**

---

## 5. Variáveis de ambiente (console)

| Variável | Valor em produção |
|----------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://judgetcg.com.br` |
| `API_PROXY_TARGET` | `http://127.0.0.1:8000` |

Não defina `NEXT_PUBLIC_API_URL` no browser em produção (usa `/api/proxy` no mesmo domínio).

Template: `frontend/runtime_console_v3/.env.production.example`

---

## 6. Atualizar código

```bash
cd ~/seekguidance2
git pull
sudo systemctl restart judgetcg-console
# API se mudou backend:
bash scripts/ec2/start-api.sh
```

---

## 7. Troubleshooting

| Sintoma | Ação |
|---------|------|
| HTTPS não abre | DNS ainda não propagou; SG 443; `sudo systemctl status caddy` |
| Certificado falha | Porta 80 aberta; domínio deve resolver para esta EC2 |
| 502 no site | `sudo systemctl status judgetcg-console`; Next não está em :3000 |
| Judge “API unreachable” | API down: `docker compose ... ps`; não usar `NEXT_PUBLIC_API_URL` com IP:8000 no `.env.local` |
| `www` não funciona | Registo A/CNAME para `www`; Caddy redirecciona www → apex |

---

## 8. Migração para Supabase

Se a infra passar a Supabase + Vercel/Render, o domínio **judgetcg.com.br** aponta para a Vercel (não EC2). Ver **[SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)**.

## 9. Próximo passo (UI)

Com domínio estável, sprint de UI/UX em `/judge` (estilo app TCG+, mobile-first). Ver `docs/JUDGE_FRONTEND_UI.md`.

---

## Ficheiros no repo

- `infra/caddy/Caddyfile`
- `scripts/ec2/setup-caddy.sh`
- `scripts/ec2/start-console-prod.sh`
- `scripts/ec2/install-judgetcg-console-service.sh`
- `scripts/ec2/setup-domain-judgetcg.sh`
- `infra/systemd/judgetcg-console.service`
