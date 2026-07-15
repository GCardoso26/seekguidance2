"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const HYDRATION_RE = /#418\b|#425\b|Minified React error #(418|425)|did not match|Hydration failed/i;

/**
 * Observa erros de hidratação no client e reporta via analytics (sem alterar UX).
 */
export function HydrationMismatchWatcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let reported = false;
    const report = (message: string) => {
      if (reported || !HYDRATION_RE.test(message)) return;
      reported = true;
      void trackEvent("page_view", {
        hydration_mismatch: true,
        hydration_message: message.slice(0, 240),
        path: window.location.pathname,
      });
    };

    const onError = (event: ErrorEvent) => {
      report(String(event.message ?? event.error ?? ""));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      report(String(event.reason ?? ""));
    };

    const originalError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      report(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
      originalError(...args);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      console.error = originalError;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
