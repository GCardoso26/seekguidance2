/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobilePairingCard } from "@/components/tournament/MobilePairingCard";

describe("MobilePairingCard", () => {
  it("renderiza emparelhamento mobile", () => {
    const onReport = vi.fn();
    render(
      <MobilePairingCard
        tableNumber={5}
        player1={{ name: "Alice", points: 9 }}
        player2={{ name: "Bob", points: 6 }}
        timerRemaining="12:00"
        onReport={onReport}
      />,
    );
    expect(screen.getByText("Mesa 5")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    fireEvent.click(screen.getByText("Reportar resultado"));
    expect(onReport).toHaveBeenCalled();
  });
});
