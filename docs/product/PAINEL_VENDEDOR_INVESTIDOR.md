# Painel do vendedor — leitura para investidor

**UI:** `/vendedor/painel` · **Visio:** [`JudgeTCG_Painel_Vendedor_Investidor.vsdx`](../architecture/visio/JudgeTCG_Painel_Vendedor_Investidor.vsdx)  
**Não é prova de LPC.** LPC = 0. Este texto descreve **capacidades de software** da loja CNPJ.

## Uma frase

O painel é o **sistema operacional da loja**: publicar oferta, cumprir pedido, receber (Stripe/PIX) e atender o comprador **sem a equipe JudgeTCG no meio** — condição necessária para LPC, não suficiente enquanto a API de produção estiver fora.

## O que o print da tela mostra (e o que não mostra)

| No print | Leitura correta |
|----------|-----------------|
| Banner vermelho “Status da conta indisponível” | `GET /api/account/status` falhou (FastAPI/Render fora). O painel **continua aberto** (fail-open). |
| “Você ainda não tem uma loja cadastrada” | `GET /api/stores/mine` não devolveu loja (503 ou vazio). |
| Badges Pedidos **12** / Atendimento **3** | Com API fora, vêm do **mock** de overview — não são pedidos reais. |
| Menu completo | Quase todos os itens existem como UI; chat/CRM/promoções estão `comingSoon` e **fora** do menu. |
| “Cadastrar loja” no empty state | Leva a onboarding **Stripe Connect**, que **não cria** a entidade loja. Criação real: `/stores/create`. |

## Ciclo que o investidor deve memorizar

```text
Cadastrar loja (CNPJ) → Publicar anúncio → Buyer encontra oferta
    → Pedido (pago → separação → envio) → Stripe/PIX → Repasse
```

Isso é o desenho do painel. Em produção hoje o **front existe**; a execução desse ciclo depende de religar a FastAPI.

Fonte de menu: `frontend/runtime_console_v3/src/lib/seller-sidebar-nav.ts`.
