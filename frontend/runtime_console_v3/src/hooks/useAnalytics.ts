"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  flushAnalytics,
  trackEvent,
  type AnalyticsEventName,
  type UserTier,
} from "@/lib/analytics";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

type TrackOptions = {
  tier?: UserTier;
  game_slug?: string;
  [key: string]: unknown;
};

export function useAnalytics(defaultTier: UserTier = "free") {
  const { user } = useJudgeAuth();
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  const track = useCallback(
    (event: AnalyticsEventName | string, properties?: TrackOptions) => {
      void trackEvent(event as AnalyticsEventName, {
        ...properties,
        user_id: user?.id,
        tier: properties?.tier ?? defaultTier,
      });
    },
    [user?.id, defaultTier],
  );

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    void trackEvent("page_view", {
      user_id: user?.id,
      tier: defaultTier,
      path: pathname,
    });
  }, [pathname, user?.id, defaultTier]);

  useEffect(() => {
    const onUnload = () => {
      void flushAnalytics();
    };
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        void flushAnalytics();
      }
    });
    return () => {
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  return { track, flush: flushAnalytics };
}
