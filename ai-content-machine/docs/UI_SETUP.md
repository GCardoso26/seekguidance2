# UI Setup — Content Studio

Studio em `/studio` (não substitui o funil de vendas).

| Rota | Função |
|---|---|
| `/studio` | Home: o que fazer / o que precisa de atenção |
| `/studio/setup` | Wizard: Workspace → Content → AI → Voice → Visuals → Publishing → Test |
| `/studio/create` | Criar Short (tema, estilo, duração) |
| `/studio/production/:id` | Timeline + fallback manual de assets |
| `/app/automation` | Advanced / fábrica técnica (progressive disclosure) |

O utilizador comum não precisa de `.env` durante a criação do vídeo.
API keys entram no wizard (armazenadas como env/vault no servidor — a UI não guarda secrets em localStorage).
