/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewCard } from "@/components/reviews/ReviewCard";

describe("ReviewCard", () => {
  it("mostra estrelas e comentário", () => {
    render(<ReviewCard reviewerName="PlayerOne" rating={5} comment="Organização impecável!" />);
    expect(screen.getByText("PlayerOne")).toBeTruthy();
    expect(screen.getByText("Organização impecável!")).toBeTruthy();
    expect(screen.getByText("★★★★★")).toBeTruthy();
  });
});
