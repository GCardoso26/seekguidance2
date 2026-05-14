# Estratégia de ingestão

## Princípios

1. **Fonte oficial apenas** — URLs whitelisted por TCG na tabela de configuração (Admin).
2. **Respeito legal** — cache agressivo onde permitido; não redistribuir PDFs sem licença.
3. **Versionamento** — `content_hash` SHA-256 do texto normalizado; diff textual ( Myers / patience ) para release notes internas.
4. **Scheduler** — CronJob K8s ou Celery beat: frequência por jogo (diária / semanal).
5. **Reindexação** — marca `indexed_at` nulo em `documents` alterados; worker regenera apenas chunks afetados.

## Crawlers por TCG (exemplos)

| Jogo | Publisher | Fonte típica |
|------|-----------|--------------|
| MTG | WotC | Magic Docs / artigos oficiais |
| Pokémon | TPCi | Pokémon.com rules |
| Yu-Gi-Oh! | Konami | KDE / DB de regras |
| Lorcana | Ravensburger | Lorcana.com |
| … | … | URLs versionadas |

## Stack técnica

- **Playwright**: páginas dinâmicas / SPAs.
- **BeautifulSoup**: HTML estático leve.
- **Scrapy**: crawling amplo com pipelines de normalização.

## Logs

Cada job grava em `ingestion_jobs`: `status`, `error`, timestamps — visível no Admin.

## Contrato de código

Ver `services/ingestion/src/ingestion/__init__.py` — interface `CrawlerContract` por pacote `tcg_<slug>`.
