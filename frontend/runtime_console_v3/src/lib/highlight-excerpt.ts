function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightExcerptHtml(excerpt: string, terms: string[]): string {
  if (!excerpt || terms.length === 0) return excerpt;

  const sorted = [...new Set(terms.map((t) => t.trim()).filter((t) => t.length >= 3))].sort(
    (a, b) => b.length - a.length,
  );
  if (sorted.length === 0) return excerpt;

  const pattern = sorted.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = excerpt.split(re);

  return parts
    .map((part, i) => {
      if (i % 2 === 1) {
        return `<mark class="judge-source-mark">${part}</mark>`;
      }
      return part
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    })
    .join("");
}
