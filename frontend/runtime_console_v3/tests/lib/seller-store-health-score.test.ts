import { describe, expect, it } from "vitest";
import { computeStoreHealthScore, statusLabel } from "@/lib/seller-store-health-score";

describe("computeStoreHealthScore", () => {
  it("retorna score alto quando tudo está saudável", () => {
    const result = computeStoreHealthScore({
      kycStatus: "verified",
      sla: {
        picking_overdue: 0,
        packing_overdue: 0,
        shipping_overdue: 0,
        tracking_delayed: 0,
      },
      lowStockCount: 0,
      openTickets: 0,
    });
    expect(result.score).toBe(100);
    expect(result.status).toBe("healthy");
    expect(result.primaryAction).toBeUndefined();
  });

  it("penaliza KYC pendente e estoque baixo", () => {
    const result = computeStoreHealthScore({
      kycStatus: "pending",
      sla: {
        picking_overdue: 2,
        packing_overdue: 0,
        shipping_overdue: 0,
        tracking_delayed: 0,
      },
      lowStockCount: 5,
      openTickets: 4,
    });
    expect(result.score).toBeLessThan(70);
    expect(result.status).not.toBe("healthy");
    expect(result.primaryAction?.href).toBeDefined();
  });

  it("marca crítico com múltiplas falhas", () => {
    const result = computeStoreHealthScore({
      kycStatus: null,
      sla: {
        picking_overdue: 5,
        packing_overdue: 3,
        shipping_overdue: 2,
        tracking_delayed: 1,
      },
      lowStockCount: 10,
      openTickets: 6,
    });
    expect(result.status).toBe("critical");
    expect(result.score).toBeLessThan(40);
  });

  it("expõe quatro fatores ponderados", () => {
    const result = computeStoreHealthScore({ kycStatus: "verified" });
    expect(result.factors).toHaveLength(4);
    expect(result.factors.map((f) => f.id)).toEqual(["kyc", "sla", "stock", "tickets"]);
  });
});

describe("statusLabel", () => {
  it("traduz status para português", () => {
    expect(statusLabel("healthy")).toBe("Saudável");
    expect(statusLabel("attention")).toBe("Atenção");
    expect(statusLabel("critical")).toBe("Crítico");
  });
});
