# NEXUS IA — Máquina de conteúdo dark multiplataforma

Fábrica de distribuição para **TikTok + YouTube Shorts + Instagram Reels + Pinterest**, com funil:

```
Vídeo → link na bio → página gratuita → Starter Kit lite
→ e-mail/WhatsApp → produto R$67 → upsell R$397 → afiliados
```

**Promessa:** como usar IA para economizar tempo e ganhar dinheiro — sem aparecer no vídeo.

## Estrutura

```
ai-content-machine/
├── brand/           # Posicionamento, avatar, identidade
├── channels/        # 3 faces de audiência, 1 monetização
├── content/         # 50 ideias, 30 roteiros, matriz 1→12
├── funnel/          # Sequências e-mail e WhatsApp
├── metrics/         # Painel CSV (views → vendas)
├── n8n/             # Workflows importáveis
├── product/         # Starter Kit + Content Machine
└── web/             # Landing + obrigado + oferta + upsell + kit
```

## Subir o funil web

```bash
cd ai-content-machine/web
npm install
npm run dev
```

Abra `http://localhost:5173`.

### Variáveis

Copie `web/.env.example` → `web/.env` e preencha:

- `VITE_N8N_LEAD_WEBHOOK` — captura de leads
- `VITE_CHECKOUT_STARTER_URL` — checkout R$67
- `VITE_CHECKOUT_MACHINE_URL` — checkout R$397

Sem webhook, leads ficam em `localStorage` (modo demo).

## Plano 30 dias

Ver `PLAYBOOK-30-DIAS.md`.

## Regra nº 1

Não crie um canal. Crie uma fábrica.  
1 roteiro = unidade de conteúdo → 10–20 derivados.  
Recicle **informação**, não propriedade intelectual.
