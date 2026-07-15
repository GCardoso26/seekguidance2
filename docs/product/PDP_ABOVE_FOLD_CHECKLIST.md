# Checklist — ENVs legais + PDP above-the-fold (pós-CNPJ)

**Programa:** BP 5.2 Trust Engineering  
**Gate:** `brandHasLegalTransparency()` em `frontend/runtime_console_v3/src/lib/brand.ts`  
**Objetivo:** eliminar o aviso “dados fiscais incompletos” e colocar face legal / prova de compra na dobra de decisão da PDP.

---

## 1. ENVs exatos (obrigatórios para o gate)

Definir em **produção** (Vercel / host do `runtime_console_v3`) e espelhar em `.env.local` só com dados reais.  
**Não inventar CNPJ.** Valores vazios ou placeholder = gate FAIL.

| Variável | Obrigatória? | Consumida por | Formato / regra |
|----------|:------------:|---------------|-----------------|
| `NEXT_PUBLIC_LEGAL_NAME` | **SIM** | `brand.legalName` → PDP + rodapé | Razão social completa (ex.: `JUDGE TCG LTDA`). Sem isso o gate falha (trim vazio). |
| `NEXT_PUBLIC_CNPJ` | **SIM** | `brand.cnpj` | Só dígitos **ou** mascarado `00.000.000/0000-00`. **14 dígitos** após strip. Deve bater com a Receita. |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | **SIM** | `brand.legalAddress` | Endereço comercial completo: logradouro, nº, bairro, cidade/UF, CEP. Uma linha ok. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Recomendada (já tem default) | Rodapé + mailto | Ex.: `suporte@judgetcg.com.br`. Contato humano verificável. |
| `NEXT_PUBLIC_APP_URL` | Recomendada | Brand / links absolutos | `https://judgetcg.com.br` (sem trailing slash errado). |

### Gate no código (exato)

```ts
brandHasLegalTransparency() ===
  Boolean(cnpj.trim() && legalAddress.trim() && legalName.trim())
```

Se qualquer um dos três faltar → warning amarelo em:

- `data-testid="pdp-purchase-assurance"`
- `data-testid="trust-footer"`

### ENVs de marca (não abrem o gate, mas devem estar coerentes)

| Variável | Default atual | Uso |
|----------|---------------|-----|
| `NEXT_PUBLIC_BRAND_NAME` | Judge TCG | Nome de vitrine |
| `NEXT_PUBLIC_BRAND_SHORT_NAME` | JudgeTCG | Compacto |
| `NEXT_PUBLIC_BRAND_TAGLINE` | (ver `brand.ts`) | SEO / home |
| `NEXT_PUBLIC_BRAND_DESCRIPTION` | (ver `brand.ts`) | Meta |

### Template de fill (produção)

```bash
NEXT_PUBLIC_LEGAL_NAME="RAZÃO SOCIAL COMPLETA LTDA"
NEXT_PUBLIC_CNPJ="00.000.000/0000-00"
NEXT_PUBLIC_LEGAL_ADDRESS="Rua X, 123, Bairro, Cidade - UF, CEP 00000-000"
NEXT_PUBLIC_SUPPORT_EMAIL="suporte@judgetcg.com.br"
NEXT_PUBLIC_APP_URL="https://judgetcg.com.br"
```

### Checklist de deploy (após setar)

- [ ] Rebuild / redeploy (vars `NEXT_PUBLIC_*` entram no bundle na build).
- [ ] Abrir PDP com oferta → **não** aparece “Dados fiscais incompletos…”.
- [ ] Abrir home → `data-testid="trust-footer"` mostra CNPJ + endereço reais (sem “ainda não publicado”).
- [ ] Conferir Receita / contrato social vs textos na tela (humano).
- [ ] Confirmar que **não** há CNPJ fake em preview/staging públicos sem banner de ambiente.

---

## 2. Onde os ENVs já aparecem hoje

| Superfície | Se ENV completo | Se incompleto |
|------------|-----------------|---------------|
| PDP `PdpPurchaseAssurance` | `Operador: {LEGAL_NAME} · CNPJ {CNPJ} · {ENDEREÇO}` | “CNPJ a publicar…” + warning alto valor |
| `TrustFooterStrip` (home/landing) | Nome + CNPJ + endereço + email | Placeholders + warning go-live |

Políticas (HTML, sem ENV): `/politicas/compra`, `/reembolso`, `/cancelamento`, `/marketplace`, `/termos`, `/privacidade`, `/suporte`.

---

## 3. Above-the-fold na PDP **depois** do CNPJ

**Definição ATF (compra):** o que o comprador vê **sem scroll** na coluna de decisão de compra (desktop `lg`: sticky buy column; mobile: primeiro viewport da oferta ao chegar no painel).

Viewport de referência: **desktop 1280×800** e **mobile 390×844**.  
Rota: `/cards/[cardId]` → `CardDetailPage` + `CardBuyPanel`.

### 3.1 Must-have na dobra (P0 — confiança Black Lotus)

Ordem lógica desejada (decisão, não código atual 1:1):

