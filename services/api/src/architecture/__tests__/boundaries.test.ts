/**
 * Architecture governance tests (ADR-011).
 * Fail build when BCs import forbidden internal modules of other BCs.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = join(__dirname, "../..");

const FORBIDDEN: Array<{ from: RegExp; importPattern: RegExp; reason: string }> = [
  {
    from: /[\\/]marketplace[\\/]/,
    importPattern: /catalog[\\/]persistence|catalog[\\/]domain[\\/].*Repository/,
    reason: "Marketplace must not import Catalog repositories",
  },
  {
    from: /[\\/]pricing[\\/]/,
    importPattern: /inventory[\\/]/,
    reason: "Pricing must not access Inventory",
  },
  {
    from: /[\\/]search[\\/]/,
    importPattern: /marketplace[\\/]persistence/,
    reason: "Search must not write Marketplace persistence",
  },
  {
    from: /[\\/]analytics[\\/]/,
    importPattern: /pricing[\\/]persistence/,
    reason: "Analytics must not query Pricing persistence",
  },
  {
    from: /[\\/]checkout[\\/]/,
    importPattern: /from ["'].*\/(marketplace|inventory|pricing|catalog)\/persistence/,
    reason: "Checkout must not import other BC persistence",
  },
  {
    from: /[\\/]checkout[\\/]/,
    importPattern: /from ["'].*\/(marketplace|inventory|pricing)\/(?!public)/,
    reason: "Checkout must import other BCs only via */public",
  },
  {
    from: /[\\/]order[\\/]/,
    importPattern: /inventory[\\/]persistence/,
    reason: "Orders must not import Inventory persistence",
  },
];

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e === "node_modules" || e === "dist" || e === "__tests__") continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith(".ts") && !p.endsWith(".test.ts")) acc.push(p);
  }
  return acc;
}

function extractImports(source: string): string[] {
  const out: string[] = [];
  const re = /from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) out.push(m[1]!);
  return out;
}

describe("architecture boundaries (ADR-011)", () => {
  const files = walk(SRC);

  it("não viola imports cross-BC proibidos", () => {
    const violations: string[] = [];
    for (const file of files) {
      const rel = relative(SRC, file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      const imports = extractImports(src);
      for (const rule of FORBIDDEN) {
        if (!rule.from.test(file.replace(/\\/g, "/"))) continue;
        for (const imp of imports) {
          if (rule.importPattern.test(imp) || rule.importPattern.test(rel + ":" + imp)) {
            // allow self-references within same BC
            if (imp.includes("..") && rule.importPattern.test(imp)) {
              violations.push(`${rel} imports '${imp}' — ${rule.reason}`);
            }
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("PUBLIC_API_BOUNDARIES.md existe", () => {
    const doc = join(SRC, "../../../docs/architecture/PUBLIC_API_BOUNDARIES.md");
    const content = readFileSync(doc, "utf8");
    expect(content).toContain("Pricing");
    expect(content).toContain("Inventory");
    expect(content).toContain("Marketplace");
    expect(content).toContain("Checkout");
    expect(content).toContain("CheckoutService");
    expect(content).toContain("ListingPublicQuery");
  });
});
