import { describe, expect, it } from "vitest";
import { sellerHeaderNotificationsMock } from "@/lib/seller-global-search-mock";

describe("HeaderNotifications", () => {
  it("has urgent chargeback category", () => {
    const data = sellerHeaderNotificationsMock();
    const cb = data.categories.find((c) => c.type === "chargeback");
    expect(cb?.urgent).toBe(true);
  });

  it("each category has action link", () => {
    const data = sellerHeaderNotificationsMock();
    for (const cat of data.categories) {
      expect(cat.action.startsWith("/vendedor/painel")).toBe(true);
    }
  });
});
