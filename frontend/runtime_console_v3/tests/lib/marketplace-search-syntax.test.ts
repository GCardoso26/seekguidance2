import { describe, expect, it } from "vitest";
import { parseSearchSyntax } from "@/lib/marketplace-search-syntax";

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
