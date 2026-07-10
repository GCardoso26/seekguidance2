/** Link de salto para conteúdo principal — WCAG 2.4.1 */
export function SkipToMain({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
    >
      Ir para o conteúdo principal
    </a>
  );
}
