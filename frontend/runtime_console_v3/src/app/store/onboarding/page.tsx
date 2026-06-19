"use client";

import { useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function StoreOnboardingPage() {
  useEffect(() => {
    async function start() {
      const res = await fetch("/api/marketplace/shop/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.onboarding_url) {
        window.location.href = data.onboarding_url;
      }
    }
    void start();
  }, []);

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Redirecionando para Stripe…</h1>
        <p className="mt-2 text-sm text-luxury-mist">Configure sua conta para receber pagamentos.</p>
      </div>
    </MobileLayout>
  );
}
