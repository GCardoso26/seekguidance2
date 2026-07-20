"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Lê `?onboarding=` sem `useSearchParams`.
 * Evita Suspense eterno no shell do painel (fallback "Carregando painel…" sem fail-open).
 */
export function useOnboardingQueryParam(): string | null {
  const pathname = usePathname();
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setValue(new URLSearchParams(window.location.search).get("onboarding"));
  }, [pathname]);

  return value;
}
