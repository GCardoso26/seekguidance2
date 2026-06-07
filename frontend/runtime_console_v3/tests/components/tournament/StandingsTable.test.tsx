/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StandingsTable } from "@/components/tournament/StandingsTable";

describe("StandingsTable", () => {
  it("renderiza standings com tiebreakers", () => {
    render(
      <StandingsTable
        standings={[
          {
            rank: 1,
            displayName: "PlayerOne",
            matchPoints: 9,
            omwPercent: 75,
            gwPercent: 85.7,
            ogwPercent: 72.3,
            status: "active",
          },
        ]}
      />,
    );
    expect(screen.getByText("PlayerOne")).toBeTruthy();
    expect(screen.getByText("75.0")).toBeTruthy();
    expect(screen.getByText("OMW%")).toBeTruthy();
  });
});
