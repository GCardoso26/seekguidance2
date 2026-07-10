"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

const NotificationsPage = dynamic(
  () => import("@/components/notifications/NotificationsPage").then((m) => m.NotificationsPage),
  { loading: () => <p className="text-sm text-muted-foreground">Carregando…</p>, ssr: false },
);

export default function NotificationsRoutePage() {
  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8" data-testid="notifications-route">
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
          ← Início
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Notificações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Alertas, pedidos, torneios e conquistas</p>
        <div className="mt-6">
          <NotificationsPage />
        </div>
        <p className="mt-8 text-center">
          <Link href="/settings/notifications" className="text-sm text-primary underline">
            Preferências de notificação
          </Link>
        </p>
      </div>
    </MobileLayout>
  );
}
