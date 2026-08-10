# Deploy CWM na Oracle OCI + n8n

Objetivo: subir **Control Plane (API + Web)** e **Orchestration Plane (n8n)** numa VM OCI, com workflows importados e ativos.

## Arquitetura na VM

```
Internet
   │
   ├─ :80/:443  → nginx/Caddy (web + proxy /api + /n8n)
   │
   ├─ web       → Vite build (porta interna 8080)
   ├─ api       → Control Plane :8787  (SQLite em volume)
   ├─ n8n       → Orchestration :5678  (Postgres próprio)
   ├─ postgres_n8n
   └─ redis
```

**Importante (estado atual do código):**
- A API CWM usa **SQLite** (`better-sqlite3`), não o Postgres `content_war` do compose.
- O Postgres `postgres` no compose é reservado / futuro Data Plane.
- O Postgres `postgres_n8n` é **obrigatório** para o n8n em produção.
- Publicação YouTube real continua com kill switches (ver `PRODUCTION_RUNBOOK.md`). Subir n8n ≠ publicar de verdade.

---

## 1. VM na OCI

Recomendado (Always Free Ampere ou x86):

| Item | Valor sugerido |
|------|----------------|
| Shape | `VM.Standard.A1.Flex` (1–2 OCPU, 6–12 GB) ou `VM.Standard.E4.Flex` |
| OS | Ubuntu 22.04 / 24.04 |
| Boot | ≥ 50 GB |
| VCN | subnet pública |
| IP | reservar IP público |

### Security List / NSG

Abrir inbound:

| Porta | Uso |
|-------|-----|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

**Não** expor 5432/5433/6379/8787/5678 na internet. Só via reverse proxy.

---

## 2. Preparar a VM

```bash
ssh ubuntu@SEU_IP_PUBLICO

sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# logout/login para o grupo docker

# Compose plugin
docker compose version
```

---

## 3. Clonar o projeto

```bash
cd ~
git clone https://github.com/GCardoso26/seekguidance2.git
cd seekguidance2/ai-content-machine
```

(Use a branch que contém CWM, ex.: `cursor/ai-content-machine-4c61` ou `main` quando mergeado.)

```bash
git checkout cursor/ai-content-machine-4c61   # se ainda não estiver em main
```

---

## 4. Configurar secrets (neste local)

Arquivo na **raiz do CWM**:

```bash
cp .env.oci.example .env
nano .env   # ou vim
```

Preencha no mínimo:

- `N8N_ENCRYPTION_KEY` — string longa aleatória (persistir; se perder, credenciais n8n quebram)
- `N8N_WEBHOOK_SECRET` — HMAC forte (não use o default)
- `N8N_USER` / `N8N_PASSWORD` — login do n8n
- `DOMAIN` / `WEBHOOK_URL` — domínio ou `http://IP_PUBLICO`
- `CWM_CREDENTIALS_ENCRYPTION_KEY` — AES dos tokens YouTube (32+ chars)
- YouTube OAuth (só se for abrir janela real depois)

**Nunca** commitar `.env`.

---

## 5. Subir a stack

```bash
cd ~/seekguidance2/ai-content-machine
docker compose --env-file .env up -d --build
docker compose ps
docker compose logs -f api n8n
```

Serviços esperados: `api`, `web`, `n8n`, `postgres_n8n`, `redis` (+ `postgres` opcional).

Health:

```bash
curl -s http://127.0.0.1:8787/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5678/
```

---

## 6. Reverse proxy (HTTPS)

Exemplo rápido com Caddy (recomendado):

```bash
sudo apt install -y caddy
sudo tee /etc/caddy/Caddyfile <<'EOF'
seu-dominio.com {
  encode gzip

  handle_path /api/* {
    reverse_proxy 127.0.0.1:8787
  }

  handle /n8n* {
    reverse_proxy 127.0.0.1:5678
  }

  handle {
    reverse_proxy 127.0.0.1:8080
  }
}
EOF
sudo systemctl reload caddy
```

Ajuste `WEBHOOK_URL` / `N8N_HOST` / `VITE_CWM_API_BASE` no `.env` para o domínio e rebuild do `web` se necessário:

