/** Inicialização opcional do Sentry no browser (NEXT_PUBLIC_SENTRY_DSN). */
export function initClientSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === "undefined") return;

  void import("@sentry/nextjs").then((Sentry) => {
    if (Sentry.getClient()) return;
    const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
      tracesSampleRate: isProd ? 0.1 : 1.0,
      profilesSampleRate: isProd ? 0.05 : 1.0,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
          maskAllInputs: true,
        }),
      ],
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.Cookie;
          delete event.request.headers.cookie;
        }

        const first = event.exception?.values?.[0];
        if (first?.type === "TypeError" && first.value) {
          event.fingerprint = ["type-error", first.value];
        }

        return event;
      },
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error exception captured",
        "Non-Error promise rejection captured",
        "Network Error",
        "Failed to fetch",
        "AbortError",
        "undefined is not an object",
      ],
      denyUrls: [/extensions\//i, /^chrome:\/\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i],
    });
  });
}
