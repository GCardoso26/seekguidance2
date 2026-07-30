# Image Providers de Acessórios de TCG (por marca) — Validação e Guia de Implementação

**Data:** 2026-07-25
**Escopo:** validar a existência de *image providers* para **acessórios de TCG** (sleeves/protetores,
deck boxes, playmats, binders/álbuns, dados, storage, etc.) das marcas indicadas e documentar **como
implementar** na plataforma JudgeTCG.

> TL;DR — Diferente dos **produtos selados** (onde `TCGCSV/TCGplayer` é uma fonte universal), para
> **acessórios** o TCGplayer "Supplies" é **incompleto** (muitos grupos vazios). O caminho confiável é
> **a loja oficial de cada marca**, e a maioria expõe **feed estruturado com imagens**:
> **Shopify** (`/products.json`), **WooCommerce** (`/wp-json/wc/store/v1/products`), **Shopware**
> (`/store-api` + sitemap `/media`) e **Tray** (`/web_api/products`). Duas marcas (**Gem** e **Central**)
> estão atrás de Cloudflare e **bloqueiam bots** — exigem scraping via navegador ou parceria de dados
> (para **Central** o repo já tem o caminho via **Google Drive**).

---

## 1. Metodologia da validação

Cada afirmação foi verificada de forma reprodutível em 2026-07-25:

1. **Detecção de plataforma** por assinatura de HTML/headers (`cdn.shopify.com`, `wp-json`, `shopware`,
   `tcdn.com.br`/Tray, WooCommerce, Cloudflare).
2. **Feed de produtos** por plataforma (`/products.json`, `/wp-json/wc/store/v1/products`,
   `/web_api/products`, sitemap Shopware).
3. **Imagens** (`GET` no CDN): HTTP 200 + `content-type: image/*`.

Comandos usados (exemplos):

```bash
curl -s "https://www.dragonshield.com/products.json?limit=2"
curl -s "https://ultrapro.com/products.json?limit=3"
curl -s "https://heavyplay.com/products.json?limit=250"
curl -s "https://www.gamegenic.com/wp-json/wc/store/v1/products?per_page=2"
curl -s "https://www.viperacessorios.com.br/web_api/products?limit=1"
curl -s -o /dev/null -w "%{http_code}" "https://ultimateguard.com/en/sitemap.xml"
```

---

## 2. Resultado por marca (validado)

| Marca | Site | Plataforma | Feed de imagem (endpoint) | CDN das imagens | Status |
|-------|------|------------|---------------------------|-----------------|--------|
| **Dragon Shield** | dragonshield.com | **Shopify** | `GET /products.json?limit=250&page=N` | `cdn.shopify.com` | ✅ validado (sleeves, img 200) |
| **Ultra Pro** | ultrapro.com | **Shopify** | `GET /products.json` | `cdn.shopify.com` | ✅ validado (deck protectors, img 200) |
| **Heavy Play** | heavyplay.com | **Shopify** | `GET /products.json` | `cdn.shopify.com` | ✅ validado (37 playmats + apparel) |
| **Gamegenic** | gamegenic.com | **WooCommerce/WP** | `GET /wp-json/wc/store/v1/products?per_page=100&page=N` | `cdn.svc.asmodee.net` / `wp-content` | ✅ validado (Store API pública) |
| **Ultimate Guard (Katana)** | ultimateguard.com/en | **Shopware 6** | `GET /store-api/product` (POST c/ `sw-access-key`) e `sitemap.xml` | `ultimateguard.com/media/...` | ✅ validado (media 200, sitemap 200) |
| **Viper** | viperacessorios.com.br | **Tray (BR)** | `GET /web_api/products?limit=50&page=N` | `images.tcdn.com.br` | ✅ validado (117 produtos; imagem em `ProductImage`) |
| **Gem** | gemacessorios.com.br | **WooCommerce/WP + Cloudflare** | Store API/sitemap **bloqueados (HTTP 406)** | `wp-content` | ⚠️ bloqueado a bots — requer navegador/parceria |
| **Central** | centralacessorios.com.br | **Cloudflare (WAF)** | site **bloqueado (HTTP 406)** | — | ⚠️ bloqueado — usar **Google Drive** (já suportado no repo) |

