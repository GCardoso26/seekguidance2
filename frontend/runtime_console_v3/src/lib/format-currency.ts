export function formatCurrency(value: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency === "USD" ? "USD" : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function cardImageUrl(card: { imageUris?: { normal?: string; small?: string; large?: string } }): string {
  return card.imageUris?.normal || card.imageUris?.large || card.imageUris?.small || "/logos/default-tcg.svg";
}
