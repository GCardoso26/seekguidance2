/** Renderização markdown leve (sem dependência externa). */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderSimpleMarkdown(source: string): string {
  let html = escapeHtml(source);
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-luxury-gold underline" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul class="list-disc pl-5">${block}</ul>`);
  html = html.replace(/\n/g, "<br />");
  return html;
}

export function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
): { next: string; cursor: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const cursor = selectionStart + before.length + selected.length + after.length;
  return { next, cursor };
}
