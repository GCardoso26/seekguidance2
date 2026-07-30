# Image Providers de Produtos Selados (TCGs) — Validação e Guia de Implementação

**Data:** 2026-07-25
**Escopo:** validar a existência de *image providers* para **produtos selados** (booster box, booster
unitário, bundle, deck pré-construído, display, ETB, tin, etc.) dos 10 TCGs solicitados e documentar
**como implementar** na plataforma JudgeTCG.

> TL;DR — Existe **um provider universal validado** que entrega imagem de produto selado para **todos os
> 10 TCGs**: **TCGCSV → TCGplayer CDN** (`tcgplayer-cdn.tcgplayer.com`). As APIs oficiais dos fabricantes
> e as APIs de cartas (Scryfall, pokemontcg.io, YGOPRODeck, optcgapi, digimoncard.io…) **servem apenas
> cartas individuais** e **não** fornecem foto de produto selado — por isso os providers de selado atuais
> do repositório emitem `images: []` (ver ADR-016). O TCGCSV resolve exatamente essa lacuna.

---

## 1. Metodologia da validação

Cada afirmação abaixo foi verificada de forma reprodutível em 2026-07-25:

1. **Catálogo TCGCSV** (`https://tcgcsv.com/tcgplayer/categories`): mapeamento das categorias (jogos).
2. **Grupos e produtos** por categoria (`/tcgplayer/{categoryId}/groups` e
   `/tcgplayer/{categoryId}/{groupId}/products`): confirmação de que produtos **selados** possuem
   `imageUrl`.
3. **Imagens** (`HEAD`/`GET` no CDN): confirmação de HTTP 200 e `content-type: image/jpeg` em múltiplas
   resoluções.
4. **Sites oficiais**: verificação de disponibilidade (HTTP) das 10 URLs informadas.

Comandos usados (exemplos):

```bash
curl -s https://tcgcsv.com/tcgplayer/categories
curl -s https://tcgcsv.com/tcgplayer/68/groups            # One Piece
curl -s https://tcgcsv.com/tcgplayer/68/24749/products    # Starter Deck 31 (selados + cartas)
curl -sI https://tcgplayer-cdn.tcgplayer.com/product/704886_in_1000x1000.jpg
```

---

## 2. Resultado — provider universal validado (TCGCSV / TCGplayer)

TCGCSV é um espelho público (JSON/CSV, atualizado diariamente ~20:00 UTC) da API de catálogo do
TCGplayer. Estrutura: **Category → Group (set) → Product**. Um `Product` pode ser **carta**, **booster
box**, **pack**, **bundle**, **deck pré-construído**, **display**, etc., e cada um traz `imageUrl`.

### 2.1 Cobertura por TCG (validada)

| TCG | Site oficial (informado) | TCGplayer `categoryId` | Selado c/ imagem — exemplo validado |
|-----|--------------------------|------------------------|-------------------------------------|
| One Piece (OPTCG) | https://en.onepiece-cardgame.com/ | **68** | `Set Sail Deck Set`, `Starter Deck 31 … Display` |
| Gundam TCG | https://www.gundam-gcg.com/asia-en/ | **86** | `Freedom Ascension Booster Pack` |
| Digimon TCG | https://world.digimoncard.com/ | **63** | `Timeless Bonds Booster Pack` |
| Dragon Ball Fusion World | https://www.dbs-cardgame.com/fw/asia-en/ | **80** | `Reach the God Booster Box` |
| Yu-Gi-Oh! | https://www.yugioh-card.com/en/ | **2** | `Magnificent Monsters Display` |
| Flesh and Blood | https://fabtcg.com/ | **62** | `Usurp the Shadow Throne Booster Pack` |
| Sorcery: Contested Realm | https://sorcerytcg.com/ | **77** | `Prophets of Doom Preconstructed Decks` |
| Pokémon | https://tcg.pokemon.com/pt-br/ | **3** (JP: **85**) | `30th Celebration Pack` (ETB/box/pack) |
| Magic: The Gathering | https://magic.wizards.com/en | **1** | `Star Trek Commander Deck - Federation Fleet` |
| Disney Lorcana | https://www.disneylorcana.com/en-US/ | **71** | `Disney Lorcana: Hyperia City Booster Box` |
| Riftbound | https://riftbound.leagueoflegends.com/ | **89** | `Vendetta - Booster Pack` / Display |

> Observação: também existem `Dragon Ball Super CCG` (27) e `Dragon Ball Z TCG` (23) — para **Fusion
> World** use **80**.

### 2.2 Padrão de URL de imagem (TCGplayer CDN)

