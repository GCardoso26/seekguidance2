# Pagamentos de marketplace e escrow — o que a reunião perguntou

**Status:** nota de evidência (não é ADR, não é spec de produto)  
**Data:** 2026-09-10  
**Origem:** perguntas em aberto após apresentação da JudgeTCG a um grupo de desenvolvedores  
**Não substitui:** parecer jurídico, contrato de PSP, nem North Star (LPC de loja CNPJ)

---

## Por que esta nota existe

As perguntas abaixo surgiram como ponto focal depois de **testes unitários** e **um único acesso** à UI. Isso **não** constitui evidência de que o marketplace financeiro está no ar, nem de como incumbentes (Liga, MyPCards) liquidam dinheiro.

Hierarquia: Constituição → ADRs → North Star. Copiar o PSP da Liga **não** entra como feature. O problema observado é **dúvida de conformidade e de modelo de dinheiro**, não falta de um gateway a mais.

Pendência de desempenho (Guilherme: limitadores / Next.js / lentidão) é **ortogonal**. Produção observada em 2026-09-09: Vercel no ar, Render suspenso/`404`, `GET /api/health` **503**. Ajustar rate-limit no BFF não cria liquidez nem PSP de marketplace.

---

## 1. Como Liga e MyPCards estruturam pagamento e conformidade (visão **pública**)

Ninguém neste repositório tem o código interno, o contrato de credenciamento nem a autorização BACEN dessas empresas. O que segue é **observação de produto público** + analogia regulatória. Não tratar como spec copiável.

### Dois desenhos que o mercado TCG BR realmente usa

| Modelo | Quem é o recebedor na origem | Onde o “escrow” mora | Conformidade típica |
|--------|------------------------------|----------------------|---------------------|
| **A — Split / Connect** | Loja (ou subconta regulada do PSP) | PSP retém/reparte na liquidação | Marketplace **não** guarda o GMV; KYC/split no PSP |
| **B — Merchant of record + carteira** | CNPJ da plataforma | Ledger interno: hold → release → saque | Plataforma atua como **recebedora** e **pagadora** a terceiros; puxa IP / subcredenciador / PLD |

Liga e MyP, no que o comprador **vê**, se aproximam mais do **modelo B** (plataforma no meio do dinheiro) do que de um checkout “loja única” Cielo/Rede.

### Liga (LigaMagic / LigaSegura) — o que é visível

- Checkout de marketplace com **PIX** (cobrança gerada após confirmar) e **cartão**.
- Taxa explícita de marketplace (ex.: valor fixo por pedido no cartão) **além** da taxa do cartão — sinal de que a **plataforma** é parte da cadeia, não só um site de vitrine.
- Termos citam LigaMagic + **LigaSegura** e as lojas envolvidas (compra mediada, não P2P puro).
- Histórico público de meios: PagSeguro, PayPal, depósito em CNPJ de portal de compras — típico de **um merchant** recebendo e depois acertando com lojas.

O que **não** dá para afirmar: se hoje liquidam via subcredenciador próprio, IP autorizada, split PagSeguro/Pagar.me, ou mix. Internamente a JudgeTCG trata a Liga sobretudo como **incumbente de liquidez** (Bazar) e fallback de imagem — **não** como contrato de PSP a replicar.

Bazar / proxy MVS **não é GMV** da JudgeTCG. P2P de bazar ≠ marketplace de loja CNPJ (ADR-018 / North Star).

### MyPCards — o que é visível

Fluxo público de **carteira**:

1. Comprador **deposita** (cartão, PIX, boleto, depósito).
2. Compra só com **saldo**.
3. Vendedor recebe **crédito** após confirmação de recebimento (hold operacional).
4. **Saque** com tarifa; comissão do vendedor na faixa típica de marketplace TCG.

Copy do tipo “transações asseguradas pelo MYP Cards” = **modelo B**: a plataforma é o merchant/escrow operacional. Não é split na origem no adquirente do seller.

Esse desenho responde “compra protegida” com **ledger**, não com gateway de e-commerce de loja única.

---

## 2. Por que gateways comuns de e-commerce **não** fazem marketplace com escrow

Escrow de marketplace **não** é “PIX com QR” nem “webhook de pago”. É **reter e depois soltar dinheiro de terceiros** (comprador → plataforma ou PSP → lojista), com disputa, chargeback e prazo.

### Motivo 1 — o contrato do gateway é de **um** estabelecimento

Cielo, Rede, Getnet, “PagSeguro loja”, Asaas no modo conta única, Stripe **sem** Connect:

- Um CNPJ = **merchant of record**.
- Liquidação na conta dessa pessoa jurídica.
- Contrato costuma **vedar intermediação** (receber por terceiros / “repasse a lojistas”).
- Sem KYC de N sellers, sem split por pedido, sem roteamento de chargeback por loja.

O produto resolve **loja própria**, não **arranjos com N recebedores**.

### Motivo 2 — escrow + GMV na conta da plataforma muda a figura regulatória

No Brasil, quem **habilita recebedores** e/ou **recebe o fluxo para depois pagar o lojista** deixa o mundo “site com checkout” e entra no arranjo de pagamentos:

- **Subcredenciador / facilitador** (conceito consolidado na Resolução BCB **150/2021**; a Circular **3.886/2018** que o introduziu foi **revogada** e absorvida nessa resolução).
- Se a plataforma **emite saldo / moeda eletrônica** (carteira do tipo MyP), aproxima-se de **instituição de pagamento** (Lei 12.865/2013 e normas de IP).
- **PLD/FT** (Circular BCB **3.978/2020** e atualizações): identificação de pagadores e recebedores, não só “user_id” no app.
- Volumes altos: liquidação centralizada de subcredenciador (Res. 150, com endurecimento posterior — ex. Res. BCB **522/2025**). **JudgeTCG está longe desse volume**; o ponto é o **tipo** de atividade, não só o GMV.

