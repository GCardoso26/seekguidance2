"use client";

import dynamic from "next/dynamic";
import { MobileLayout } from "@/components/layout/MobileLayout";

const BuyerDashboardPage = dynamic(
  () => import("@/components/buyer/BuyerDashboardPage").then((m) => m.BuyerDashboardPage),
  {
    loading: () => (
      <div className="min-h-[70vh] space-y-8" aria-busy="true" data-testid="buyer-dashboard-loading">
        <div className="h-16 max-w-md animate-pulse rounded-lg bg-muted/50" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </div>
    ),
    ssr: true,
  },
);

export function CompradorClient() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <BuyerDashboardPage />
      </div>
    </MobileLayout>
  );
}
