# Sprint 8 — Protocolo de Operação Onda 1

**Status:** Obrigatório antes de enviar convites  
**Modo:** founder-led marketplace validation · **beachhead = Disney Lorcana Brasil**  
**Código:** congelado após Lote 1 enviado (exceto P0) · medição Day 0 OK · engenharia R1 estabilizada  
**Métricas:** framework congelado — [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md) · [`LPC_ANALYTICS_SPEC.md`](../product/LPC_ANALYTICS_SPEC.md)  
**Relaciona:** [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md) · [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md) · [`SELLER_BETA_ONBOARDING_RUNBOOK.md`](./SELLER_BETA_ONBOARDING_RUNBOOK.md) · [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) · [`BETA_LOTE1_EXECUTION.md`](./BETA_LOTE1_EXECUTION.md)

**Estado:** engenharia do Dia 0 concluída (migration · seed · SMOKE_OK · Baseline #0). O próximo aprendizado vem das **10 conversas** e dos dados da Onda 1 — não do repositório.

---

## Regra #1 — Não otimizar antes de observar

Durante os **primeiros 7 dias** após o Lote 1:

**Não alterar:** fluxo seller · textos principais · telas · campos · onboarding · **definição de LPC/LCS/SD/invariantes**

**Exceto P0:** impede publicar · impede ver oferta  

Motivo: mudança a cada reclamação (ou reinterpretar métricas no meio da janela) contamina o diagnóstico.  
Maior risco agora: disciplina de execução — não falta de definição.

---

## Regra #2 — Nenhum P1 vira código antes do Report #1

Mesmo que **três lojas peçam a mesma melhoria** (ex.: CSV · edição em massa · atalho de UX):

1. **Registrar** como P1 (entrevista / Command Center / planilha)  
2. **Não implementar** durante a janela inicial  

P1 antes do Report #1 esconde se o problema real é **aquisição**, **ativação** ou **liquidez**.  
Só P0 (bloqueia oferta / publicação) justifica código antes do Report #1.

---

## Dia 0 — Founder (operação)

Engenharia já está ✅. Só falta isto:

| # | Ação | Status |
|---|------|--------|
| 1 | Preencher `URL_DO_BETA` | ⬜ |
| 2 | Preencher contato de suporte | ⬜ |
| 3 | Subir Redis + workers no ambiente compartilhado | ⬜ |
| 4 | Round-trip de produção (usuário **novo**, não-admin) — ver abaixo | ⬜ |
| 5 | Enviar **apenas** Lote 1 (10) · registrar na planilha | ⬜ |
| 6 | Freeze de código 7 dias (exceto P0) | ⬜ após envio |

### Teste de produção (obrigatório antes do 1º WhatsApp)

Usuário **totalmente novo**. Cronometrar. Sem intervenção.

```text
/register → /seller → Criar Loja → Buscar "Rapunzel" → Publicar
→ Janela anônima → /search?q=Rapunzel → PDP → Oferta → Carrinho
```

Se completar sem intervenção: **não tocar mais no código** até Report #1 (exceto P0).

---

## Checklist final antes do Lote 1

1. [x] [`BETA_REPORT_0_BASELINE.md`](./BETA_REPORT_0_BASELINE.md) preenchido (catalog + smoke)  
2. [ ] Round-trip de produção (fluxo acima · tempo anotado)  
3. [ ] Planilha com colunas de early adopter (abaixo)  
4. [x] Hipótese do Lote 1 escrita (abaixo)  
5. [x] Mensagens **sem** a palavra “marketplace” (runbook)  
6. [ ] Analytics + pergunta de intent pós-1º anúncio funcionando  
7. [ ] Enviar **apenas 10** convites (Lote 1) — kit: [`BETA_LOTE1_EXECUTION.md`](./BETA_LOTE1_EXECUTION.md)  
8. [ ] Não tocar no código por 7 dias (Regra #1 + #2)  

---

## 1. Hipótese explícita por lote

Não medir só “deu certo / não”.

### Lote 1 (10 contatos)

**Hipótese:**

> Lojas especializadas em Disney Lorcana entendem o valor de um canal onde singles pedidas aparecem na busca — sem demonstração técnica.

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

Riscos da Semana 1 (em ordem — **não** técnicos):

1. Ninguém responde ao convite  
2. Respondem, mas não entram  
3. Entram, mas não publicam  
4. Publicam, mas não voltam  
5. Buyer não encontra oferta  

| Caso | Funil | Problema provável | Ação |
|------|-------|-------------------|------|
| **A** | Convite → ninguém responde | Público / mensagem / incentivo / timing | **Não** mexer no produto |
| **B** | Responde → entra → **não publica** | Onboarding / confiança / esforço | Registrar P1; código só após Report #1 |
| **C** | Publica → sem compra / buyer não acha | Liquidez / demanda / descoberta | **Não** é checkout / Stripe |

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

Loja que publica Rapunzel e abandona ≠ loja que quer 300 singles relevantes.

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

- Dia 1: “publiquei Rapunzel – Gifted with Healing”  
- Dia 5: “ainda não vendi, mas coloquei mais 50 singles de Lorcana”  

Isso vale mais que cadastro.

### Vermelho

Ninguém responde · acham trabalhoso · ninguém chega ao 1º anúncio.

---

## Liquidity Proof (marco antes de Sprint 9) = LPC

**Não** é “primeira venda” / Stripe.

```text
Pessoa A (sem ajuda)     → publica carta
Pessoa B (≠ A)           → busca / abre PDP
Pessoa B                 → encontra oferta → adiciona ao carrinho
```

Cada ocorrência válida incrementa **LPC** (evento sintético `liquidity_proof_completed`).  
Acompanhar também **LCS** (cobertura da watchlist).  
Canônico: [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md).

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
