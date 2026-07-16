/** Display helpers — formatting only, no domain rules. */

export function formatPriceCents(cents: number, currency = "BRL"): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

export function setLabel(setCode: string | null, setName: string | null): string {
  if (setName && setCode) return `${setName} (${setCode})`;
  return setName ?? setCode ?? "—";
}
