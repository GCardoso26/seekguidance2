# Validação de segurança — Judge TCG

Matriz de controles implementados vs. infraestrutura (Render API, Vercel frontend, Supabase).

## Transporte e edge

| Controle | Estado | Implementação |
|----------|--------|----------------|
| HTTPS obrigatório | ✅ Infra + app | Render/Vercel terminam TLS; API: `SECURITY_FORCE_HTTPS=true` + redirect 308 (`app/core/security/middleware.py`) |
| TLS 1.2+ | ✅ Infra | Render e Vercel exigem TLS moderno (configuração da plataforma) |
| HSTS | ✅ | API: `Strict-Transport-Security`; frontend: `next.config.mjs` + `vercel.json` |
| CORS restritivo | ✅ | `CORS_ALLOWED_ORIGINS` (sem `*` em produção) — `app/main.py` |
| CSP | ✅ | API: `SECURITY_CSP_POLICY`; frontend: CSP em headers |
| Rate limiting | ✅ | Judge + chat — `app/core/rate_limit.py` |
| Anti-clickjacking | ✅ | `X-Frame-Options: DENY`, `frame-ancestors 'none'` |

## Autenticação e autorização

| Controle | Estado | Implementação |
|----------|--------|----------------|
| Segredo JWT forte | ✅ Prod | `RUNTIME_AUTH_SECRET` ≥ 32 chars em `production` — `tokens.py` |
| Expiração curta (access) | ✅ | Default 15 min — `RUNTIME_ACCESS_TTL_SEC` |
| Refresh tokens | ✅ | `typ=refresh`, TTL 24h — `RUNTIME_REFRESH_TTL_SEC` |
| Rotação | ✅ | Refresh antigo revogado ao emitir novo — `refresh_access()` |
| Revogação | ✅ | Redis/memória `tcg:revoked:{jti}` + `POST /auth/logout` |
| RBAC | ✅ | `app/core/security/rbac.py` |
| Tenant isolation | ✅ | `tenant_id` no JWT; `assert_tenant_access()` |
| Rotas operacionais | ✅ Prod | Backup/restore/metrics exigem auth em `production` |

## Criptografia

| Dado | Algoritmo | Módulo |
|------|-----------|--------|
| Em trânsito | TLS | Render/Vercel |
| Em repouso (campos) | AES-256-GCM | `crypto.encrypt_at_rest` + `FIELD_ENCRYPTION_KEY_B64` |
| Passwords | bcrypt (12 rounds) | `crypto.hash_password` |
| API keys | SHA-256 + salt | `crypto.hash_api_key` |
| Secrets em env | Nunca plaintext no repo | `.env` / dashboard; docs sem credenciais |

## Redacção e exposição

| Superfície | Mascaramento |
|------------|--------------|
| Logs structlog | `mask_mapping` em cada evento — `app/core/logging.py` |
| Replay export/get | Payloads redigidos — `runtime_real_replay/engine.py` |
| Exceptions HTTP | Mensagem sanitizada em produção — `safe_exception_middleware` |
| Tokens/senhas/emails | `app/core/security/redaction.py` |

## Variáveis de ambiente (produção)

```env
ENVIRONMENT=production
CORS_ALLOWED_ORIGINS=https://judgetcg.com.br
RUNTIME_AUTH_SECRET=<32+ caracteres aleatórios>
SECURITY_FORCE_HTTPS=true
SECURITY_PROTECT_OPERATIONAL_ROUTES=true
JUDGE_TRUST_PROXY_HEADERS=true
API_DOCS_ENABLED=false
REDIS_URL=redis://...
FIELD_ENCRYPTION_KEY_B64=<opcional, base64 32 bytes>
```

## Correções P0 (implementadas)

- **Tenant isolation:** `tenant_id` de query/body ignorado; só JWT/API key (`app/core/security/tenant.py`, `runtime_minimal.py`).
- **Auth global em produção:** `/v1/replay/*`, GET `/runtime/*` operacionais exigem auth + RBAC (`middleware.py`).
- **Path traversal restore:** `backup_path` restrito a `generated/runtime_artifacts/runtime_backup_v1/` (`paths.py`).
- **Secrets:** placeholders em `.env.production.example` (sem chaves reais).
- **Frontend:** XSS em highlights corrigido; URLs `https`/`http` only; tokens em cookies HttpOnly via `/api/bff` + `/api/auth/login`.
- **CSP:** removido `unsafe-eval` do `next.config.mjs`.
- **Rate limit:** buckets `replay` e `auth_login`.

## Pendências conhecidas

- **Proxy Vercel** `/api/proxy/*` encaminha para a API — Judge usa proxy público; console usa `/api/bff`.
- **Histórico Git**: rodar password Supabase se credencial antiga foi commitada.
- **npm audit**: avaliar upgrade Next.js 14 → versão com patches de segurança.
- **Cookies de sessão**: Judge público não usa cookies; se auth no frontend for adicionada, usar `Secure`, `HttpOnly`, `SameSite=Strict`.

## Testes

```bash
cd services/api
pip install -r requirements.txt
pytest tests/core/test_security.py tests/runtime_real_auth/ -q
```
