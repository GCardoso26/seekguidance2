/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FriendButton } from "@/components/social/FriendButton";

vi.mock("@/hooks/useFriendship", () => ({
  useFriendship: () => ({
    status: "none",
    sendRequest: { mutate: vi.fn(), isPending: false },
    acceptRequest: { mutate: vi.fn() },
    removeFriend: { mutate: vi.fn() },
  }),
}));

const qc = new QueryClient();

describe("FriendButton", () => {
  it("mostra botão adicionar amigo", () => {
    render(
      <QueryClientProvider client={qc}>
        <FriendButton playerId="p1" />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Adicionar amigo")).toBeTruthy();
  });
});
