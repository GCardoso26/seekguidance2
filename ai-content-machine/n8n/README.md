# Automações n8n — NEXUS IA

## Arquitetura

```
PESQUISA → BANCO DE IDEIAS → LLM → ROTEIROS
        → VÍDEO / CARROSSEL / POST
        → SHORTS / IG / TIKTOK / PINTEREST
        → TRÁFEGO → FUNIL → VENDA
```

## Workflows incluídos

| Arquivo | Função |
|---------|--------|
| `01-idea-to-script.json` | Ideia → roteiro estruturado via LLM |
| `02-lead-capture-notify.json` | Webhook lead → e-mail + planilha + WhatsApp |
| `03-content-derivation.json` | Roteiro → 12 derivados (textos) |

## Variáveis de ambiente necessárias

- `OPENAI_API_KEY` ou equivalente LLM  
- `RESEND_API_KEY` / SMTP  
- `SHEET_WEBHOOK` ou Google Sheets node  
- `WHATSAPP_TOKEN` (opcional)

## Como importar

1. Abra n8n → Workflows → Import from File  
2. Selecione o JSON  
3. Configure credenciais  
4. Ative
