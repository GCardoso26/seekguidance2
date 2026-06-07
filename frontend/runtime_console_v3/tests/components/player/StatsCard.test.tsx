/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "@/components/player/StatsCard";

describe("StatsCard", () => {
  it("exibe valor e label", () => {
    render(<StatsCard icon="🏆" label="Torneios Ganhos" value={12} />);
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Torneios Ganhos")).toBeTruthy();
  });
});
