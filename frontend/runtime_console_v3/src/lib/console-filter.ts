const SUPPRESSED_PATTERNS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT",
  "The resource at",
  "was blocked",
  "[PWA] SW registration failed",
  "analytics.google.com",
];

function shouldSuppress(message: string): boolean {
  return SUPPRESSED_PATTERNS.some((pattern) => message.includes(pattern));
}

let installed = false;

/** Filtra erros conhecidos de terceiros/PWA que poluem o Lighthouse CI. */
export function installConsoleFilter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = args.map((arg) => String(arg)).join(" ");
    if (shouldSuppress(message)) return;
    originalError.apply(console, args);
  };
}
