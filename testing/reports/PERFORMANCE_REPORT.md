# PERFORMANCE_REPORT — AUDIT_PASS_2026-07-29

## Provas HTTP (latência total curl, não Web Vitals)

| URL | HTTP | t (s) |
|---|---|---|
| `/` | 200 | ~0.51 |
| `/lorcana` | 200 | ~0.45 |
| `/lorcana/expansions` | 200 | ~0.32 |
| `/loja` | 200 | ~0.51 |
| `/loja/busca?q=charizard` | 200 | ~0.52 |
| `/loja/busca?q=rapunzel` | 200 | ~0.11 |
| API health | 200 | ~1.0 |
| product-catalog search | 200 | ~1.7 |

## Supabase performance advisors

- 613 lints: 155 WARN (`auth_rls_initplan`×68, `multiple_permissive_policies`×87), 458 INFO (FKs sem índice, etc.)

## Não executado

- Lighthouse / CWV (LCP, CLS, INP)
- Bundle analyzer
- Load 100 / 250 / 500 / 1000
- Profiling React / memory leaks

## Veredito

**Performance prod não certificada.** Shells respondem, mas critérios do prompt (≥95 Lighthouse, load) **não** foram medidos.
