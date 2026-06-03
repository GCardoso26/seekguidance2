"use client";

import { useCallback, useEffect } from "react";
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

  const track = useCallback(
    (event: AnalyticsEventName, properties?: TrackOptions) => {
      void trackEvent(event, {
        ...properties,
        user_id: user?.id,
        tier: properties?.tier ?? defaultTier,
      });
    },
    [user?.id, defaultTier],
  );

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
