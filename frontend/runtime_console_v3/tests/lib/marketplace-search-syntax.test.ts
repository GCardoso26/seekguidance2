import { describe, expect, it } from "vitest";
import {
  parseSearchSyntax,
  isKnownValue,
  suggestValue,
  parseActiveSyntaxContext,
} from "@/lib/marketplace-search-syntax";

describe("parseSearchSyntax", () => {
  it("extrai filtros de sintaxe e texto livre", () => {
    const { textQuery, syntaxFilters } = parseSearchSyntax('Dragão set:FDN name:"Sol Ring"');
    expect(textQuery).toBe("Dragão");
    expect(syntaxFilters).toHaveLength(2);
    expect(syntaxFilters[0].field).toBe("set");
    expect(syntaxFilters[1].field).toBe("name");
    expect(syntaxFilters[1].value).toBe("Sol Ring");
  });

  it("parseia cmc com operador", () => {
    const { syntaxFilters } = parseSearchSyntax("cmc<=3");
    expect(syntaxFilters[0]).toMatchObject({ field: "cmc", operator: "<=", value: 3 });
  });
});

describe("isKnownValue", () => {
  it("aceita cor conhecida", () => {
    expect(isKnownValue("color", "W")).toBe(true);
    expect(isKnownValue("color", "white")).toBe(true);
  });

  it("rejeita valor desconhecido em campo com lista fixa", () => {
    expect(isKnownValue("color", "Z")).toBe(false);
    expect(isKnownValue("rarity", "legendary", "mtg")).toBe(false);
    expect(isKnownValue("rarity", "legendary")).toBe(false);
  });

  it("permite qualquer valor em campos sem lista", () => {
    expect(isKnownValue("set", "Qualquer Set")).toBe(true);
  });
});

describe("suggestValue", () => {
  it("sugere correção para typo parcial", () => {
    expect(suggestValue("color", "bl")).toBe("Blue");
    expect(suggestValue("rarity", "myt", "mtg")).toBe("mythic");
  });

  it("retorna null quando não há match", () => {
    expect(suggestValue("color", "zzz")).toBeNull();
  });
});

describe("parseActiveSyntaxContext", () => {
  it("detecta modo valor após dois-pontos", () => {
    const ctx = parseActiveSyntaxContext("set:dom");
    expect(ctx.mode).toBe("value");
    expect(ctx.field).toBe("set");
    expect(ctx.valueQuery).toBe("dom");
  });

  it("detecta modo campo ao digitar prefixo", () => {
    const ctx = parseActiveSyntaxContext("col");
    expect(ctx.mode).toBe("field");
    expect(ctx.field).toBe("col");
  });
});
