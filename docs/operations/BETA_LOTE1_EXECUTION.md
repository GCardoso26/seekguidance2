# Lote 1 — Execução (10 convites)

**Status:** Engenharia OK · aguarda founder (operação)  
**Pré-requisito:** [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) · smoke Rapunzel OK  
**Protocolo:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md) · Regra #2: **nenhum P1 vira código antes do Report #1**  
**Mensagens:** [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) §2.1

## Hipótese do Lote 1

> Lojas especializadas em Disney Lorcana entendem o valor de um canal onde singles pedidas aparecem na busca — sem demonstração técnica.

## Checklist pré-envio (Founder)

1. [x] Baseline #0 (catalog + smoke) — engenharia  
2. [x] `URL_DO_BETA` preenchida  
3. [x] Contato de suporte preenchido  
4. [x] Redis + workers no ambiente compartilhado (Render `tcg-judge-api` / `pc-workers` / sealed cron)  
5. [ ] Round-trip de produção (usuário **novo**, não-admin) — cronometrar:  
   `/register` → `/seller` → Criar Loja → Buscar Rapunzel → Publicar → janela anônima → `/search?q=Rapunzel` → PDP → Oferta → Carrinho  
6. [ ] Enviar **apenas 10** convites  
7. [ ] Registrar na planilha ([`lote1_planilha.md`](./lote1_planilha.md))  
8. [ ] Freeze 7 dias (exceto P0; **P1 só após Report #1**) — ver [`EVIDENCE_R4_SESSION_PACK.md`](./EVIDENCE_R4_SESSION_PACK.md)  

**URL_DO_BETA:** `https://judgetcg.com.br`  
**Contato suporte:** `ops@judgetcg.com.br`  
**Tempo do round-trip (min):** _______ · Sem intervenção? S / N  

**Engenharia (2026-07-24):** sink LPC no FE prod (`runtime_console_v3`) + registry BE — eventos `seller_listing_published` · `buyer_card_open` · `buyer_offers_viewed` · `buyer_add_to_cart`. Round-trip humano ainda **pendente founder**.

## Mensagem (copiar — Grupo A)

```text
Olá [Nome / Loja],

Estamos testando uma forma de conectar jogadores que procuram
cartas específicas de Disney Lorcana com lojas que já têm estoque.

Convidamos algumas lojas especializadas para colocar singles relevantes
no beta do JudgeTCG e ver se compradores encontram essas cartas na busca.

Não pedimos inventário completo — só as cartas mais pedidas
(ex.: 30–80 staples / encantadas / cartas quentes do meta) para
aparecerem quando alguém pesquisar.

Link: https://judgetcg.com.br
Contato se travar: ops@judgetcg.com.br

Obrigado,
Equipe JudgeTCG
```

## Planilha Lote 1 (10)

| # | Loja / contato | Canal | Enviado | Resposta | Entrou | Publicou | Intent | Notas |
|---|----------------|-------|---------|----------|--------|----------|--------|-------|
| 1 | | WA / e-mail | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |
| 8 | | | | | | | | |
| 9 | | | | | | | | |
| 10 | | | | | | | | |

## Após envio

- Registrar data/hora do Lote 1 no Command Center  
- Congelar produto 7 dias  
- Report #1: gargalo = aquisição / ativação / liquidez  

**Não medir ainda:** GMV · Stripe · volume total de listings.
