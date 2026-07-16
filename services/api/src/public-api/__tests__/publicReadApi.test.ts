import { describe, expect, it } from "vitest";
import { createDomainEvent } from "../../shared/events/types.js";
import { InMemoryConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { SearchEventConsumer } from "../../search/consumer/SearchEventConsumer.js";
import { InMemorySearchProjectionRepository } from "../../search/persistence/InMemorySearchProjectionRepository.js";
import { ProjectionSearchQueryService } from "../../search/application/ProjectionSearchQueryService.js";
import { createPublicReadServer } from "../http/createPublicReadServer.js";

async function seed() {
  const projection = new InMemorySearchProjectionRepository();
  const consumer = new SearchEventConsumer(projection, new InMemoryConsumerOffsetRepository());
  await consumer.handle(
    createDomainEvent(
      "CardUpdated",
      "card-1",
      {
        name: "Lightning Bolt",
        normalizedName: "lightning bolt",
        oracleText: "Bolt deals 3 damage.",
        setCode: "LEA",
        setName: "Limited Edition Alpha",
        language: "en",
        rarity: "common",
      },
      { id: "pub-1", aggregateType: "catalog_card" },
    ),
  );
  await consumer.handle(
    createDomainEvent(
      "VariantUpdated",
      "v1",
      { cardId: "card-1", finish: "nonfoil" },
      { id: "pub-2", aggregateType: "catalog_variant" },
    ),
  );
  return {
    projection,
    queries: new ProjectionSearchQueryService(projection),
  };
}

async function getJson(
  port: number,
  path: string,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body, headers: res.headers };
}

describe("Sprint 3.5 — Public Read API", () => {
  it("serves /api/v1 read endpoints via SearchQueryService only", async () => {
    const { projection, queries } = await seed();
    const server = createPublicReadServer({ queries, projection, port: 0 });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;

    try {
      const search = await getJson(port, "/api/v1/search?q=Lightning");
      expect(search.status).toBe(200);
      expect((search.body as { hits: unknown[] }).hits.length).toBeGreaterThan(0);
      expect(search.headers.get("etag")).toBeTruthy();
      expect(search.headers.get("cache-control")).toContain("max-age");

      const card = await getJson(port, "/api/v1/cards/card-1");
      expect(card.status).toBe(200);
      expect((card.body as { name: string }).name).toBe("Lightning Bolt");
      expect((card.body as { oracleText: string }).oracleText).toContain("damage");

      const set = await getJson(port, "/api/v1/sets/LEA");
      expect(set.status).toBe(200);
      expect((set.body as { code: string }).code).toBe("LEA");

      const variants = await getJson(port, "/api/v1/variants?cardId=card-1");
      expect(variants.status).toBe(200);
      expect((variants.body as { items: unknown[] }).items.length).toBeGreaterThan(0);

      const variant = await getJson(port, "/api/v1/variants/card-1%3Anonfoil");
      expect(variant.status).toBe(200);

      const suggest = await getJson(port, "/api/v1/suggest?q=Light");
      expect(suggest.status).toBe(200);

      const post = await fetch(`http://127.0.0.1:${port}/api/v1/search`, { method: "POST" });
      expect(post.status).toBe(405);

      // ETag 304
      const etag = search.headers.get("etag")!;
      const again = await getJson(port, "/api/v1/search?q=Lightning", {
        "if-none-match": etag,
      });
      expect(again.status).toBe(304);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
