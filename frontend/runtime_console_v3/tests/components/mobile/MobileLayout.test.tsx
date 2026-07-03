/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/components/gamification/LigaPassWidget", () => ({
  LigaPassWidget: () => null,
}));

vi.mock("@/components/notifications/GlobalNotificationBell", () => ({
  GlobalNotificationBell: () => null,
}));

vi.mock("@/components/cart/CartHeaderButton", () => ({
  CartHeaderButton: () => null,
}));

vi.mock("@/hooks/useCatalogHealth", () => ({
  useCatalogHealth: () => ({ data: null, isLoading: false, isError: false }),
}));

function renderLayout() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MobileLayout>
        <div>Conteúdo</div>
      </MobileLayout>
    </QueryClientProvider>,
  );
}

describe("MobileLayout", () => {
  it("renderiza navegação inferior", () => {
    renderLayout();
    expect(screen.getByText("Conteúdo")).toBeTruthy();
    const mobileNav = screen.getByRole("navigation", { name: "Navegação mobile" });
    expect(within(mobileNav).getByText("Loja")).toBeTruthy();
    expect(within(mobileNav).getByText("Decks")).toBeTruthy();
    expect(within(mobileNav).getByText("Perfil")).toBeTruthy();
  });
});
