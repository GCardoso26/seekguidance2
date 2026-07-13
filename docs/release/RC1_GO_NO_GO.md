# RC1 Go / No-Go

**Data:** 2026-07-13  
**Decisão:** **NO-GO**

## Score RC: **6.2 / 10** (↑ de 5.5)

| Dimensão | Antes | Agora |
|---|---:|---:|
| Health prod | 3 | 8.5 |
| Smoke | 3 | 9 |
| CI remoto | 2 | 2 |
| Lighthouse | 3 | 4 |
| Gates locais | 8.5 | 8.5 |

## Por que NO-GO

1. **B1** — CI/Playwright/Lighthouse CI não executam (billing GitHub).  
2. **B5** — Performance Lighthouse desktop **não atinge ≥95** em nenhuma URL crítica (mín. observado 58, máx. 87).

## O que já desbloqueia parcialmente

- Prod health BFF OK  
- Smoke prod verde  
- Teste Redis estável  

## Recomendação

Não criar `git tag RC1`. Não publicar Release. Não canary.  
Reavaliar após B1 resolvido e decisão explícita sobre meta de Performance (cumprir ≥95 ou waiver assinado para Public Beta).
