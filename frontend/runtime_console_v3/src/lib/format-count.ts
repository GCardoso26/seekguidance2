/** Format integer counts with fixed thousands separators (no ICU) to avoid SSR/client hydration mismatches. */
export function formatCountStable(value: number): string {
  const n = Math.trunc(Number.isFinite(value) ? value : 0);
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.abs(n));
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped}`;
}