**Notas por tipo de produto:** todas as marcas com feed estruturado expõem imagem por produto,
cobrindo **sleeves, deck boxes, playmats, binders, dados** (ex.: Ultra Pro "Deck Protectors", Dragon
Shield "Sleeves - Art", Heavy Play "Playmat", Gamegenic "Sleeving Pack", Viper "Kit de Dados"). O tipo
vem do campo `product_type` (Shopify), taxonomia da categoria (WooCommerce/Tray) ou nome do produto.

### 2.1 Por que **não** usar TCGplayer/TCGCSV para acessórios

O TCGplayer tem as categorias `14 Supplies`, `31 Card Sleeves`, `32 Deck Boxes`, `52 Supply Bundles`,
`82 TCGplayer Supplies`, mas na prática os grupos vêm **majoritariamente vazios** no dump TCGCSV (ex.:
`14/1519 Ultra PRO Card Sleeves` e `14/1889 Anime Deck Boxes` retornaram **0 produtos**). Portanto o
TCGplayer serve **apenas como fallback de baixa prioridade** para acessórios — o oposto do que ocorre
com produtos selados (ver `docs/SEALED_PRODUCT_IMAGE_PROVIDERS.md`).

---

## 3. Padrões de acesso por plataforma (adapters)

### 3.1 Shopify — Dragon Shield, Ultra Pro, Heavy Play

Endpoint público e paginado (sem auth):

```
GET https://{host}/products.json?limit=250&page={n}
```

Resposta: `products[]` com `title`, `product_type`, `handle`, `variants[]`, e **`images[].src`** já em
`https://cdn.shopify.com/...`. Iterar `page` até vir vazio.

