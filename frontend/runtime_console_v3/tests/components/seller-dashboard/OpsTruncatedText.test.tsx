/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpsTruncatedText } from "@/components/seller-dashboard/OpsTruncatedText";
import { opsColumnCellClass, opsColumnVisibilityClass } from "@/lib/ops-table";

describe("ops-table column priority", () => {
  it("maps priority to responsive visibility classes", () => {
    expect(opsColumnVisibilityClass("primary")).toBe("");
    expect(opsColumnVisibilityClass("secondary")).toContain("md:table-cell");
    expect(opsColumnVisibilityClass("tertiary")).toContain("lg:table-cell");
  });

  it("combines min-width with priority", () => {
    const cls = opsColumnCellClass({ priority: "secondary", minWidthClass: "min-w-[12rem]" });
    expect(cls).toContain("min-w-[12rem]");
    expect(cls).toContain("hidden");
  });
});

describe("OpsTruncatedText", () => {
  it("shows Mais/Menos for long text and expands on click", () => {
    const long = "Carta com nome extremamente longo para truncar na tabela operacional do painel";
    render(<OpsTruncatedText text={long} />);
    expect(screen.getByTitle(long)).toBeTruthy();
    const toggle = screen.getByRole("button", { name: /mais/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /menos/i })).toBeTruthy();
  });

  it("renders link when href is provided", () => {
    render(<OpsTruncatedText text="Carta ABC" href="/vendedor/painel/listagens/1" />);
    const link = screen.getByRole("link", { name: "Carta ABC" });
    expect(link.getAttribute("href")).toBe("/vendedor/painel/listagens/1");
  });
});
