import { describe, expect, it } from "vitest";
import {
  categoryToJobKey,
  groupDueProvidersByJobKey,
  SCHEDULER_DENYLISTED_PROVIDER_IDS,
} from "../ProviderScheduler.js";

describe("ProviderScheduler grouping", () => {
  it("maps categories to job keys", () => {
    expect(categoryToJobKey("SEALED_PRODUCT")).toBe("catalog.sync.sealed");
    expect(categoryToJobKey("SLEEVES")).toBe("catalog.sync.sleeves");
    expect(categoryToJobKey("UNKNOWN")).toBeNull();
  });

  it("enqueues one sealed job for many sealed providers", () => {
    const { byJob, denylisted } = groupDueProvidersByJobKey([
      {
        provider_id: "pokemon-tcg-sealed",
        category: "SEALED_PRODUCT",
        schedule_kind: "hourly",
        circuit_open_until: null,
      },
      {
        provider_id: "yugioh-sealed",
        category: "SEALED_PRODUCT",
        schedule_kind: "hourly",
        circuit_open_until: null,
      },
      {
        provider_id: "gamegenic-sleeves",
        category: "SLEEVES",
        schedule_kind: "daily",
        circuit_open_until: null,
      },
      {
        provider_id: "star-wars-sealed",
        category: "SEALED_PRODUCT",
        schedule_kind: "hourly",
        circuit_open_until: null,
      },
    ]);

    expect(byJob.size).toBe(2);
    expect(byJob.get("catalog.sync.sealed")?.map((r) => r.provider_id)).toEqual([
      "pokemon-tcg-sealed",
      "yugioh-sealed",
    ]);
    expect(byJob.get("catalog.sync.sleeves")?.map((r) => r.provider_id)).toEqual([
      "gamegenic-sleeves",
    ]);
    expect(denylisted.map((r) => r.provider_id)).toEqual(["star-wars-sealed"]);
    expect(SCHEDULER_DENYLISTED_PROVIDER_IDS.has("star-wars-sealed")).toBe(true);
  });
});
