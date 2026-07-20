import { describe, expect, it } from "vitest";
import { createProjectionWorker } from "../ProjectionWorker.js";
import { AnalyticsProjection, SearchProjection } from "../consumers.js";
import { domainEventFactory } from "../../events/DomainEventFactory.js";

describe("ProjectionWorker", () => {
  it("despacha para consumers que suportam o evento", async () => {
    const search = new SearchProjection();
    const analytics = new AnalyticsProjection();
    const worker = createProjectionWorker([search, analytics]);
    const ev = domainEventFactory.create({
      eventType: "MarketplaceListingPublished.v1",
      aggregateId: "L1",
      aggregateType: "listing",
      payload: { action: "search.reindex" },
    });
    const res = await worker.handle(ev);
    expect(res.projected).toContain("SearchProjection");
    expect(res.projected).toContain("AnalyticsProjection");
    expect(search.seen).toHaveLength(1);
  });
});
