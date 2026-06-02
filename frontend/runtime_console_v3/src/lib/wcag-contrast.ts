/**
 * Utilitários WCAG 2.x — luminância e contraste.
 */

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length !== 6) return null;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return channel(r) * 0.2126 + channel(g) * 0.7152 + channel(b) * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return 0;
  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Texto legível sobre fundo sólido (AA body text). */
export function getAccessibleTextColor(bgColor: string): string {
  const bg = parseHexColor(bgColor);
  if (!bg) return "#F1F5F9";
  const lum = relativeLuminance(bg.r, bg.g, bg.b);
  return lum > 0.179 ? "#0F172A" : "#F1F5F9";
}

export function meetsWcagAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 3 : 4.5);
}
