function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightExcerptHtml(excerpt: string, terms: string[]): string {
  if (!excerpt) return "";
  const safe = escapeHtml(excerpt);
  if (terms.length === 0) return safe;

  const sorted = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length >= 3))].sort(
    (a, b) => b.length - a.length,
  );
  if (sorted.length === 0) return safe;

  const pattern = sorted.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = safe.split(re);

  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        return `<mark class="judge-source-mark">${part}</mark>`;
      }
      return part;
    })
    .join("");
}

/** Permite apenas https/http para links de fontes. */
export function sanitizeSourceUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}
