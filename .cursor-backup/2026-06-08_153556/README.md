# Backup Cursor Agent — Judge TCG

**Data:** 2026-06-08 15:35:56 (horário local)  
**Projeto:** `S:\tcg-judge`  
**Domínio:** https://judgetcg.com.br  
**Sessão agente:** `c0b3a590-9268-47d0-9ce9-d36cf98db136`

## Conteúdo

| Pasta | Descrição |
|-------|-----------|
| `context/` | Contexto do projeto (v3–v5), deploy checklist, auth guide |
| `agent/transcripts/` | Transcript JSONL da conversa principal |
| `agent/subagents/` | Transcripts dos subagentes |
| `agent/tools/` | Saídas de ferramentas do agente |
| `config/` | Regras do usuário, permissões, settings Cursor |
| `skills/` | Skills instaladas (Cursor + plugin Supabase) |
| `mcp/` | Configuração MCP Supabase e descriptors do workspace |
| `project/` | Snapshot git (HEAD, log, status, remotes) |

## Estado do projeto no backup

- **HEAD:** ver `project/git-head.txt`
- **Último commit relevante:** `fe29273` — fix(auth): redirect OAuth para /judge após login Google
- **Pendência operacional:** validar OAuth em produção após deploy Vercel

## Como restaurar contexto numa nova sessão

1. Abra o projeto em `S:\tcg-judge`
2. Cole ou referencie `context/cursor-context-judge-tcg-v5.md`
3. Para histórico completo, anexe `agent/transcripts/c0b3a590-9268-47d0-9ce9-d36cf98db136.jsonl`
4. Regras e permissões estão em `config/user-rules.md` e `config/agent-permissions.md`

## Notas de segurança

- Este backup **não** inclui `.env`, tokens, chaves API ou credenciais OAuth
- `cursor-user-settings.json` contém apenas configuração local (Python path)
- MCP OAuth attempts não foram copiados

## Link do transcript (referência interna)

[OAuth redirect + deploy Judge TCG](c0b3a590-9268-47d0-9ce9-d36cf98db136)
