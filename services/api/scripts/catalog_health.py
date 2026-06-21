from __future__ import annotations

import asyncio
import json

from app.catalog.health import verify_ingestion
from app.infrastructure.db.session import get_session_factory


async def main() -> None:
    async with get_session_factory()() as session:
        report = await verify_ingestion(session)
        print(json.dumps(report, default=str, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