| # | Elemento | Proof | Pass se… |
|---|----------|-------|----------|
| 1 | **Identidade do produto** | `h1` nome da carta + set/# | Nome legível, sem erro 404 visual |
| 2 | **Preço da melhor oferta** | mono grande + moeda BRL | Valor real da listagem, não “Indisponível” em card comprável |
| 3 | **Estoque** | badge “N em estoque” | Quantidade > 0 alinhada à oferta |
| 4 | **Linha legal compacta (pós-CNPJ)** | `LEGAL_NAME` + `CNPJ` | Visível **acima ou imediatamente sob o preço** / topo do buy panel; **sem** warning amarelo |
| 5 | **Loja vendedora** | nome clicável → `/vendedor/[id]` | Distinção clara: plataforma ≠ loja |
| 6 | **Nota da loja** | número + “Nota da loja” + frase de média | Sem estrela decorative / sem “Trust” EN |
| 7 | **Estado da carta** | `ConditionBadge` em PT | NM/LP/… compreensível |
| 8 | **CEP** | `data-testid="pdp-shipping-cep"` | Campo + “Salvar CEP”; copy sem preço inventado |
| 9 | **CTA único** | `data-testid="card-buy-now"` = **Comprar** | Um botão primário; sem duplicar “Adicionar ao carrinho” |
| 10 | **Políticas one-click** | Compra · Reembolso · Cancelamento · Ajuda | Links reais 200 |

### 3.2 Should-have na dobra (P1 — TTC)

| Elemento | Pass se… |
|----------|----------|
| Frase “loja envia / compra protegida quando disponível” | Texto honesto (sem “100% garantido”) |
| Link **Ver avaliações** | `/vendedor/[id]/avaliacoes` |
| Contagem de lojas / unidades | Já no grid Lojas · Disponível |
| Imagem da carta (desktop left / mobile top) | Carrega; zoom disponível |

### 3.3 Explicitamente **fora** da dobra (pode scroll)

- Texto oficial / flavor
- Legalidades de formato
- Tabs Ofertas / histórico / relacionados
- Teasers de comunidade, judge, progresso, XP
- Claims de marketing (“maior”, “0%”, “100% seguro”)

### 3.4 Layout ATF implementado (código)

Ordem atual no `CardBuyPanel`:

1. Preço + estoque  
2. **`PdpLegalAtfLine`** (`data-testid="pdp-legal-atf"`) — `LEGAL_NAME · CNPJ` sob o preço  
3. Lojas / disponível  
4. Bloco vendedor + nota (compactos)  
5. CEP (compacto)  
6. `PdpPurchaseAssurance` — endereço + políticas (sem duplicar CNPJ se gate OK)  
7. **Comprar**

Checklist de aceite visual (pós-redeploy do **Next** com as 3 vars):

- [x] Código ATF no bundle prod (`pdp-legal-atf` em chunk buy panel) — audit 2026-07-15  
- [x] `data-legal-ready="true"` esperado (ENVs inlined + gate trim OK) — audit pós-Vercel  
- [x] Desktop: CNPJ no header do buy panel (sob o preço) via `PdpLegalAtfLine`  
- [x] Mobile: mesma linha no topo do painel  
- [x] Warning “Transparência legal incompleta” / “Dados fiscais…” = **0** (home SSR confirmado)  
- [x] Endereço no assurance / rodapé  
- [x] CNPJ **Receita real** publicado no Vercel  

### Audit live 2026-07-15 (após push ATF)

| Check | Resultado |
|-------|-----------|
| PDP JS contém `pdp-legal-atf` / CEP / assurance | **PASS** |
| Home `trust-footer` com CNPJ real | **FAIL** — SSR: “CNPJ ainda não publicado” |
| `NEXT_PUBLIC_CNPJ` / `LEGAL_ADDRESS` no build Next | **FAIL** (vazios; fallback `\|\|""`) |
| Gate `brandHasLegalTransparency` | **FAIL** |

PDP de teste: `/cards/2a887bdd-2cde-4c17-9a2d-9ac1106cf6ea`  
Próximo: setar as 3 vars no **serviço Next** (não só API) + **rebuild/redeploy** do frontend.

### Audit live 2026-07-15 (pós Vercel CNPJ real)

| Check | Resultado |
|-------|-----------|
| CNPJ em produção | **PASS** — `58.477.778/0001-76` (JUDGE TCG LTDA) |
| `data-legal-ready="true"` | **PASS** (gate `brandHasLegalTransparency`) |
| Warning placeholder/incompleto | **PASS** — 0 em home/PDP |
| ATF sob o preço | **PASS** |
| Checkout/carrinho com rodapé legal | **PASS** (código; redeploy pendente para últimas mudanças) |

---

## 4. Aceite psicológico (re-medir só depois dos ENVs)

| Métrica | Meta | Pré-condição |
|---------|------|--------------|
| TTFB | &lt; 3 s | ENVs legais live + sem warning |
| TTC | &lt; 15 s | CNPJ ATF + CEP + políticas + nota |
| TTP | &lt; 45 s | CTA Comprar claro + path auth ok |
| TES | ≥ 95 | Legal Transparency ≥ 14 + demais dims |
| Black Lotus | “Sim, sem hesitar” | CNPJ + loja densa + frete path crível |

**BP 5.3 Landing Excellence** continua **bloqueado** até esses gates passarem.

---

## 5. Mini runbook (ordem operacional)

1. Juridico / ops fornece razão social + CNPJ + endereço.
2. Setar as **3 vars obrigatórias** (+ email/URL) em produção.
3. Redeploy frontend.
4. Verificar gate (sem warning PDP/footer).
5. Ajustar layout ATF se a linha CNPJ ainda ficar abaixo da dobra no mobile (somente percepção/CSS — sem nova API).
6. Re-score `TRUST_ENGINEERING_SCORE.md` + `PSYCHOLOGICAL_METRICS.md`.
7. Só então discutir unlock 5.3.
