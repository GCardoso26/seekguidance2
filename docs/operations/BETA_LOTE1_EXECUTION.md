# Lote 1 — Execução (10 convites)

**Status:** Engenharia OK · aguarda founder (operação)  
**Pré-requisito:** [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) · smoke Rapunzel OK  
**Protocolo:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md) · Regra #2: **nenhum P1 vira código antes do Report #1**  
**Mensagens:** [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) §2.1

## Hipótese do Lote 1

> Lojas especializadas em Disney Lorcana entendem o valor de um canal onde singles pedidas aparecem na busca — sem demonstração técnica.

## Checklist pré-envio (Founder)

1. [x] Baseline #0 (catalog + smoke) — engenharia  
2. [ ] `URL_DO_BETA` preenchida  
3. [ ] Contato de suporte preenchido  
4. [ ] Redis + workers no ambiente compartilhado  
5. [ ] Round-trip de produção (usuário **novo**, não-admin) — cronometrar:  
   `/register` → `/seller` → Criar Loja → Buscar Rapunzel → Publicar → janela anônima → `/search?q=Rapunzel` → PDP → Oferta → Carrinho  
6. [ ] Enviar **apenas 10** convites  
7. [ ] Registrar na planilha  
8. [ ] Freeze 7 dias (exceto P0; **P1 só após Report #1**)  

**URL_DO_BETA:** _______________________  
**Contato suporte:** _______________________  
**Tempo do round-trip (min):** _______ · Sem intervenção? S / N

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

Link: [URL_DO_BETA]
Contato se travar: [WHATSAPP_OU_EMAIL]

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
