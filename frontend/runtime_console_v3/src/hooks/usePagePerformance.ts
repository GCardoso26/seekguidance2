"use client";

import { useEffect } from "react";

export function usePagePerformance(pageName: string) {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "navigation" && process.env.NODE_ENV === "development") {
          const nav = entry as PerformanceNavigationTiming;
          console.debug(`[Page: ${pageName}]`, {
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            tcp: nav.connectEnd - nav.connectStart,
            ttfb: nav.responseStart - nav.startTime,
            domInteractive: nav.domInteractive - nav.startTime,
            domComplete: nav.domComplete - nav.startTime,
            loadComplete: nav.loadEventEnd - nav.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ["navigation"] });
    return () => observer.disconnect();
  }, [pageName]);
}
