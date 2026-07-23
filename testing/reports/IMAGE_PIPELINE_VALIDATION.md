# IMAGE PIPELINE VALIDATION — V6.4

## Repro (produção pré-fix)

```
GET /_next/image?url=%2Flogos%2Fmtg.webp&w=96&q=70  → 200
GET /_next/image?url=%2Flogos%2Fmtg.webp&w=96&q=60  → 400
GET /_next/image?url=%2Flogos%2Fmtg.webp&w=96&q=78  → 400
GET /logos/mtg.webp                                   → 200
```

## Causa raiz

Next.js 15 exige `quality` ∈ `images.qualities`.  
`ResponsiveImage` usa `quality={60}` (lista) e `78` (hero/priority).  
Allowlist anterior: `[70,75,80,85,90,100]` — **omitia 60 e 78**.

## Correção

```js
qualities: [60, 70, 75, 78, 80, 85, 90, 100]
```

## Pós-deploy checklist

- [ ] Logos MTG/Pokémon/Yu-Gi-Oh/Lorcana via `_next/image` q=60 e q=78 → 200
- [ ] Sem cascata de 400 no Network da página `/loja/busca?game=MTG`
- [ ] E2E `qa-platform-v6-4-functional` → logos assertion PASS

## Fora de escopo

Cloudflare Insights SRI (`beacon.min.js`) — não é pipeline de asset do app.
