/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverlayConfig } from "@/components/streaming/OverlayConfig";

describe("OverlayConfig", () => {
  it("lista overlays OBS", () => {
    render(<OverlayConfig tournamentId="t-123" />);
    expect(screen.getByText("URLs para OBS")).toBeTruthy();
    expect(screen.getByText("Standings")).toBeTruthy();
    expect(screen.getByText("Timer")).toBeTruthy();
  });
});
