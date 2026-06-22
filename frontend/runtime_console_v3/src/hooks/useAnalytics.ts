"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const trackedPage = useRef(false);

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
    if (trackedPage.current || typeof window === "undefined") return;
    trackedPage.current = true;
    void trackEvent("page_view", {
      user_id: user?.id,
      tier: defaultTier,
      path: window.location.pathname,
    });
  }, [user?.id, defaultTier]);

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
