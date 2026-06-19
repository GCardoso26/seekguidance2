/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileLayout } from "@/components/layout/MobileLayout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("MobileLayout", () => {
  it("renderiza navegação inferior", () => {
    render(
      <MobileLayout>
        <div>Conteúdo</div>
      </MobileLayout>,
    );
    expect(screen.getByText("Conteúdo")).toBeTruthy();
    expect(screen.getByText("Início")).toBeTruthy();
    expect(screen.getByText("Social")).toBeTruthy();
    expect(screen.getByText("Perfil")).toBeTruthy();
  });
});
