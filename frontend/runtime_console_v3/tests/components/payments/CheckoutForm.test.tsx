/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CheckoutForm } from "@/components/payments/CheckoutForm";

const qc = new QueryClient();

describe("CheckoutForm", () => {
  it("mostra inscrição gratuita", () => {
    render(
      <QueryClientProvider client={qc}>
        <CheckoutForm tournamentId="t1" tournamentName="FNM" feeCents={0} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Inscrição gratuita")).toBeTruthy();
  });

  it("mostra total com taxa de serviço", () => {
    render(
      <QueryClientProvider client={qc}>
        <CheckoutForm tournamentId="t1" tournamentName="Open" feeCents={3000} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/Confirmar pagamento/)).toBeTruthy();
    expect(screen.getByText("R$ 31,50")).toBeTruthy();
  });
});