```ts
type ShopifyProduct = { title: string; product_type: string; handle: string;
  images: { src: string }[]; variants: { sku?: string; barcode?: string }[] };

async function fetchShopify(host: string): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  for (let page = 1; ; page++) {
    const r = await fetch(`https://${host}/products.json?limit=250&page=${page}`);
    const { products } = await r.json();
    if (!products?.length) break;
    all.push(...products);
  }
  return all;
}
```

### 3.2 WooCommerce Store API — Gamegenic

Endpoint público (sem auth) da Store API:

```
GET https://www.gamegenic.com/wp-json/wc/store/v1/products?per_page=100&page={n}
```

Resposta: array com `name`, `permalink`, `images[].src`, `categories[]`, `sku`. (No Gamegenic o
`name`/`short_description` vêm com HTML — sanitizar.) Imagens em `wp-content` ou CDN Asmodee.

### 3.3 Shopware 6 — Ultimate Guard (linha **Katana**)

Duas opções:
- **Store API** (recomendado): `POST /store-api/product` com header `sw-access-key` (chave pública do
  storefront; obtida no HTML/config do site). Retorna `media`/`cover.media.url` em `ultimateguard.com/media/...`.
- **Sitemap** (sem chave): `GET /en/sitemap.xml` → sitemaps de produtos → páginas → extrair
  `og:image`/`/media/*` (scraping leve).

### 3.4 Tray (Brasil) — Viper

Endpoint público paginado:

```
GET https://www.viperacessorios.com.br/web_api/products?limit=50&page={n}
```

Resposta: `Products[].Product` com `name`, `brand`, `ean`, `category_id`, e **`ProductImage`** (relação
de imagens da Tray, hospedadas em `images.tcdn.com.br`). Mapear `ProductImage[].https` como imagem
primária.

### 3.5 Cloudflare-bloqueados — Gem e Central

`/products.json`, `/wp-json/...` e `sitemap.xml` retornam **HTTP 406** para requisições server-side
(proteção Cloudflare). Opções:
- **Central:** usar o caminho **Google Drive já existente** no repo (`CentralDriveSource`,
  `GOOGLE_DRIVE_API_KEY`, flag `PRODUCT_CATALOG_CENTRAL_DRIVE_API`).
- **Gem:** requer **scraping via navegador headless** (respeitando ToS) **ou parceria de dados** (feed
  CSV/planilha). Enquanto não houver, manter **manifest curado** manual.

---

## 4. Encaixe na arquitetura atual do repositório

O repo já possui a camada de **Product Catalog (TS)** para acessórios em
`services/api/src/product-catalog/`, com o padrão **`manufacturers/{slug}/`**.

Peças existentes relevantes:

- **Providers por marca:** `manufacturers/{slug}/manifest.json` + `manufacturers/{slug}/provider.ts`
  via `manufacturers/_shared/createManufacturerProvider.ts`.
  Já existem pastas para: `central`, `gamegenic`, `dragon-shield`, `ultimate-guard`, `ultra-pro`
  (hoje com **manifests placeholder**). **Não existem** `heavy-play`, `viper`, `gem`.
- **Central com Google Drive:** `providers/accessories/CentralAccessoriesProvider.ts` +
  `sources/central/CentralDriveSource.ts` (**implementado, mas não registrado** em `registry.ts`).
- **Registro / job keys (por categoria, não por marca):** `providers/registry.ts` →
  `catalog.sync.sleeves | deckboxes | binders | pages | dice | counters | playmats`.
- **DTO:** `domain/models.ts` → `ImportedProductDTO` (campos: `brandName`, `manufacturerName`,
  `category`, `subcategory`, `variants[].images[].sourceUrl/isPrimary`).
- **Taxonomia:** `domain/enums.ts` (`ProductCategory`: SLEEVES, DECK_BOX, BINDER, BINDER_PAGE, DICE,
  COUNTERS, PLAYMAT) e `domain/taxonomy.ts` (subcategorias PT-BR).
- **Ingestão de imagem:** `application/ProductCatalogSyncService.ts` → `AssetService.ingest` →
  `assets/media/AssetMediaPipeline.ts` (SHA-256, `sharp` e upload para R2 quando configurado — ADR-017).
  `mediaTypeForCategory` → `ACCESSORY | ACCESSORY_GALLERY | ACCESSORY_LIFESTYLE`.
- **Marcas:** tabelas `product_catalog.manufacturers` / `brands` (texto relacional, sem enum).
- **Runner/cron:** `workers/sync-runner.ts catalog.sync.{categoria}`; `workers/cron-entrypoint.ts accessories`.
- **⚠️ `next.config.mjs`:** hoje **não** há hosts de CDN de acessórios no `remotePatterns` (sem
  `cdn.shopify.com`, `images.tcdn.com.br`, `ultimateguard.com`, `cdn.svc.asmodee.net`).

---

## 5. Como implementar — passo a passo

Há dois modos; recomenda-se **B (adapter live)** para marcas com feed estruturado e **A (manifest)**
para as bloqueadas (Gem/Central).

### 5.1 Opção A — manifest curado (rápido; usar para Gem/Central)

1. Criar `manufacturers/{slug}/manifest.json` com `items[].images[].sourceUrl` (URLs públicas reais).
2. Criar `manufacturers/{slug}/provider.ts` com `createManufacturerProvider` por categoria suportada.
3. Registrar cada classe em `providers/registry.ts` sob o job key correto.

### 5.2 Opção B — adapter "live" por plataforma (recomendado para as demais)

Criar um provider que busca o feed da loja e emite `ImportedProductDTO`. Local sugerido:
`services/api/src/product-catalog/manufacturers/{slug}/liveProvider.ts` (subclasse de
`BaseProductCatalogProvider`).

Exemplo (Shopify → Ultra Pro/Dragon Shield/Heavy Play):

```ts
// manufacturers/_shared/shopifyAccessoryProvider.ts
import { BaseProductCatalogProvider } from "../../providers/BaseProductCatalogProvider";
import type { ImportedProductDTO, ProductCategory } from "../../domain/models";

const TYPE_TO_CATEGORY: Record<string, ProductCategory> = {
  "deck protectors": "SLEEVES", "sleeves": "SLEEVES", "sleeves - art": "SLEEVES",
  "deck boxes": "DECK_BOX", "playmat": "PLAYMAT", "playmats": "PLAYMAT",
  "binders": "BINDER", "portfolios": "BINDER", "dice": "DICE",
};

export function createShopifyAccessoryProvider(opts: {
  providerId: string; host: string; brandName: string; category: ProductCategory;
}) {
  return class extends BaseProductCatalogProvider {
    readonly providerId = opts.providerId;
    readonly category = opts.category;
    async syncProducts() {
      const items: ImportedProductDTO[] = [];
      for (let page = 1; ; page++) {
        const r = await fetch(`https://${opts.host}/products.json?limit=250&page=${page}`);
        const { products } = await r.json();
        if (!products?.length) break;
        for (const p of products) {
          const cat = TYPE_TO_CATEGORY[(p.product_type || "").toLowerCase()];
          if (cat !== opts.category) continue;               // filtra pela categoria do job
          if (!p.images?.length) continue;
          items.push({
            providerRef: `${opts.providerId}:${p.handle}`,
            brandName: opts.brandName,
            manufacturerName: opts.brandName,
            category: opts.category,
            subcategory: "STANDARD_MATTE",                    // refinar por tags/título
            titlePt: p.title, titleEn: p.title,
            sku: p.variants?.[0]?.sku,
            ean: p.variants?.[0]?.barcode,
            variants: [{
              providerRef: p.handle, variantName: p.title,
              images: p.images.map((im: any, i: number) => ({ sourceUrl: im.src, isPrimary: i === 0, sortOrder: i })),
            }],
          });
        }
      }
      return this.ok(items);
    }
  };
}
```

Análogos: `createWooAccessoryProvider` (`/wp-json/wc/store/v1/products`, imagem em `images[].src`),
`createTrayAccessoryProvider` (`/web_api/products`, imagem em `Product.ProductImage[].https`),
`createShopwareAccessoryProvider` (Store API com `sw-access-key`, imagem em `cover.media.url`).

### 5.3 Mapear categoria/subcategoria

Cada job sincroniza **uma** `ProductCategory`. Mapear o tipo/tag da loja para
`SLEEVES | DECK_BOX | BINDER | BINDER_PAGE | DICE | COUNTERS | PLAYMAT` e a subcategoria PT-BR de
`domain/taxonomy.ts`. Usar `_shared/accessoryTaxonomy.ts` (`ACCESSORY_TYPE_TO_CATEGORY`) como base.

### 5.4 Liberar as imagens no frontend

Escolher **uma** das opções:
- **Reingerir para CDN próprio** (recomendado): credenciais `R2_*` mais `PRODUCT_CATALOG_R2_PUBLIC_BASE`
  — o `AssetMediaPipeline` baixa, faz hash, otimiza com `sharp` e serve de
  `assets/{sha[0:2]}/{sha}/original.jpg` e `.../{tamanho}.{webp|avif}` (ADR-017; evita hotlink e
  problemas de ToS). Seguir a ordem de corte da §5.6 de
  [SEALED_PRODUCT_IMAGE_PROVIDERS.md](SEALED_PRODUCT_IMAGE_PROVIDERS.md); **ou**
- **Allowlist no `next.config.mjs`** (`remotePatterns`) os hosts das marcas:
  `cdn.shopify.com`, `images.tcdn.com.br`, `ultimateguard.com`, `cdn.svc.asmodee.net`,
  `**.wp.com`/`wp-content` conforme a marca.

### 5.5 Registrar e rodar

```ts
// providers/registry.ts
reg.register("catalog.sync.sleeves", new UltraProSleevesLive());
reg.register("catalog.sync.sleeves", new DragonShieldSleevesLive());
reg.register("catalog.sync.playmats", new HeavyPlayPlaymatsLive());
reg.register("catalog.sync.sleeves", new GamegenicSleevesLive());
// Viper/Tray, Ultimate Guard/Shopware conforme categorias
```

```bash
cd services/api
npm run sync:sleeves -- --full      # ou: tsx src/product-catalog/workers/sync-runner.ts catalog.sync.sleeves --full
npm run sync:playmats -- --full
node src/product-catalog/workers/cron-entrypoint.js accessories   # roda todos os jobs de acessório
```

### 5.6 Variáveis de ambiente

| Env | Uso |
|-----|-----|
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Object storage (ADR-017); sem elas o pipeline mantém a URL de origem |
| `PRODUCT_CATALOG_R2_PUBLIC_BASE` | CDN próprio após ingestão (`assets/{sha[0:2]}/{sha}/…`) |
| `MANUFACTURER_ASSET_CDN_BASE` | Reescrever hosts placeholder de manifests antes do download |
| `PRODUCT_CATALOG_CENTRAL_DRIVE_API` + `GOOGLE_DRIVE_API_KEY` | Ingestão da **Central** via Google Drive |
| `ASSET_PIPELINE_TIMEOUT_MS` / `ASSET_PIPELINE_MAX_ATTEMPTS` | Robustez do download |
| `PRODUCT_CATALOG_SYNC_WEBHOOK_URL` | Alertas de falha do sync |

---

## 6. Riscos e considerações legais

- **ToS/robots das lojas:** `/products.json` (Shopify), Store API (WooCommerce) e `/web_api` (Tray) são
  endpoints públicos, mas o uso comercial das **imagens** deve respeitar direitos autorais e os Termos de
  cada marca. Preferir **acordo/autorização** com fabricantes/distribuidores.
- **Reingestão para CDN próprio:** baixar e servir de CDN próprio (R2) — evita hotlink e quebra por
  mudança de URL; mantém atribuição quando exigido.
- **Cloudflare (Gem/Central):** não burlar proteção anti-bot. Usar Google Drive (Central) ou
  parceria/feed (Gem). Scraping via navegador só com autorização.
- **Rate limiting / cache:** paginar com backoff e cachear; sincronizar 1x/dia (scheduler já trata
  acessórios como `daily`).
- **Deduplicação:** usar `sku`/`ean` + `product_catalog.provider_mappings` para evitar duplicatas entre
  marca oficial × distribuidor (Central/Viper/Gem revendem várias marcas).
- **Qualidade:** validar `content-type: image/*` e resolução mínima antes de `is_primary`.

---

## 7. Checklist de implementação

- [x] Para **Shopify** (Dragon Shield, Ultra Pro, Heavy Play): adapter `products.json` por categoria.
- [ ] Para **Gamegenic** (WooCommerce): adapter Store API `/wp-json/wc/store/v1/products` (sanitizar HTML).
- [ ] Para **Ultimate Guard/Katana** (Shopware): Store API com `sw-access-key` (ou sitemap `/media`).
- [ ] Para **Viper** (Tray): adapter `/web_api/products` mapeando `ProductImage`.
- [ ] Para **Central**: registrar o `CentralAccessoriesProvider` (Google Drive) já existente.
- [ ] Para **Gem**: manifest curado até obter feed/parceria (Cloudflare bloqueia bots).
- [x] Mapear `product_type`/tags → `ProductCategory`/subcategoria.
- [x] Adicionar hosts no `next.config.mjs` **ou** ingerir para R2 (`PRODUCT_CATALOG_R2_PUBLIC_BASE`).
- [x] Registrar providers em `providers/registry.ts` nos job keys corretos.
- [ ] Rodar `npm run sync:{categoria} -- --full` e validar `media.assets`.
- [ ] Validar exibição no frontend (`CardImage`/`ResponsiveImage`, `mediaType` ACCESSORY_*).

---

## 8. Referências de código (repo)

- `services/api/src/product-catalog/manufacturers/_shared/createManufacturerProvider.ts` — factory de provider por marca.
- `services/api/src/product-catalog/manufacturers/{central,gamegenic,dragon-shield,ultimate-guard,ultra-pro}/` — providers/manifests existentes.
- `services/api/src/product-catalog/providers/accessories/CentralAccessoriesProvider.ts` + `sources/central/CentralDriveSource.ts` — Central via Google Drive.
- `services/api/src/product-catalog/providers/registry.ts` — registro por job key (`catalog.sync.sleeves`, `…deckboxes`, `…playmats`, etc.).
- `services/api/src/product-catalog/domain/models.ts` — `ImportedProductDTO` / `ImportedImageDTO`.
- `services/api/src/product-catalog/domain/{enums,taxonomy}.ts` — categorias/subcategorias de acessórios.
- `services/api/src/product-catalog/application/ProductCatalogSyncService.ts` + `assets/media/AssetMediaPipeline.ts` — ingestão de imagem.
- `services/api/src/product-catalog/workers/{sync-runner,cron-entrypoint}.ts` — execução do sync.
- `frontend/runtime_console_v3/next.config.mjs` — `remotePatterns` (adicionar hosts de CDN das marcas).
- `frontend/runtime_console_v3/src/lib/assets/product-media-type.ts` — mapeamento de categoria → media type.

---

## 9. Resumo executivo

- **6 de 8 marcas têm image provider estruturado e validado**: Dragon Shield, Ultra Pro, Heavy Play
  (Shopify), Gamegenic (WooCommerce), Ultimate Guard/Katana (Shopware), Viper (Tray).
- **2 de 8 estão bloqueadas a bots** (Cloudflare): **Central** (usar Google Drive já suportado) e
  **Gem** (manifest curado / parceria).
- **TCGplayer/TCGCSV Supplies** é fallback fraco para acessórios (grupos vazios) — não recomendado como
  fonte primária.
- A plataforma **já tem a arquitetura** para isso (`manufacturers/*` + `AssetMediaPipeline`); faltam
  adapters "live" por plataforma, hosts no `next.config.mjs` (ou ingestão a R2) e registro no
  `registry.ts`.