A partir do `productId`:

```
https://tcgplayer-cdn.tcgplayer.com/product/{productId}_200w.jpg          # thumb
https://tcgplayer-cdn.tcgplayer.com/product/{productId}_400w.jpg          # médio
https://tcgplayer-cdn.tcgplayer.com/product/{productId}_in_1000x1000.jpg  # alta resolução (recomendado)
```

- Validado: `_200w`, `_400w` e `_in_1000x1000` → **HTTP 200 / image/jpeg**.
- A URL base sem sufixo de tamanho (`/{id}.jpg`) retorna **403** — sempre use um sufixo de tamanho.
- O host **`tcgplayer-cdn.tcgplayer.com` já está no allowlist** de imagens
  (`frontend/runtime_console_v3/next.config.mjs → remotePatterns`).

### 2.3 Cobertura por tipo de produto selado

O `name`/`extendedData` do produto no TCGplayer permite classificar o tipo. Palavras-chave observadas
por tipo (usar para mapear à taxonomia interna):

| Tipo interno (taxonomia) | Palavras-chave no nome TCGplayer |
|--------------------------|----------------------------------|
| `BOOSTER_BOX` / display | `Booster Box`, `Display`, `Case` |
| `BOOSTER_PACK` | `Booster Pack`, `Pack` |
| `BUNDLE` / gift | `Bundle`, `Gift Box`, `Collection` |
| `STARTER_DECK` / `STRUCTURE_DECK` / pré-con | `Starter Deck`, `Structure Deck`, `Preconstructed`, `Commander Deck`, `Deck Set` |
| `ELITE_TRAINER_BOX` (Pokémon) | `Elite Trainer Box`, `ETB` |
| `PRERELEASE_KIT` | `Prerelease` |

---

## 3. Providers por TCG — panorama completo

Classificação: **[SELADO]** = serve imagem de produto selado; **[CARTAS]** = apenas cartas
individuais (não resolve selado).

| TCG | Selado (recomendado) | Cartas (já no repo) | Oficial (fonte secundária) |
|-----|----------------------|---------------------|----------------------------|
| MTG | **TCGCSV cat 1** [SELADO]; Scryfall `/sets` tem *dados* de sealed, **sem imagem** | Scryfall [CARTAS] | magic.wizards.com |
| Pokémon | **TCGCSV cat 3/85** [SELADO] | pokemontcg.io / TCGdex [CARTAS] | tcg.pokemon.com |
| Yu-Gi-Oh! | **TCGCSV cat 2** [SELADO] | YGOPRODeck [CARTAS] | yugioh-card.com |
| One Piece | **TCGCSV cat 68** [SELADO] | optcgapi.com [CARTAS] | en.onepiece-cardgame.com |
| Digimon | **TCGCSV cat 63** [SELADO] | digimoncard.io [CARTAS] | world.digimoncard.com |
| Dragon Ball FW | **TCGCSV cat 80** [SELADO] | apitcg dumps [CARTAS] | dbs-cardgame.com/fw |
| Gundam | **TCGCSV cat 86** [SELADO] | apitcg [CARTAS] | gundam-gcg.com |
| Flesh and Blood | **TCGCSV cat 62** [SELADO] | fab-cube JSON [CARTAS] | fabtcg.com |
| Sorcery | **TCGCSV cat 77** [SELADO]; + manifest de packshots oficial já existente no repo | sorcerytcg CDN [CARTAS] | sorcerytcg.com |
| Lorcana | **TCGCSV cat 71** [SELADO] | lorcana-api / lorcast [CARTAS] | disneylorcana.com |
| Riftbound | **TCGCSV cat 89** [SELADO] | — | riftbound.leagueoflegends.com |

**Conclusão:** para **imagem de selado**, o caminho consistente e multi-jogo é **TCGCSV/TCGplayer**. Os
sites oficiais servem como **fonte secundária/curada** (manifest de packshot ou scraping controlado),
útil para arte oficial de alta qualidade ou quando um produto ainda não está no TCGplayer.

---

## 4. Encaixe na arquitetura atual do repositório

O repo já possui a camada certa para isso: **Product Catalog (TypeScript)** em
`services/api/src/product-catalog/`, separada do catálogo de cartas (Python `app/catalog/`).

Peças relevantes já existentes:

- Interface: `services/api/src/product-catalog/providers/ProductCatalogProvider.ts`
  (+ base `BaseProductCatalogProvider.ts`).
