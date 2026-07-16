"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/auth/auth-provider";
import { useCart } from "@/src/cart/cart-provider";
import { ApiError } from "@/src/api/client";
import type { CartItemDisplayMeta, ListingResponse } from "@/src/types/api";
import { Button } from "@/src/components/ui";

export function AddToCartButton({
  offer,
  cardId,
  cardName,
  storeName,
}: {
  offer: ListingResponse;
  cardId: string;
  cardName: string;
  storeName: string;
}) {
  const { state } = useAuth();
  const { addOffer, loading } = useCart();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAdd() {
    setMsg(null);
    if (state !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(`/cards/${cardId}`)}`);
      return;
    }
    const meta: CartItemDisplayMeta = {
      listingId: offer.id,
      cardId,
      cardName,
      storeName,
      condition: offer.condition,
      language: offer.language,
    };
    setBusy(true);
    try {
      await addOffer(meta, 1);
      setMsg("Adicionado");
    } catch (err) {
      setMsg(err instanceof ApiError ? err.code : "Erro ao adicionar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={busy || loading}
        onClick={() => {
          void onAdd();
        }}
      >
        {busy ? "…" : "Adicionar ao carrinho"}
      </Button>
      {msg ? (
        <span className="text-xs text-zinc-600">
          {msg === "Adicionado" ? (
            <>
              Adicionado ·{" "}
              <Link href="/cart" className="text-emerald-800 underline">
                Ver carrinho
              </Link>
            </>
          ) : (
            msg
          )}
        </span>
      ) : null}
    </div>
  );
}
