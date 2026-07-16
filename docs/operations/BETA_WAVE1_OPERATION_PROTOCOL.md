# Sprint 8 — Protocolo de Operação Onda 1

**Status:** Obrigatório antes de enviar convites  
**Modo:** founder-led marketplace validation  
**Código:** congelado após Lote 1 enviado (exceto P0) · medição Day 0 OK  
**Relaciona:** [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md) · [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) · [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md)

---

## Regra #1 — Não otimizar antes de observar

Durante os **primeiros 7 dias** após o Lote 1:

**Não alterar:** fluxo seller · textos principais · telas · campos · onboarding  

**Exceto P0:** impede publicar · impede ver oferta  

Motivo: mudança a cada reclamação contamina o diagnóstico.

---

## Checklist final antes do Lote 1

1. [ ] [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) preenchido  
2. [ ] Lightning Bolt round-trip (seller → buyer vê oferta)  
3. [ ] Planilha com colunas de early adopter (abaixo)  
4. [ ] Hipótese do Lote 1 escrita (abaixo)  
5. [ ] Mensagens **sem** a palavra “marketplace”  
6. [ ] Analytics + pergunta de intent pós-1º anúncio funcionando  
7. [ ] Enviar **apenas 10** convites (Lote 1)  
8. [ ] Não tocar no código por 7 dias  

---

## 1. Hipótese explícita por lote

Não medir só “deu certo / não”.

### Lote 1 (10 contatos)

**Hipótese:**

> Lojas e vendedores entendem o valor de um novo canal de venda sem precisar de demonstração técnica.

**Métrica principal:**

```text
Convite enviado
      ↓
Resposta positiva
      ↓
Acesso beta
      ↓
Primeiro anúncio
```

**Não olhar ainda:** # cartas · GMV · compradores  

Primeiro validar **vontade de participar**.

### Lote 2 (após 48h+)

**Hipótese (preencher após aprendizado do Lote 1):**

> _______________________________________________

Mensagem ajustada? S/N · O quê: _______________

### Lote 3

**Hipótese:** escalar o que funcionou no Lote 2.

> _______________________________________________

---

## 2. Mercado vs produto (não confundir)

| Caso | Funil | Problema provável | Ação |
|------|-------|-------------------|------|
| **A** | Convite → ninguém responde | Público / mensagem / incentivo / timing | **Não** mexer no produto |
| **B** | Responde → entra → **não publica** | Onboarding / confiança / esforço | Aí sim olhar UX (após janela 7d) |
| **C** | Publica → sem compra | Liquidez / demanda | **Não** é checkout / Stripe |

Erro clássico: tratar todo fracasso como UX.

---

## 3. Seller Activation Intent

Além de `seller_time_to_first_listing_ms`:

| Evento | `seller_intent_after_first_listing` |
|--------|-------------------------------------|
| Pergunta | “Você pretende cadastrar mais cartas depois desta primeira sessão?” |
| Valores | `will_add_more` · `maybe` · `no` |

- 1º anúncio mede **fricção**  
- Intent mede **potencial de supply**  

Loja que publica Lightning Bolt e abandona ≠ loja que quer 500 cartas.

UI: pergunta única após o primeiro publish (apps/web). Planilha: espelhar a resposta se vier na entrevista.

---

## 4. Planilha — early adopter

`JudgeTCG_Beta_Sellers.xlsx`

| Campo | Exemplo |
|-------|---------|
| Loja | Card Kingdom Local |
| Pessoa contato | João |
| Grupo | A / B |
| Canal convite | WhatsApp |
| Lote | 1 / 2 / 3 |
| **Já vende cartas hoje?** | Sim / Não |
| **Canal atual** | Loja física / ML / Facebook / Discord |
| **Estoque estimado** | 100 / 1000 / 10000 |
| **Dor atual** | vender / organizar / divulgar |
| **Motivação para testar** | curiosidade / novos clientes / facilidade |
| Convite enviado | data |
| Respondeu interessado | |
| Entrou no beta | |
| Criou conta | |
| Criou loja | |
| Primeiro anúncio | |
| Intent (will_add_more / maybe / no) | |
| Voltou sozinho (2ª sessão) | S / N |
| Listings | n |
| Observações | |

**Pergunta a responder:** quem é o early adopter real?

Hipótese: talvez **não** seja a loja grande primeiro — vendedor médio de singles · jogador Commander com coleção · loja pequena querendo canal adicional.

Separar sempre **Grupo A vs B** nos %.

---

## 5. Linguagem do convite

**Não usar** “marketplace” no convite.

Vender benefício: **cartas procuradas aparecem na busca** → oferta → descoberta → comprador.

Textos: runbook (Grupo A / B).

---

## Onda 1 — lotes

| Lote | n | Objetivo |
|------|---|----------|
| 1 | 10 | Validar mensagem / vontade |
| 2 | 10 | Ajustar copy (não UI) |
| 3 | 10 | Escalar |

Após Lote 1 + 48h: abriram? entenderam? interessante? ignoraram?  
0 respostas → problema de **convite**, não de produto.

---

## Critério de sucesso — Semana 1

Responde: **existe vontade inicial?** (ainda **não** é Go Sprint 9)

### Verde

```text
~30 convites (ao longo dos lotes)
  → ~10 respostas
  → ~5 entram
  → ~3+ publicam
  → ~1+ volta sozinho
```

**Retorno espontâneo** é o sinal mais valioso:

- Dia 1: “publiquei Lightning Bolt”  
- Dia 5: “ainda não vendi, mas coloquei mais 50”  

Isso vale mais que cadastro.

### Vermelho

Ninguém responde · acham trabalhoso · ninguém chega ao 1º anúncio.

---

## Liquidity Proof (marco antes de Sprint 9)

**Não** é “primeira venda” / Stripe.

```text
Pessoa A (sem ajuda)     → publica carta
Pessoa B (não conhece A) → busca carta
Pessoa B                 → encontra oferta → adiciona ao carrinho
```

Esse evento repetido **sem intervenção** > ligar Stripe em marketplace vazio.

### Depois da Onda 1 — cenários

| Cenário | Sintoma | Foco |
|---------|---------|------|
| **A** | Seller publica fácil | Demanda (ainda sem payment) |
| **B** | Entra, não publica | Ativação / UX (sem features) |
| **C** | Publica, buyer não encontra | Liquidez |

---

## Loop congelado a acompanhar

```text
Convite → Ativação Seller → Oferta criada → Oferta encontrada → Intenção de compra
```

Métrica que manda: **quantas vezes A vende / B compra sem a gente no meio.**