- Registro/execução: `providers/registry.ts` (job key `catalog.sync.sealed`).
- Persistência + ingestão de imagem: `ProductCatalogSyncService.ts` → `AssetMediaPipeline`
  (`src/assets/media/AssetMediaPipeline.ts`) → `media.assets` / `media.asset_links`.
- Taxonomia de subcategoria selada: `src/product-catalog/domain/taxonomy.ts`
  (`BOOSTER_BOX`, `BOOSTER_PACK`, `BUNDLE`, `STARTER_DECK`, `ELITE_TRAINER_BOX`, …).
- Runner: `src/product-catalog/workers/sync-runner.ts catalog.sync.sealed`.
- **Já existe** um cliente TCGCSV em Python
  (`services/api/app/infrastructure/external/providers/tcg_csv_provider.py`, com `SEALED_KEYWORDS` e
  `JUSTTCG_API_KEY`) — hoje usado para Vanguard. Serve de referência de contrato/filtragem.
- `next.config.mjs` já inclui `tcgplayer-cdn.tcgplayer.com` no `remotePatterns`.
- Regra **ADR-016**: nunca usar logo/ícone de set como packshot; PACK não reusa arte de BOX.

---

## 5. Como implementar — passo a passo

### 5.1 Criar um `TcgCsvSealedProvider` (TypeScript) — recomendado

Novo provider genérico que cobre todos os TCGs via TCGCSV. Local sugerido:
`services/api/src/product-catalog/providers/sealed/TcgCsvSealedProvider.ts`.

Responsabilidades:

1. Para cada jogo suportado, ler o `categoryId` do mapa (seção 2.1).
2. `GET https://tcgcsv.com/tcgplayer/{categoryId}/groups` → iterar grupos (sets).
3. `GET https://tcgcsv.com/tcgplayer/{categoryId}/{groupId}/products` → filtrar **apenas selados** por
   palavra-chave (seção 2.3) e descartar cartas individuais.
4. Mapear cada produto selado para `ImportedProductDTO`:
   - `variants[].images = [{ sourceUrl: "https://tcgplayer-cdn.tcgplayer.com/product/{id}_in_1000x1000.jpg", isPrimary: true }]`.
   - `subcategory`/`product_type` a partir das palavras-chave (BOOSTER_BOX, BOOSTER_PACK, BUNDLE,
     STARTER_DECK, ELITE_TRAINER_BOX…).
   - `externalIds`: `{ tcgplayerProductId, tcgplayerGroupId, tcgplayerCategoryId }` (para dedup em
     `product_catalog.provider_mappings`).
5. SKU sugerido: `{GAME}-{SUBCAT}-{setCode|groupId}-{tcgplayerProductId}`.

Esqueleto:

