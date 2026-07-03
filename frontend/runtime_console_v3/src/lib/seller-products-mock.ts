export function sellerProductsMock() {
  return {
    products: [
      {
        id: "prod-1",
        name: "Sleeve Ultra Pro Matte",
        category: "sleeve",
        price_cents: 2500,
        stock: 40,
        sku: "UP-SLV-001",
        is_active: true,
      },
      {
        id: "prod-2",
        name: "Deck Box Ultimate Guard",
        category: "deck_box",
        price_cents: 8900,
        stock: 12,
        sku: "UG-DB-100",
        is_active: true,
      },
    ],
    total: 2,
    page: 1,
    limit: 25,
  };
}
