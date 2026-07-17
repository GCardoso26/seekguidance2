# Seller Beta Onboarding Runbook

**Sprint:** 8.0 — Operação Beta · **Disney Lorcana Brasil**  
**Status:** Pronto para uso  
**Modo:** operação · não engenharia · founder-led validation  
**Antes de enviar convites:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)  
**Relaciona:** [`MVP_1_0_RELEASE_PLAN.md`](../architecture/MVP_1_0_RELEASE_PLAN.md) · [`SPRINT_8_PLAN.md`](../product/SPRINT_8_PLAN.md) · [`SELLER_EXPERIENCE_CONTRACT.md`](../product/SELLER_EXPERIENCE_CONTRACT.md)

## Princípio

Não vender “um marketplace novo”.  
Vender **um canal para as cartas certas de Disney Lorcana aparecerem quando alguém procura**.

Uma loja **ativa** (publicou anúncio) vale mais que 20 cadastros mortos.  
Em Lorcana: **qualidade do supply &gt; volume bruto**.

---

## 1. Quem convidar

### Grupo A — Lojas especializadas em Lorcana (supply)

Perfil:

- já possuem estoque de Disney Lorcana
- vendem singles / sealed / encantadas
- têm comunidade local ou Discord/WhatsApp de Lorcana

Objetivo: validar **oferta** (listings relevantes).

### Grupo B — Vendedores pequenos (usabilidade)

Perfil:

- jogadores que vendem singles de Lorcana
- vendedores de ML / Facebook / grupos
- colecionadores com carta quente

Objetivo: validar se **qualquer pessoa** publica sem treinamento.

### Meta da primeira onda (não 50 de imediato)

| Métrica | Esperado |
|---------|----------|
| Convites enviados | 30 |
| Aceites | ~10 |
| Lojas especializadas ativas (≥1 anúncio) | **≥5** |
| Listings relevantes | **150–300** |
| Watchlist com oferta | ≥80% do top ~20 |

---

## 2. Kit Loja Beta

### 2.1 Mensagem de convite

#### Grupo A — lojas físicas (preferir esta)

Foco: **demanda encontra suas cartas**, não “trabalho de cadastro”.

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

#### Grupo B — vendedores pequenos (alternativa curta)

```text
Olá [Nome],

Estamos abrindo o beta do JudgeTCG focado em cartas de Disney Lorcana
e convidando alguns vendedores para testar de graça.

A ideia: colocar suas cartas mais pedidas para aparecerem na busca
de quem está procurando — e nos ajudar a ajustar a experiência.

Link: [URL_DO_BETA]
Contato: [WHATSAPP_OU_EMAIL]

Equipe JudgeTCG
```


### 2.2 O que a loja precisa saber (só isso)

1. Criar conta  
2. Criar loja  
3. Publicar o primeiro anúncio  
4. Adicionar mais cartas (mesmo fluxo)

**Não explicar:** arquitetura, roadmap, pagamento futuro, SEO, dashboard, CSV.

### 2.3 Massa inicial sugerida

| Pedir | Não pedir |
|-------|-----------|
| 30–80 cartas mais pedidas de Lorcana | “Cadastre todo o estoque” |
| Staples competitivos + encantadas / colecionáveis quentes | Import CSV (bloqueado na Sprint 8) |

Objetivo: **liquidez na watchlist**, não inventário completo.

### 2.4 Checklist da loja (enviar junto)

```text
[ ] Abri o link do beta
[ ] Criei conta (/register)
[ ] Entrei (/login)
[ ] Abri Portal do vendedor (/seller)
[ ] Criei a loja (só o nome)
[ ] Publiquei o 1º anúncio (buscar carta → preço/condição → Publicar)
[ ] Confirmei que a carta aparece para comprador (busca → ofertas)
[ ] Publiquei mais 9 cartas (meta mínima de sessão: 10)
```

---

## 3. Passos da primeira sessão (facilitador)

Duração alvo: **&lt; 15 min** com a loja (ideal: primeiro anúncio &lt; 60s sozinho).

1. Abrir `/register` → criar conta  
2. Login → `/seller` → **Criar loja**  
3. `/seller/listings/new` → buscar uma carta conhecida (ex.: Rapunzel – Gifted with Healing / Be Prepared)  
4. Quantidade · condição · idioma · foil · preço → **Publicar anúncio**  
5. Abrir em aba anônima: `/search?q=…` → PDP → bloco **Ofertas**  
6. Pedir mais 9 publicações no mesmo padrão  
7. Aplicar **perguntas pós-uso** (abaixo)

