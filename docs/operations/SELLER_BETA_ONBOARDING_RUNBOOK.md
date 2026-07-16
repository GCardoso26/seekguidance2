# Seller Beta Onboarding Runbook

**Sprint:** 8.0 — Operação Beta  
**Status:** Pronto para uso  
**Modo:** operação · não engenharia · founder-led validation  
**Antes de enviar convites:** [`BETA_WAVE1_OPERATION_PROTOCOL.md`](./BETA_WAVE1_OPERATION_PROTOCOL.md)  
**Relaciona:** [`SPRINT_8_PLAN.md`](../product/SPRINT_8_PLAN.md) · [`SELLER_EXPERIENCE_CONTRACT.md`](../product/SELLER_EXPERIENCE_CONTRACT.md)

## Princípio

Não vender “um marketplace novo”.  
Vender **um canal adicional para vender cartas**.

Uma loja **ativa** (publicou anúncio) vale mais que 20 cadastros mortos.

---

## 1. Quem convidar

### Grupo A — Lojas físicas MTG (supply)

Perfil:

- já possuem estoque
- vendem Commander / singles
- têm comunidade local

Objetivo: validar **oferta** (listings reais).

### Grupo B — Vendedores pequenos (usabilidade)

Perfil:

- jogadores que vendem cartas
- vendedores de marketplace (ML / Facebook)
- colecionadores

Objetivo: validar se **qualquer pessoa** publica sem treinamento.

### Meta da primeira onda (não 50 de imediato)

| Métrica | Esperado |
|---------|----------|
| Convites enviados | 30 |
| Aceites | 10 |
| Lojas ativas (≥1 anúncio) | 5 |
| Com primeiro anúncio | 5 |

Stretch (depois da onda 1 estável): até 50 lojas.

---

## 2. Kit Loja Beta

### 2.1 Mensagem de convite

#### Grupo A — lojas físicas (preferir esta)

Foco: **demanda encontra suas cartas**, não “trabalho de cadastro”.

```text
Olá [Nome / Loja],

Estamos testando uma nova forma de conectar jogadores que procuram
cartas específicas com lojas que já têm estoque.

Queremos convidar algumas lojas para colocar suas principais cartas
no beta do JudgeTCG e acompanhar se aparecem compradores interessados.

Não pedimos inventário completo — só as cartas mais procuradas
(ex.: 50–100 staples / Commander) para aparecerem quando alguém pesquisar.

Link: [URL_DO_BETA]
Contato se travar: [WHATSAPP_OU_EMAIL]

Obrigado,
Equipe JudgeTCG
```

#### Grupo B — vendedores pequenos (alternativa curta)

```text
Olá [Nome],

Estamos abrindo o beta do JudgeTCG (compra/venda de cartas Magic) e
convidando alguns vendedores para testar de graça.

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
| 50–100 cartas mais vendidas | “Cadastre todo o estoque” |
| Staples Commander / singles quentes | Import CSV (bloqueado na Sprint 8) |

Objetivo: **liquidez**, não inventário completo.

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
3. `/seller/listings/new` → buscar uma carta conhecida (ex.: Lightning Bolt / Sol Ring)  
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
| 1 | Kit pronto · enviar ~30 convites · meta 10 aceites |
| 2 | Observar publicação real · 5 testes cegos cronometrados |
| 3 | Corrigir fricções P0/P1 (copy/UX) · **sem feature nova** |
| 4 | Relatório · go/no-go Sprint 9 (payment) |

Relatório semanal: [`BETA_WEEKLY_REPORT_TEMPLATE.md`](./BETA_WEEKLY_REPORT_TEMPLATE.md)

---

## 9. Critério para entrar em Sprint 9 (Payment)

Não basta “10 lojas” nem só “500 listings”. Entrar em Sprint 9 se:

### Supply

- [ ] ≥10 lojas cadastradas  
- [ ] ≥5 lojas ativas (≥1 anúncio)  
- [ ] 300–500 listings ativos (meta de volume — **não** único gatilho)

### Liquidez (obrigatório)

- [ ] Top ~20 da Liquidity Watchlist com ≥1 oferta  
  (ver [`BETA_COMMAND_CENTER.md`](./BETA_COMMAND_CENTER.md))

### Buyer (obrigatório)

- [ ] Usuários chegam a ofertas (`buyer_offers_viewed` / teste cego)

### Seller (obrigatório)

- [ ] Segunda sessão de publicação **sem** ajuda ao vivo

**Lembrete:** 500 cartas ruins &lt; 50 cartas certas. Watchlist vazia = sem go.

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
