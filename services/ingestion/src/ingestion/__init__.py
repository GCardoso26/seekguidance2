"""Workers de ingestão (Playwright / BeautifulSoup / Scrapy) por TCG.

Cada jogo implementa `CrawlerContract` com:
- `discover()` → URLs oficiais monitoradas
- `fetch()` → HTML/PDF bruto
- `normalize()` → texto estruturado + metadados
- `hash()` → content_hash para diff/versionamento

O scheduler (Celery ou Arq + Redis) dispara jobs em `ingestion_jobs`.
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class CrawlerContract(Protocol):
    key: str

    async def discover(self) -> list[str]: ...

    async def fetch(self, url: str) -> bytes: ...
