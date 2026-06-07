/** Inicialização opcional do Sentry no browser (NEXT_PUBLIC_SENTRY_DSN). */
export function initClientSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  void import("@sentry/nextjs").then((Sentry) => {
    if (Sentry.getClient()) return;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
    });
  });
}
