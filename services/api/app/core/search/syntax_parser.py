"""Parser de sintaxe de busca estilo CardTrader (name:, set:, cmc<=3, etc.)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass
class SyntaxFilter:
    field: str
    operator: str
    value: Any


class SearchSyntaxParser:
    VALID_FIELDS = frozenset({
        "name", "set", "color", "colors", "cmc", "type", "types",
        "power", "toughness", "pt", "artist", "oracle", "flavor",
        "rarity", "lang", "language", "foil", "signed", "altered", "graded",
        "collector", "cn", "number",
    })

    OPERATORS = frozenset({":", "=", "!=", "<", ">", "<=", ">="})

    _PATTERN = re.compile(r'([a-zA-Z_]+)\s*([:!><=]+)\s*("[^"]+"|\S+)')

    def parse(self, query: str) -> dict[str, Any]:
        filters: list[SyntaxFilter] = []
        errors: list[str] = []
        text_parts: list[str] = []
        last_end = 0

        for match in self._PATTERN.finditer(query):
            if match.start() > last_end:
                text_parts.append(query[last_end : match.start()].strip())

            field = match.group(1).lower()
            operator = match.group(2)
            raw_value = match.group(3)
            value = raw_value.strip('"')

            if field not in self.VALID_FIELDS:
                errors.append(f"Campo desconhecido: '{field}'")
                last_end = match.end()
                continue

            if operator not in self.OPERATORS:
                errors.append(f"Operador inválido: '{operator}'")
                last_end = match.end()
                continue

            converted = self._convert_value(field, value)
            if converted is None:
                errors.append(f"Valor inválido para '{field}': '{value}'")
                last_end = match.end()
                continue

            filters.append(SyntaxFilter(field=field, operator=operator, value=converted))
            last_end = match.end()

        if last_end < len(query):
            text_parts.append(query[last_end:].strip())

        return {
            "text_query": " ".join(p for p in text_parts if p).strip(),
            "filters": filters,
            "errors": errors,
        }

    def _convert_value(self, field: str, value: str) -> Any:
        numeric_fields = {"cmc", "power", "toughness"}
        boolean_fields = {"foil", "signed", "altered", "graded"}

        if field in numeric_fields:
            try:
                return float(value)
            except ValueError:
                return None

        if field in boolean_fields:
            return value.lower() in ("true", "1", "yes", "sim")

        return value

    def catalog_sql_clauses(self, parsed: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
        """Cláusulas SQL para busca no card_catalog (prefixo cc.)."""
        clauses: list[str] = []
        params: dict[str, Any] = {}
        idx = 0

        for f in parsed["filters"]:
            key = f"sf_{idx}"
            idx += 1

            if f.field == "name":
                clauses.append(f"cc.name ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "set":
                clauses.append(f"LOWER(cc.set_code) LIKE LOWER(:{key})")
                params[key] = f"%{f.value}%"
            elif f.field in ("color", "colors"):
                clauses.append(f"cc.game_data->>'colors' ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "cmc":
                clauses.append(self._numeric_clause(f"NULLIF(cc.game_data->>'cmc', '')::float", f, key))
                params[key] = f.value
            elif f.field in ("type", "types"):
                clauses.append(f"cc.game_data->>'type_line' ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "power":
                clauses.append(self._numeric_clause(f"NULLIF(cc.game_data->>'power', '*')::float", f, key))
                params[key] = f.value
            elif f.field == "toughness":
                clauses.append(self._numeric_clause(f"NULLIF(cc.game_data->>'toughness', '*')::float", f, key))
                params[key] = f.value
            elif f.field == "artist":
                clauses.append(f"cc.game_data->>'artist' ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "oracle":
                clauses.append(f"cc.game_data->>'oracle_text' ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "rarity":
                clauses.append(f"LOWER(cc.rarity) LIKE LOWER(:{key})")
                params[key] = f"%{f.value}%"
            elif f.field in ("lang", "language"):
                clauses.append(f"cc.language = :{key}")
                params[key] = str(f.value).lower()
            elif f.field in ("collector", "cn", "number"):
                clauses.append(f"cc.card_number ILIKE :{key}")
                params[key] = f"%{f.value}%"

        return clauses, params

    def shop_sql_clauses(self, parsed: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
        """Cláusulas SQL para store_products (prefixo p.) com card_listings."""
        clauses: list[str] = []
        params: dict[str, Any] = {}
        idx = 0

        for f in parsed["filters"]:
            key = f"sf_{idx}"
            idx += 1

            if f.field == "name":
                clauses.append(f"p.name ILIKE :{key}")
                params[key] = f"%{f.value}%"
            elif f.field == "foil":
                clauses.append(
                    f"""EXISTS (
                        SELECT 1 FROM tcg_judge.card_listings cl
                        WHERE cl.store_product_id = p.id AND cl.foil = :{key}
                    )"""
                )
                params[key] = bool(f.value)
            elif f.field == "graded":
                if f.value:
                    clauses.append("FALSE")
                else:
                    pass
            elif f.field in ("signed", "altered"):
                pass

        return clauses, params

    def _numeric_clause(self, column_expr: str, filt: SyntaxFilter, key: str) -> str:
        op_map = {
            ":": f"{column_expr} = :{key}",
            "=": f"{column_expr} = :{key}",
            "!=": f"{column_expr} != :{key}",
            "<": f"{column_expr} < :{key}",
            ">": f"{column_expr} > :{key}",
            "<=": f"{column_expr} <= :{key}",
            ">=": f"{column_expr} >= :{key}",
        }
        return op_map.get(filt.operator, f"{column_expr} = :{key}")

    VALID_FIELD_VALUES: dict[str, dict[str, list[str]] | list[str]] = {
        "color": {
            "mtg": ["W", "U", "B", "R", "G", "C", "M", "White", "Blue", "Black", "Red", "Green", "Colorless", "Multicolor"],
            "pokemon": ["Grass", "Fire", "Water", "Lightning", "Psychic", "Fighting", "Darkness", "Metal", "Fairy", "Dragon", "Colorless"],
        },
        "rarity": {
            "mtg": ["common", "uncommon", "rare", "mythic", "special", "bonus", "land"],
            "pokemon": ["Common", "Uncommon", "Rare", "Rare Holo", "Ultra Rare", "Secret Rare", "Promo"],
        },
        "foil": ["true", "false", "yes", "no", "1", "0"],
        "signed": ["true", "false", "yes", "no"],
        "graded": ["true", "false", "yes", "no"],
        "grading_company": ["PSA", "BGS", "CGC", "SGC", "ACE"],
    }

    def validate_syntax_value(self, field: str, value: str, game: str = "mtg") -> tuple[bool, str | None]:
        field_key = field.lower()
        raw = str(value).strip()
        known = self.VALID_FIELD_VALUES.get(field_key)
        if known is None:
            return True, None
        options: list[str]
        if isinstance(known, dict):
            options = known.get(game.lower(), known.get("mtg", []))
        else:
            options = known
        lower_opts = [o.lower() for o in options]
        if raw.lower() in lower_opts:
            return True, None
        prefix = next((options[i] for i, o in enumerate(lower_opts) if o.startswith(raw.lower())), None)
        return False, prefix


syntax_parser = SearchSyntaxParser()