Gateway de e-commerce **não** assume esse papel no SKU “plano básico”: KYC, reserva de capital, CIP/Núclea, chargeback multi-seller e contrato de bandeira são o produto **caro**. Por isso o mesmo PSP vende **loja** barato e **marketplace/split** como produto separado (Pagar.me Marketplace, Mercado Pago Marketplace, Stripe Connect, etc.).

### Motivo 3 — PIX na chave do seller **não é** escrow

PIX é liquidação **imediata** e **irrevogável** na chave destino.

- Chave da loja: o dinheiro já é do seller. Disputa vira briga civil; a plataforma **não** segura o GMV.
- Chave da plataforma (`platform_pix_key`): a plataforma **recebeu** o GMV. Isso **é** custódia operacional — exatamente o anti-padrão se não houver IP/PSP/contrato que autorize o fluxo.

Escrow de verdade no cartão usa captura tardia / hold no credenciador **ou** split com `on_behalf_of` / destination charge. No PIX, ou o PSP oferece **conta de transação / split PIX**, ou o marketplace opera **modelo B** (carteira) de forma consciente e assessorada.

### Motivo 4 — unit test e um pageview não exercitam o arranjo

| O que o time rodou | O que isso prova | O que **não** prova |
|--------------------|------------------|---------------------|
| Testes unitários de webhook Asaas, FSM de escrow, skeleton de gateway | A **máquina de estados** e o **fail-closed** compilam | Liquidação, KYC de loja, chargeback, produção |
| Um acesso à plataforma | UI/BFF responde (ou 503 se a API estiver fora) | Conformidade, split, escrow com dinheiro real |

`SkeletonPaymentGateway` para `asaas` / PagSeguro / Pagar.me **lança erro de propósito** até credencial + wiring. Checkout V2 **não** é PSP live desses nomes.

---

## 3. O que a JudgeTCG **já tem** (código), sem inflar o produto

Mapa honesto — não é ranking de maturidade de mercado.

| Peça | Onde | Papel real |
|------|------|------------|
| Stripe Connect (onboarding no painel) | UI vendedor + stubs de payout | Modelo **A** pretendido para loja CNPJ; payout Stripe marcado como **stub** em `PAYOUTS.md` |
| PIX loja | `shop_pix.py` + `AsaasGateway` / OpenPix / Manual | Modelo **loja**: PIX na **chave do produto/loja** |
| “Compra protegida” | `shop_escrow.py` + `use_escrow` | FSM + taxa 3% + prazos; PIX escrow usa **`platform_pix_key`** (modelo **B** no dinheiro) |
| Ledger `fin_*` | Financial Platform | Dual-read / políticas; **não muta** o checkout (`FINANCIAL_POLICIES.md`) |
| Split paramétrico | `SPLIT_PAYMENTS.md` | Regras `fin_split_*`; **não** é liquidação BACEN |
| Asaas no Checkout V2 | `createPaymentGateway.ts` | **Skeleton fail-closed** — alinhado à reunião (“Bruno usa Asaas; a equipe avalia gateway”), **não** à produção de split |

Bruno/Asaas na ata: o adapter PIX Asaas existe; o gateway Asaas do Checkout V2 **não** está wired. Trocar de PSP **sem** decidir A vs B só aumenta complexidade (Constituição).

Produção: checkout live **não comprovado** enquanto a API Render estiver fora. Código de escrow ≠ dinheiro em escrow.

---

## 4. Resposta curta para a sala (e para o Diego)

**Liga / MyP:** no que é público, operam **plataforma no fluxo do dinheiro** (taxas de marketplace, carteira, hold até confirmação). A conformidade disso é **contrato de PSP + eventual IP/subcredenciador + PLD**, não um plugin de gateway de loja.

**Por que o gateway “de e-commerce” recusa escrow de marketplace:** o SKU é um merchant; escrow multi-seller é **custódia de terceiro** e, no cartão, **participação no arranjo**. O PSP só faz isso no produto de **marketplace/split**, com KYC de N recebedores. PIX imediato na chave do seller não segura o pedido; PIX na chave da JudgeTCG sem desenho regulado é o risco inverso.

**O que não fazer agora:** implementar Asaas/PagSeguro “porque a reunião pediu”, otimizar Next.js como substituto de API, ou tratar teste unitário como evidência de escrow. Decisão de produto (quando houver GMV real de loja CNPJ): **Connect/split no PSP (A)** vs **não operar custódia**. Modelo B (carteira MyP-like) é projeto de instituição, não de sprint.

---

## Relacionados

- [`FINANCIAL_PLATFORM.md`](./FINANCIAL_PLATFORM.md) — ledger overlay; checkout/Stripe/PIX inalterados no day-1  
- [`ESCROW.md`](./ESCROW.md) / [`PAYOUTS.md`](./PAYOUTS.md) / [`SPLIT_PAYMENTS.md`](./SPLIT_PAYMENTS.md)  
- [`../engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md`](../engineering/TEAM_ONBOARDING_ESTADO_ATUAL.md) — estado real de produção  
- ADR-007 (fronteira Marketplace ≠ Payment) · ADR-015 (não reabrir arquitetura por analogia) · ADR-018 + spec de credenciamento de loja CNPJ  
