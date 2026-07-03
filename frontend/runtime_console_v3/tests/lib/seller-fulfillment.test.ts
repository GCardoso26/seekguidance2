import { describe, expect, it } from "vitest";
import {
  FULFILLMENT_STEPS,
  fulfillmentStepIndex,
  nextFulfillmentCommand,
} from "@/types/seller-fulfillment";

describe("seller-fulfillment", () => {
  it("maps status to next command along happy path", () => {
    expect(nextFulfillmentCommand("Pending")).toBe("start_picking");
    expect(nextFulfillmentCommand("Picking")).toBe("complete_picking");
    expect(nextFulfillmentCommand("ReadyToShip")).toBe("confirm_ship");
    expect(nextFulfillmentCommand("Delivered")).toBe("complete");
    expect(nextFulfillmentCommand("Completed")).toBeNull();
  });

  it("computes step index for InTransit", () => {
    const inTransitIdx = FULFILLMENT_STEPS.findIndex((s) => s.status === "InTransit");
    expect(fulfillmentStepIndex("InTransit")).toBe(inTransitIdx);
  });
});
