"use client";

import type { ReactNode } from "react";
import { AuthProviderWrapper } from "@/providers/auth-provider-wrapper";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { LuxurySiteShell } from "@/components/luxury/layout/LuxurySiteShell";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { HydrationMismatchWatcher } from "@/components/telemetry/HydrationMismatchWatcher";
import { Toaster } from "sonner";

/**
 * Providers mínimos no root — Theme / Auth / Query apenas.
 * Cart, Search e Upgrade vivem em shells de área (Marketplace / Seller).
 */
export function MinimalProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProviderWrapper>
        <QueryProvider>
          <HydrationMismatchWatcher />
          <ErrorBoundary>
            <LuxurySiteShell>{children}</LuxurySiteShell>
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "bg-card border border-border text-foreground shadow-md",
              },
            }}
          />
        </QueryProvider>
      </AuthProviderWrapper>
    </ThemeProvider>
  );
}
