/** CEP do comprador persistido localmente (BP 5.2 — percepção; sem inventar frete). */

export const BUYER_CEP_STORAGE_KEY = "judgetcg_buyer_cep";

export function digitsOnlyCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCepDisplay(digits: string): string {
  const d = digitsOnlyCep(digits);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function readSavedBuyerCep(): string {
  if (typeof window === "undefined") return "";
  try {
    return digitsOnlyCep(localStorage.getItem(BUYER_CEP_STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

export function saveBuyerCep(cepDigits: string): void {
  try {
    localStorage.setItem(BUYER_CEP_STORAGE_KEY, digitsOnlyCep(cepDigits));
  } catch {
    /* ignore */
  }
}
