# Staging Validation — RC1 Blocker Resolution

**Modo:** processo + probes públicos — **sem** novo deploy de staging dedicado nesta fase.

## Probes produção (proxy de readiness)

| Check | Resultado |
|---|---|
| FE features wishlist_v2 / shipping_v2 | true / true (`/api/health`) |
| BE features.shipping_v2 | **false** (`/v1/health`) |
| Inventory UI `/vendedor/painel/estoque` | reachable (smoke + LH) |
| Checkout pages | smoke OK |

## Flags

| Flag | Estado | Ação |
|---|---|---|
| WISHLIST_V2 (FE) | on | OK |
| SHIPPING_V2 (FE) | on | OK |
| SHIPPING_V2_ENABLED (BE) | **off** | Ativar só após plantão canary (B6) |

## Conclusão staging

Runbook válido (`STAGING_RUNBOOK.md`). Execução completa de staging ambiente isolado **ainda pendente** (B4). Não bloqueia sozinho se B1/B5 forem os únicos P0 — mas permanece P1.
