# Winner Engine

## PerformanceScore (pesos configuráveis)

```
completionRate + engagementRate + shareRate + saveRate + conversionRate
```

Defaults em `DEFAULT_PERFORMANCE_WEIGHTS` — não hardcoded na lógica de classificação.

## WinnerCriteria

minimumViews, minimumAgeHours (6h/24h/48h/7d via config), minimumCompletionRate, minimumEngagementRate, minimumScore

## Estados

`INSUFFICIENT_DATA` · `TRACKING` · `WINNER` · `NORMAL` · `LOSER`

## ContentDNA

topic, hook, structure, duration, platform, visualStyle, captionStyle, CTA, performance, score

## Evento

`content.winner_detected` com score, metrics, winningFactors, dna

## API

`POST /api/winners/detect`