```ts
// services/api/src/product-catalog/providers/sealed/TcgCsvSealedProvider.ts
import { BaseProductCatalogProvider } from "../BaseProductCatalogProvider";
import type { ImportedProductDTO, ProductCatalogSyncContext, ProductCatalogSyncResult } from "../ProductCatalogProvider";

const CATEGORY_BY_GAME: Record<string, number> = {
  MTG: 1, YUGIOH: 2, POKEMON: 3, FAB: 62, DIGIMON: 63,
  ONE_PIECE: 68, LORCANA: 71, SORCERY: 77, DBFW: 80, GUNDAM: 86, RIFTBOUND: 89,
};

const SEALED_KEYWORDS = [
  "booster box", "booster pack", "display", "bundle", "elite trainer",
  "starter deck", "structure deck", "preconstructed", "commander deck",
  "deck set", "gift", "collection", "case", "tin", "blister", "prerelease",
];

const CDN = (id: number) => `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`;

export class TcgCsvSealedProvider extends BaseProductCatalogProvider {
  readonly providerId = "tcgcsv-sealed";
  readonly category = "SEALED_PRODUCT" as const;

  async syncProducts(ctx: ProductCatalogSyncContext): Promise<ProductCatalogSyncResult<ImportedProductDTO>> {
    const out: ImportedProductDTO[] = [];
    const categoryId = CATEGORY_BY_GAME[ctx.gameCode];
    if (!categoryId) return this.emptyResult();

    const groups = await this.getJson(`https://tcgcsv.com/tcgplayer/${categoryId}/groups`);
    for (const g of groups.results ?? []) {
      const prods = await this.getJson(`https://tcgcsv.com/tcgplayer/${categoryId}/${g.groupId}/products`);
      for (const p of prods.results ?? []) {
        const name = String(p.name ?? "").toLowerCase();
        if (!SEALED_KEYWORDS.some((k) => name.includes(k))) continue; // só selados
        if (!p.imageUrl) continue;
        out.push({
          providerRef: String(p.productId),
          gameCode: ctx.gameCode,
          name: p.name,
          category: "SEALED_PRODUCT",
          subcategory: classifySubcategory(name),   // BOOSTER_BOX | BOOSTER_PACK | ...
          externalIds: { tcgplayerProductId: p.productId, tcgplayerGroupId: g.groupId, tcgplayerCategoryId: categoryId },
          variants: [{
            variantRef: String(p.productId),
            images: [{ sourceUrl: CDN(p.productId), isPrimary: true }],
          }],
        });
      }
    }
    return { items: out, /* ...metrics */ };
  }
}
```

> `getJson`/`emptyResult`/`classifySubcategory` seguem o padrão dos providers existentes em
> `providers/sealed/*` e `domain/taxonomy.ts`. Ajuste os nomes de campos do `ImportedProductDTO` conforme
> `ProductCatalogProvider.ts`.

### 5.2 Registrar o provider

Em `services/api/src/product-catalog/providers/registry.ts`:

```ts
reg.register("catalog.sync.sealed", new TcgCsvSealedProvider());
// manter o LigaPublicImageFallbackProvider por último (fallback)
```

Opcional: inserir linha em `product_catalog.provider_registry` (migration
`20260722240000_provider_registry_bootstrap_p0.sql`) para o scheduler.

### 5.3 Allowlist de imagem (frontend)

`tcgplayer-cdn.tcgplayer.com` **já está** em `next.config.mjs → remotePatterns`. Nenhuma mudança
necessária. (Se um dia usar imagens dos sites oficiais, adicionar os hosts correspondentes.)

### 5.4 Orçamento per-game (caps)

O budget é **por jogo**, para o primeiro jogo do mapa (ex. MTG) não consumir o teto global e deixar
Pokémon/YGO/… sem backfill. Defaults em `resolveTcgCsvSealedCaps`:

| Env | Full default | Incremental default | Papel |
|-----|--------------|---------------------|--------|
| `TCGCSV_SEALED_MAX_GROUPS_PER_GAME` | `80` | `15` | grupos (sets) por categoria |
| `TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME` | `500` | `80` | produtos selados por jogo |
| `TCGCSV_SEALED_MAX_PRODUCTS` | `6000` | `600` | teto global de segurança |

Alias legado: `TCGCSV_SEALED_MAX_GROUPS` ainda alimenta `MAX_GROUPS_PER_GAME` se a env per-game não
estiver setada. Groups são ordenados por `publishedOn` DESC (sets recentes primeiro).

### 5.5 Rodar a sincronização

```bash
# requer Postgres/Supabase com o schema product_catalog
cd services/api

# contagem sem write
npx tsx src/product-catalog/workers/sync-runner.ts catalog.sync.sealed --full --dry-run

# ingest real com caps controlados
# PowerShell:
$env:TCGCSV_SEALED_MAX_GROUPS_PER_GAME="80"
$env:TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME="500"
npm run sync:sealed -- --full

# incremental:
npx tsx src/product-catalog/workers/sync-runner.ts catalog.sync.sealed --since 2026-07-01
```

Abortar se disco Supabase / WAL degradar. O `ProductCatalogSyncService` persiste os produtos e dispara
o `AssetMediaPipeline`, que baixa a imagem, calcula SHA-256 e (se `PRODUCT_CATALOG_R2_PUBLIC_BASE`
estiver setado) publica no CDN próprio — evitando hotlink direto ao TCGplayer em produção.

### 5.6 Variáveis de ambiente

| Env | Uso |
|-----|-----|
| `JUSTTCG_API_KEY` | (opcional) header para TCGCSV, se aplicável ao seu tier |
| `TCGCSV_SEALED_MAX_GROUPS_PER_GAME` | grupos por jogo (ver §5.4) |
| `TCGCSV_SEALED_MAX_PRODUCTS_PER_GAME` | produtos selados por jogo |
| `TCGCSV_SEALED_MAX_PRODUCTS` | teto global de segurança |
| `PRODUCT_CATALOG_R2_PUBLIC_BASE` | base do CDN próprio para reidratar as imagens ingeridas |
| `PRODUCT_CATALOG_LIGA_IMAGE_FALLBACK` / `PRODUCT_CATALOG_LIGA_SEED_URLS` | fallback existente (Liga) |

---

## 6. Fonte secundária: sites oficiais (manifest/scraping curado)

Para arte oficial de alta qualidade ou produtos ausentes no TCGplayer, use o **padrão de manifest** já
existente no repo (`sources/<game>/sealed-packshots.manifest.json` + `createPackshotUrlForSku`). Sites
oficiais validados (HTTP em 2026-07-25):

| TCG | URL | Status |
|-----|-----|--------|
| One Piece | https://en.onepiece-cardgame.com/ | 200 |
| Gundam | https://www.gundam-gcg.com/asia-en/ | 200 |
| Digimon | https://world.digimoncard.com/ | 200 |
| Dragon Ball FW | https://www.dbs-cardgame.com/fw/asia-en/ | 200 |
| Yu-Gi-Oh! | https://www.yugioh-card.com/en/ | 200 |
| Flesh and Blood | https://fabtcg.com/ | 403 ao *bot* (Cloudflare); acessível via navegador |
| Sorcery | https://sorcerytcg.com/ | 200 |
| Pokémon | https://tcg.pokemon.com/pt-br/ | 200 |
| Magic | https://magic.wizards.com/en | 200 |
| Lorcana | https://www.disneylorcana.com/en-US/ | 200 |

Prioridade de imagem (ADR-016): **manifest oficial curado > TCGCSV/TCGplayer > fallback**. Nunca usar
logo/ícone de set como packshot.

---

## 7. Riscos e considerações legais

- **TCGplayer/TCGCSV — Termos de Uso:** os dados são públicos, mas o uso comercial das imagens/preços
  deve respeitar os ToS do TCGplayer. Recomenda-se **reingerir as imagens para CDN próprio**
  (`AssetMediaPipeline` + R2) em vez de hotlink permanente, e manter atribuição quando exigido.
- **Sites oficiais:** respeitar `robots.txt`, ToS, rate limits e direitos autorais (o repo já adota isso
  em `README.md`/ingestão). Preferir links/arte oficiais autorizados.
- **Rate limit / cache:** TCGCSV atualiza 1x/dia — cachear os dumps; não é necessário polling frequente.
- **Deduplicação:** usar `externalIds.tcgplayerProductId` em `product_catalog.provider_mappings` para
  evitar duplicatas entre providers (TCGCSV × oficial × Liga).
- **Qualidade:** validar `content-type: image/*` e tamanho mínimo antes de marcar `is_primary`.

---

## 8. Checklist de implementação

- [x] Criar `TcgCsvSealedProvider.ts` (seção 5.1) com o mapa de `categoryId` (inclui **Riftbound 89**).
- [x] Filtrar somente selados (descartar cartas) e mapear subcategoria/`product_type`.
- [x] Emitir `images[].sourceUrl` no padrão `_in_1000x1000.jpg`.
- [x] Orçamento **per-game** (`TCGCSV_SEALED_MAX_*_PER_GAME` + teto global) — §5.4.
- [x] Registrar em `providers/registry.ts` (`catalog.sync.sealed`).
- [ ] (Opcional) linha em `product_catalog.provider_registry`.
- [x] Confirmar `tcgplayer-cdn.tcgplayer.com` no `next.config.mjs` (já presente).
- [x] Rodar `sync-runner` / `sync-tcgcsv-sealed-only` com caps e validar cobertura por `game` (≥10 jogos).
- [ ] Configurar `PRODUCT_CATALOG_R2_PUBLIC_BASE` para reidratar imagens no CDN próprio.
- [ ] Validar no frontend (`CardImage`/`ResponsiveImage`, `mediaType` SEALED_*).
- [ ] (Opcional) manifests oficiais para arte curada de topo (ADR-016).

---

## 9. Referências de código (repo)

- `services/api/src/product-catalog/providers/ProductCatalogProvider.ts` — interface do provider.
- `services/api/src/product-catalog/providers/registry.ts` — registro de providers de selado.
- `services/api/src/product-catalog/providers/sealed/` — providers de selado existentes (referência).
- `services/api/src/product-catalog/domain/taxonomy.ts` — subcategorias de selado.
- `services/api/src/product-catalog/workers/sync-runner.ts` — runner de sync.
- `services/api/src/assets/media/AssetMediaPipeline.ts` — ingestão de imagem → `media.assets`.
- `services/api/app/infrastructure/external/providers/tcg_csv_provider.py` — cliente TCGCSV (Python, ref).
- `frontend/runtime_console_v3/next.config.mjs` — `remotePatterns` (inclui `tcgplayer-cdn.tcgplayer.com`).
- `supabase/migrations/20260720120000_product_catalog_master.sql` e
  `20260720140000_product_catalog_v2_assets.sql` — schema `product_catalog.*` + `product_type`.
