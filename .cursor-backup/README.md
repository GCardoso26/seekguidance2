# Backups do agente Cursor — Judge TCG

Cada subpasta em `.cursor-backup/` é um snapshot datado do contexto, transcript, skills e configurações do agente.

## Último backup

Ver arquivo `LATEST.txt` para o nome da pasta mais recente.

## Estrutura padrão

```
.cursor-backup/
  YYYY-MM-DD_HHmmss/
    README.md
    context/          # Contexto do projeto + resumo da sessão
    agent/            # Transcripts e tool outputs
    config/           # User rules, permissões, settings Cursor
    skills/           # Skills instaladas
    mcp/              # Config MCP Supabase
    project/          # Git snapshot + arquivos OAuth
```

## Restaurar numa nova sessão

```
Leia S:\tcg-judge\.cursor-backup\<pasta>\context\cursor-context-judge-tcg-v5.md
e S:\tcg-judge\.cursor-backup\<pasta>\context\session-summary-2026-06-08.md
```

Para histórico completo, anexe o transcript em `agent/transcripts/`.
