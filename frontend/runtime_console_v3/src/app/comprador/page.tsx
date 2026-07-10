"use client";

import dynamic from "next/dynamic";
import { MobileLayout } from "@/components/layout/MobileLayout";

const BuyerDashboardPage = dynamic(
  () => import("@/components/buyer/BuyerDashboardPage").then((m) => m.BuyerDashboardPage),
  {
    loading: () => <p className="text-sm text-luxury-mist">Carregando painel…</p>,
    ssr: false,
  },
);

export default function CompradorPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <BuyerDashboardPage />
      </div>
    </MobileLayout>
  );
}
