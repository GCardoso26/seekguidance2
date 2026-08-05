import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Customer Conversion First — redirects", () => {
  it("next.config redireciona /search para /loja/busca", () => {
    const configPath = path.join(process.cwd(), "next.config.mjs");
    const src = readFileSync(configPath, "utf8");
    expect(src).toMatch(/source:\s*"\/search"/);
    expect(src).toMatch(/destination:\s*"\/loja\/busca"/);
  });
});
