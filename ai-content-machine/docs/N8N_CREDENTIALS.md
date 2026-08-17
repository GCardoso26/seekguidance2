# N8N Credentials

| Credential / Env | Uso | Obrigatório |
|------------------|-----|-------------|
| `N8N_BASE_URL` | AutomationService → n8n | production |
| `N8N_API_KEY` | Import/trigger API n8n | production |
| `N8N_WEBHOOK_SECRET` | HMAC webhooks n8n→API | sempre |
| `CWM_API_BASE` | Workflows → Control Plane | sempre |
| `CWM_DEFAULT_WORKSPACE_ID` | Crons multi-workspace (MVP) | cron |
| OpenAI / LLM | via AI Router (futuro provider real) | opcional |
| TikTok / Meta / YouTube | Content Publisher | production publish |
| Redis URL | locks / rate limit | recomendado |

## Regras

1. Nunca hardcodar secrets nos JSON de workflow  
2. Rotacionar `N8N_WEBHOOK_SECRET`  
3. Em mock mode, providers retornam `reality: MOCK` — nunca `REAL`
