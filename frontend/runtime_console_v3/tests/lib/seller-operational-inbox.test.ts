import { describe, expect, it } from "vitest";
import { buildOperationalInboxItems, filterInboxByCategory } from "@/lib/seller-operational-inbox";

describe("seller-operational-inbox", () => {
  it("agrega categorias do header e ações operacionais", () => {
    const items = buildOperationalInboxItems(
      [
        {
          type: "new_orders",
          label: "5 novos pedidos",
          count: 5,
          action: "/vendedor/painel/pedidos",
        },
      ],
      [
        {
          id: "to_separate",
          title: "Aguardando envio",
          description: "Pedidos pagos",
          count: 3,
          severity: "critical",
          href: "/vendedor/painel/pedidos",
          cta: "Enviar",
        },
      ],
    );
    expect(items.length).toBe(2);
    expect(items[0].urgent).toBe(true);
  });

  it("filtra por categoria", () => {
    const items = buildOperationalInboxItems(
      [{ type: "tickets", label: "2 tickets", count: 2, action: "/tickets" }],
      [],
    );
    const tickets = filterInboxByCategory(items, "tickets");
    expect(tickets).toHaveLength(1);
  });
});
