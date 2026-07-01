/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSyntaxAutocomplete } from "@/hooks/useSyntaxAutocomplete";

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useSyntaxAutocomplete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.NEXT_PUBLIC_FEATURE_SYNTAX_SEARCH = "true";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("busca valores com field e query na URL", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ values: [{ value: "Dominaria United", count: 10 }] }),
    } as Response);

    const { result } = renderHook(
      () => useSyntaxAutocomplete("set", "mtg", "dom", true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("field=set"),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("q=dom"),
    );
    expect(result.current.data?.[0]?.value).toBe("Dominaria United");
  });

  it("queryKey inclui field, game e query", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ values: [] }),
    } as Response);

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children);

    const { rerender } = renderHook(
      ({ q }) => useSyntaxAutocomplete("color", "mtg", q, true),
      { wrapper, initialProps: { q: "w" } },
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    vi.mocked(fetch).mockClear();
    rerender({ q: "u" });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("q=u"));
  });

  it("enabled=false não dispara fetch", async () => {
    renderHook(() => useSyntaxAutocomplete("set", "mtg", "dom", false), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retorna vazio quando field é null", async () => {
    const { result } = renderHook(() => useSyntaxAutocomplete(null, "mtg", "", true), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});
