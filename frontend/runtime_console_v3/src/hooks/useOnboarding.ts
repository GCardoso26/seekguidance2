"use client";

import { useMemo } from "react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { ProfileNotFoundError, usePlayerProfile } from "@/hooks/usePlayerProfile";
import { FREE_TCG_SELECTION_LIMIT } from "@/lib/plan-limits/constants";

export function useOnboarding() {
  const { user, loading: authLoading } = useJudgeAuth();
  const {
    data: profile,
    isLoading: profileLoading,
    isError,
    error,
  } = usePlayerProfile(user ? "me" : "");

  const needsOnboarding = useMemo(() => {
    if (!user) return false;
    if (profileLoading) return false;
    if (isError && error instanceof ProfileNotFoundError) return true;
    if (!profile) return false;
    if (profile.hasCompletedOnboarding) return false;
    if ((profile.favoriteTcgs?.length ?? 0) >= FREE_TCG_SELECTION_LIMIT) return false;
    return true;
  }, [user, profileLoading, isError, error, profile]);

  return {
    needsOnboarding,
    isLoading: authLoading || profileLoading,
    profile,
  };
}
