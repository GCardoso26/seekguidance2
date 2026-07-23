"""Gera SQL para backfill de game_data.ink a partir do dump da API Lorcana."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "tmp_lorcana_ink.json").read_text(encoding="utf-8"))
OUT = ROOT / "tmp_lorcana_ink_updates.sql"


def esc(s: str) -> str:
    return s.replace("'", "''")


def norm_num(raw: str) -> str:
    text = (raw or "").strip()
    return re.sub(r"^0+(?=\d)", "", text) or text


rows: list[tuple[str, str, str, list[str]]] = []
for row in DATA:
    set_code = str(row.get("set") or "").upper().strip()
    num = norm_num(str(row.get("num") or ""))
    if not set_code or not num:
        continue
    rows.append((set_code, num, str(row["ink"]), list(row["colors"])))

parts: list[str] = []
batch_size = 80
for i in range(0, len(rows), batch_size):
    chunk = rows[i : i + batch_size]
    values = ",\n".join(
        f"('{esc(s)}', '{esc(n)}', '{esc(ink)}'::text, '{json.dumps(colors)}'::jsonb)"
        for s, n, ink, colors in chunk
    )
    parts.append(
        f"""
UPDATE tcg_judge.card_catalog c
SET game_data = COALESCE(c.game_data, '{{}}'::jsonb)
  || jsonb_build_object('ink', v.ink, 'colors', v.colors)
FROM (VALUES
{values}
) AS v(set_code, card_number, ink, colors)
WHERE c.game_code = 'LORCANA'
  AND UPPER(c.set_code) = v.set_code
  AND regexp_replace(COALESCE(c.card_number::text, ''), '^0+', '') = v.card_number;
"""
    )

OUT.write_text("\n".join(parts), encoding="utf-8")
print(f"wrote {OUT} with {len(parts)} statements covering {len(rows)} rows")
