/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultReporter } from "@/components/tournament/ResultReporter";

describe("ResultReporter", () => {
  it("reporta vitória 2-0", () => {
    const onReport = vi.fn();
    render(<ResultReporter onReport={onReport} />);
    fireEvent.click(screen.getByText("2 - 0"));
    expect(onReport).toHaveBeenCalledWith(2, 0);
  });
});
