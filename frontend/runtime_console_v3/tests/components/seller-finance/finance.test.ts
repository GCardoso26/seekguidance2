import { describe, expect, it } from "vitest";
import {
  sellerFinanceChargebacksMock,
  sellerFinancePayoutsMock,
  sellerFinancePixMock,
  sellerFinanceReconciliationMock,
  sellerFinanceStripeMock,
} from "@/lib/seller-finance-mock";

describe("finance mocks", () => {
  it("payouts mock has pending and completed", () => {
    const data = sellerFinancePayoutsMock();
    expect(data.pending_cents).toBeGreaterThan(0);
    expect(data.completed_count).toBeGreaterThan(0);
  });

  it("stripe mock has account id", () => {
    expect(sellerFinanceStripeMock().account_id).toBeTruthy();
  });

  it("pix mock has configured key", () => {
    expect(sellerFinancePixMock().pix_key_configured).toBe(true);
  });

  it("reconciliation mock has issues", () => {
    const data = sellerFinanceReconciliationMock();
    expect(data.issues_count).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);
  });

  it("chargebacks mock has open count", () => {
    expect(sellerFinanceChargebacksMock().open_count).toBeGreaterThan(0);
  });
});
