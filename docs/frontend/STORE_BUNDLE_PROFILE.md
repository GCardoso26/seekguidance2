# Store Bundle Profile — RC1.1

**Medido:** build `.rc11` + Lighthouse network `/loja`

## First Load

| Métrica | Valor |
|---|---:|
| Shared by all | **341 KB** |
| `/loja` route JS | **~4 KB** |
| `/loja` First Load | **~510 KB** |

## Maiores contribuidores (network Lighthouse — depois WebP)

| Recurso | Transfer | Classificação |
|---|---:|---|
| `ed9f2dc4-…js` (framework) | ~219 KB | Next/React floor |
| Logos WebP | **~1.5–8 KB cada** | Image pipeline OK |
| Antes: `yugioh.svg` via optimizer | **~1.5 MB** | **eliminado** |

## Quem era carregado e por quê

| Pacote / área | No Store path? | Ação RC1.1 |
|---|---|---|
| React / Next | Sim (shared) | Arquitetural |
| CartDrawer | Sim | `dynamic(ssr:false)` |
| UpgradeModal | **Não** (StoreProviders) | Removido do hub |
| cmdk palette | Só se Ctrl+K | já dynamic |
| Charts / Stripe / Seller AI | Não | — |
| `useQuery` GameGrid | **Não** | Removido |

## Evidência do ganho

Antes (LH network): imagens logos **100KB–1.5MB**.  
Depois: logos **≤8 KB**.
