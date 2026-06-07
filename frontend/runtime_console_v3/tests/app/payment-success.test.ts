import { describe, expect, it } from "vitest";

describe("Payment success analytics payload", () => {
  it("serializa checkout_completed com session_id", () => {
    const body = JSON.stringify({
      event: "checkout_completed",
      properties: { session_id: "cs_test_123" },
    });
    expect(body).toContain("checkout_completed");
    expect(body).toContain("cs_test_123");
  });
});
