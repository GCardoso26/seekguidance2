# Permissões e capacidades do agente (backup 2026-06-08)

Documentação das capacidades disponíveis na sessão Judge TCG.

## Ferramentas principais

| Ferramenta | Permissão | Uso |
|------------|-----------|-----|
| Shell | Execução real (PowerShell) | git, npm, build, deploy scripts |
| Read / Write / StrReplace | Leitura e escrita de arquivos | Código, docs, configs |
| Grep / Glob / SemanticSearch | Busca no codebase | Exploração e debug |
| Task (subagents) | `explore`, `generalPurpose`, `shell`, etc. | Tarefas paralelas |
| WebSearch / WebFetch | Rede | Docs externas |
| CallMcpTool | MCP Supabase | DB, auth, migrations (quando habilitado) |
| GenerateImage | Sob demanda explícita | Assets visuais |

## Restrições explícitas

- **Git commit/push:** só com pedido do usuário
- **git config:** proibido alterar
- **Force push main:** proibido sem aviso
- **Secrets:** não commitar `.env` / credentials
- **Browser automation:** não usar como workaround de MCP ausente

## MCP habilitado

### plugin-supabase-supabase

- **URL:** `https://mcp.supabase.com/mcp`
- **Autenticação:** via `mcp_auth` quando necessário
- **Skills associadas:** `supabase`, `supabase-postgres-best-practices`
- **Descriptors:** `mcp/workspace-descriptors/`

## Skills disponíveis

Ver pasta `skills/` — inclui:

- `automate`, `babysit`, `canvas`, `create-hook`, `create-rule`, `create-skill`
- `loop`, `sdk`, `split-to-prs`, `statusline`, `update-cursor-settings`
- `supabase` (plugin), `supabase-postgres-best-practices` (plugin)

## Modos do agente

| Modo | Acesso |
|------|--------|
| Agent (padrão) | Escrita, shell, MCP |
| Plan | Somente leitura colaborativa |
| Debug / Ask | Não switcháveis pelo agente |

## Workspace

- **Path local:** `S:\tcg-judge`
- **Frontend Vercel root:** `frontend/runtime_console_v3`
- **API:** Render (`seekguidance.onrender.com`)
- **Auth:** Supabase (Google OAuth)

## Smart Mode / Auto-review

Comandos ou fetches bloqueados pelo classificador podem exigir aprovação do usuário via card nativo (`requestSmartModeApproval`).
