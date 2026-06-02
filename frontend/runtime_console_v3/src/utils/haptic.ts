/** Feedback tátil (Vibration API) — ignorado se indisponível. */

export type HapticKind = "light" | "medium" | "heavy";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: [30, 50, 30],
};

export function hapticFeedback(type: HapticKind = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[type]);
  } catch {
    /* ignorar */
  }
}
