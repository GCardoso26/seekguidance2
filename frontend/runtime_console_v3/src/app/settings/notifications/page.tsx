"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";

export default function NotificationSettingsPage() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications" className="text-sm text-muted-foreground">
          ← Notificações
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Preferências</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha como deseja receber alertas de pedidos, pagamentos e avaliações.
        </p>
        <div className="mt-6 surface-card p-6">
          <NotificationPreferences />
        </div>
      </div>
    </MobileLayout>
  );
}
