/** Heurística keyboard-wedge (spike PDV / ADR-002). */
export const PDV_SCAN_MAX_CHAR_MS = 50;
export const PDV_MANUAL_MIN_CHAR_MS = 100;
export const PDV_SCAN_MIN_CHARS = 4;

export type BarcodeInputMode = "scan" | "manual" | "pending";

export function classifyBarcodeInput(keyTimes: number[], code: string): BarcodeInputMode {
  const trimmed = code.trim();
  if (trimmed.length < PDV_SCAN_MIN_CHARS) return "manual";

  if (keyTimes.length < 2) return "manual";

  const deltas: number[] = [];
  for (let i = 1; i < keyTimes.length; i++) deltas.push(keyTimes[i]! - keyTimes[i - 1]!);
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const duration = keyTimes[keyTimes.length - 1]! - keyTimes[0]!;

  const fastBurst = avg < PDV_SCAN_MAX_CHAR_MS;
  const slowTyping = avg > PDV_MANUAL_MIN_CHAR_MS;
  const quickTotal = duration <= 500 + trimmed.length * PDV_SCAN_MAX_CHAR_MS;

  if (fastBurst && quickTotal) return "scan";
  if (slowTyping) return "manual";
  return avg <= PDV_SCAN_MAX_CHAR_MS ? "scan" : "manual";
}