```bash
docker compose up -d --build web
```

---

## 7. Configurar n8n + importar automações

1. Abra `https://seu-dominio.com/n8n` (ou `http://IP:5678` só em rede privada).
2. Faça login com `N8N_USER` / `N8N_PASSWORD`.
3. Crie uma **API Key** em Settings → API.
4. Coloque no `.env` da VM: `N8N_API_KEY=...`
5. Reinicie a API para ela enxergar a key:

```bash
docker compose up -d api
```

6. Importe workflows:

```bash
cd ~/seekguidance2/ai-content-machine
export N8N_BASE_URL=http://127.0.0.1:5678
export N8N_API_KEY='sua-api-key'
npm run n8n:validate
npm run n8n:import
```

(Se a VM não tiver Node na host, rode via container node one-shot ou importe manualmente pela UI.)

7. No n8n UI: **ative** cada workflow CWM necessário (Daily Engine, Research, Script, Production, Publisher, Analytics, Winner, Strategy, WF 13/14…).
8. Confirme variável de ambiente no container n8n: `CWM_API_BASE=http://api:8787` (já no compose — comunicação interna Docker).

---

## 8. Modo de automação

| Fase | `AUTOMATION_MODE` | O que faz |
|------|-------------------|-----------|
| Validar stack na OCI | `mock` | Loop completo sem publish real |
| Orquestração via n8n | `production` | Exige `N8N_BASE_URL` + `N8N_API_KEY` + webhook secret seguro |

Para produção controlada (ainda **sem** YouTube real):

```env
AUTOMATION_MODE=production
GLOBAL_PUBLISHING_KILL_SWITCH=true
PUBLISHING_ENABLED=false
YOUTUBE_PUBLISHING_ENABLED=false
DRY_RUN=true
MAX_PUBLICATIONS_PER_DAY=1
```

Primeiro publish real: seguir `docs/PRODUCTION_RUNBOOK.md` (Fase 5.1).

---

## 9. Automation Center

1. Abra o Web.
2. Crie workspace.
3. Vá em `/app/automation`.
4. Rode preflight (`Production Validation`).
5. Dispare Daily Engine / workflows e confira executions.

---

## 10. Persistência e backup

Volumes Docker:

| Volume | Conteúdo |
|--------|----------|
| `cwm_api_data` | SQLite + assets |
| `cwm_n8n_data` | config n8n |
| `cwm_n8n_pg` | DB n8n |
| `cwm_redis` | locks |

Backup mínimo:

```bash
docker compose exec api ls /data
# copiar volume SQLite + dump postgres_n8n periodicamente
```

Guarde `N8N_ENCRYPTION_KEY` e `CWM_CREDENTIALS_ENCRYPTION_KEY` fora da VM (password manager).

---

## 11. Checklist rápido

- [ ] VM + Docker + portas 22/80/443
- [ ] `.env` a partir de `.env.oci.example`
- [ ] `docker compose up -d --build`
- [ ] `/health` da API OK
- [ ] n8n login OK
- [ ] workflows importados + **ativos**
- [ ] `AUTOMATION_MODE` conforme fase
- [ ] kill switches seguros (default)
- [ ] HTTPS no domínio
- [ ] backup de volumes + encryption keys

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| `SYSTEM_NOT_READY` | Falta `N8N_BASE_URL`/`N8N_API_KEY` ou webhook secret fraco |
| Workflows não chamam API | Conferir `CWM_API_BASE=http://api:8787` na rede Docker |
| Import falha 401 | API Key n8n incorreta |
| n8n perde credenciais | `N8N_ENCRYPTION_KEY` mudou — restaurar a original |
| Web aponta API errada | Rebuild web com `VITE_CWM_API_BASE` do domínio público |

## Onde instalar / configurar (resumo)

| O quê | Onde na OCI |
|-------|-------------|
| Dependências | Dentro dos containers (`docker compose build`) — **não** precisa `npm install` na host |
| Secrets / flags | `ai-content-machine/.env` na VM |
| Código | `~/seekguidance2/ai-content-machine` |
| n8n UI | porta 5678 (proxy) |
| Automações | importadas de `n8n/workflows/*.json` |
