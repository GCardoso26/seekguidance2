#!/usr/bin/env python3
"""Lista lojas que precisam regularizar CNPJ / plano (ADR-018 grandfather).

Uso (com DATABASE_URL no ambiente):

  python scripts/ops/list_seller_accreditation_debt.py

Não altera dados — somente relatório.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

SQL = """
SELECT
  id,
  name,
  slug,
  cnpj,
  subscription_plan,
  accreditation_status,
  accreditation_deadline_at,
  created_at
FROM tcg_judge.stores
WHERE
  accreditation_status = 'grandfathered'
  OR accreditation_status IN ('pending', 'submitted', 'under_review')
  OR subscription_plan IN ('free', 'pending_accreditation')
  OR cnpj IS NULL
  OR BTRIM(cnpj) = ''
ORDER BY
  accreditation_deadline_at NULLS LAST,
  created_at ASC;
"""


def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL não definido", file=sys.stderr)
        return 2

    try:
        import psycopg
    except ImportError:
        try:
            import psycopg2 as psycopg  # type: ignore
        except ImportError:
            print("Instale psycopg ou psycopg2", file=sys.stderr)
            return 2

    now = datetime.now(timezone.utc)
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(SQL)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description] if cur.description else []

    print(f"# seller accreditation debt — {now.isoformat()} — {len(rows)} loja(s)")
    print("\t".join(cols))
    for row in rows:
        print("\t".join("" if v is None else str(v) for v in row))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
