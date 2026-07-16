"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Protected } from "@/src/components/Protected";
import { useAuth } from "@/src/auth/auth-provider";
import { canAccessSeller } from "@/src/auth/guards";
import { Analytics } from "@/src/analytics/events";
import { Button, Card } from "@/src/components/ui";

function SellerHomeBody() {
  const { user } = useAuth();
  const isSeller = canAccessSeller(user);

  useEffect(() => {
    Analytics.track("seller_portal_visit", { userId: user?.userId });
  }, [user?.userId]);

  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Portal do vendedor</h1>
      <p className="text-sm text-zinc-600">
        Objetivo: publicar o primeiro anúncio em menos de 60 segundos. Sem dashboard.
      </p>

      {!isSeller ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-700">
            Você ainda não tem loja. Crie uma para começar a vender.
          </p>
          <Link href="/seller/onboard">
            <Button type="button">Criar loja</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link href="/seller/listings/new">
            <Button type="button">Publicar anúncio</Button>
          </Link>
          <Link href="/seller/listings">
            <Button type="button" variant="secondary">
              Meus anúncios
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

/** Auth only — buyers see CTA to onboard; sellers see publish CTAs. */
export default function SellerPage() {
  return (
    <Protected>
      <SellerHomeBody />
    </Protected>
  );
}
