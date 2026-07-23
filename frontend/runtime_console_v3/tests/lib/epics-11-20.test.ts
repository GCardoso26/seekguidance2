import { describe, expect, it } from "vitest";
import {
  editorialDeepLinks,
  EDITORIAL_SEED,
  EDITORIAL_TYPES,
} from "@/lib/editorial/catalog";
import {
  groupForNotification,
  priorityForNotification,
  groupNotifications,
  actionForNotification,
} from "@/lib/notifications/center";
import { levelForXp, ACHIEVEMENT_CATALOG, XP_LEVELS } from "@/lib/profile-achievements";
import {
  stubCollectionAssistant,
  stubDeckAssistant,
  stubCheckoutAssistant,
} from "@/lib/ai-assistants/interfaces";
import { ECOSYSTEM_SURFACES, ECOSYSTEM_CAPABILITIES } from "@/lib/ecosystem/surfaces";
import { cacheKey, PERFORMANCE_PRESETS } from "@/lib/performance/presets";
import type { AppNotification } from "@/types/post";

describe("Epic 15 Editorial", () => {
  it("exposes content types and contextual deep links", () => {
    expect(EDITORIAL_TYPES.length).toBeGreaterThanOrEqual(8);
    const links = editorialDeepLinks(EDITORIAL_SEED[0]);
    expect(links.some((l) => l.href.startsWith("/"))).toBe(true);
  });
});

describe("Epic 12 Notification Center", () => {
  it("groups, prioritizes and attaches actions", () => {
    const n = {
      id: "1",
      type: "price_alert",
      title: "Preço caiu",
      body: "",
      readAt: null,
      createdAt: new Date().toISOString(),
    } as unknown as AppNotification;
    expect(groupForNotification(n)).toBe("price");
    expect(priorityForNotification(n)).toBe("high");
    expect(actionForNotification(n)?.href).toBeTruthy();
    const groups = groupNotifications([n]);
    expect(groups[0].unread).toBe(1);
  });
});

describe("Epic 18 Gamification V2", () => {
  it("includes rare badges and XP levels", () => {
    expect(ACHIEVEMENT_CATALOG.some((a) => a.id === "marketplace-legend")).toBe(true);
    expect(XP_LEVELS.length).toBeGreaterThanOrEqual(5);
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(400).level).toBe(3);
    expect(levelForXp(2000).level).toBe(5);
  });
});

describe("Epic 19 AI Assistants", () => {
  it("returns contextual suggestions without chatbot surface", async () => {
    const col = await stubCollectionAssistant.completeSetBudget({});
    expect(col[0].surface).toBe("collection");
    const deck = await stubDeckAssistant.substituteForSavings({ deckId: "d1" });
    expect(deck[0].href).toContain("/decks/d1");
    const chk = await stubCheckoutAssistant.multiStoreFreight({});
    expect(chk[0].message).toMatch(/frete/i);
  });
});

describe("Epic 20 Ecosystem", () => {
  it("reserves capability surfaces without partner coupling", () => {
    expect(ECOSYSTEM_CAPABILITIES).toContain("public_api");
    expect(ECOSYSTEM_SURFACES.every((s) => s.title && s.notes)).toBe(true);
  });
});

describe("Epic 17 Performance presets", () => {
  it("scopes cache keys and presets", () => {
    expect(cacheKey("portal", "mtg")).toContain("portal:mtg");
    expect(PERFORMANCE_PRESETS.listOverscan).toBeGreaterThan(0);
  });
});