Se travar: anotar como P0/P1/P2 — **não** prometer feature nova na hora.

---

## 4. Loja “ativada” — critérios

Uma loja conta como **ativada** quando **todos** forem verdadeiros:

| # | Critério |
|---|----------|
| 1 | Conta criada (`seller_signup_completed`) |
| 2 | Loja criada (`seller_shop_created`) |
| 3 | ≥1 listing ativo (`seller_listing_published`) |
| 4 | Sem ajuda ao vivo no 2º anúncio em diante (opcional mas desejável) |

Métricas derivadas:

| Métrica | Fórmula |
|---------|---------|
| `seller_activation_rate` (shop→listing) | `listing_published / shop_created` |
| `seller_activation_rate` (signup→listing) | `listing_published / signup_completed` |

Acompanhar **as duas**: conta abandonada ≠ loja abandonada.

---

## 5. Funil seller (instrumentação)

```text
seller_portal_visit
        ↓
seller_signup_completed   (ou login se já tinha conta)
        ↓
seller_shop_created
        ↓
seller_card_selected
        ↓
seller_listing_published
```

Também: `seller_time_to_first_listing_ms` (shop_created → first publish).

Eventos vivem no frontend (`Analytics.track`). Sink atual = console estruturado até haver endpoint/ferramenta.

---

## 6. Perguntas pós-uso

Usar o script completo: [`BETA_INTERVIEW_SCRIPT.md`](./BETA_INTERVIEW_SCRIPT.md).

Resumo seller (após publicar):

1. O que esperava depois de Publicar?  
2. Confiaria em colocar 500 cartas?  
3. O que impediria uso semanal?  
4. Onde ainda venderia antes do JudgeTCG?

Resumo buyer (teste cego):

1. Encontrou o que queria?  
2. A oferta parece confiável?  
3. Compraria aqui?

---

## 7. Respostas padrão a pedidos comuns

| Pedido | Resposta |
|--------|----------|
| Importar CSV | “No beta fazemos manual primeiro. Se 20 cartas manuais não fluírem, CSV não resolve liquidez.” |
| Dashboard | “Meus anúncios já mostra o essencial. Dashboard depois das primeiras vendas.” |
| Aparecer no Google | “SEO vem quando houver oferta densa. Agora o foco é ter oferta na carta procurada.” |
| Pagamento / saque | “Próxima fase (Sprint 9). Beta valida cadastro e demanda.” |

---

## 8. Cronograma sugerido (4 semanas)

| Semana | Foco |
|--------|------|
| 1 | Kit pronto · enviar ~30 convites · meta ≥5 lojas Lorcana ativas |
| 2 | Observar publicação real · 5 testes cegos (watchlist Lorcana) |
| 3 | P0 imediato · P1 só após Report #1 (registrar antes; **sem feature nova** na janela) |
| 4 | Relatório · go/no-go Sprint 9 (payment) |

Relatório semanal: [`BETA_WEEKLY_REPORT_TEMPLATE.md`](./BETA_WEEKLY_REPORT_TEMPLATE.md)

---

## 9. Critério para entrar em Sprint 9 (Payment)

Não basta “5 lojas” nem só “300 listings”. Entrar em Sprint 9 se:

### North Star

- [ ] **LPC** ≥ 1 (buyer ≠ seller → cart, sem intervenção)  
- [ ] **LCS** ≥ 80%  

### Supply

- [ ] ≥5 lojas especializadas ativas (≥1 anúncio)  
- [ ] **150–300** listings relevantes (qualidade &gt; bulk)

### Liquidez (obrigatório)

- [ ] Watchlist alinhada ao LCS — ver [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md) · [`NORTH_STAR_RELEASE_1.md`](../product/NORTH_STAR_RELEASE_1.md)

### Buyer (obrigatório)

- [ ] ≥1 comprador chega a ofertas / carrinho sem ajuda (contribui ao LPC)

### Seller (obrigatório)

- [ ] Segunda sessão de publicação **sem** ajuda ao vivo

**Lembrete:** 300 cartas certas &gt; 3000 bulk. LPC=0 = sem go para payment.

---

## 10. Registro operacional (por loja)

| Campo | Exemplo |
|-------|---------|
| Nome / contato | … |
| Grupo | A / B |
| Convite enviado | data |
| Aceite | data / não |
| Ativada? | sim / não |
| # listings | n |
| P0/P1 observados | … |
| Notas | … |

Manter planilha ou tabela simples fora do código.
