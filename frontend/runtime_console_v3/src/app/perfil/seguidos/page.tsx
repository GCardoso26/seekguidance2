"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

type FollowingSeller = {
  id: string;
  handle?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  shop_name?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
};

export default function SeguidosPage() {
  const { user } = useJudgeAuth();

  const { data: following = [], isLoading } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const res = await fetch("/api/social/follows/me", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json() as Promise<FollowingSeller[]>;
    },
    enabled: Boolean(user),
  });

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/perfil" className="text-sm text-muted-foreground hover:text-foreground">
          ← Perfil
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Vendedores seguidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lojas e jogadores que você acompanha.
        </p>

        {!user && (
          <p className="mt-8 rounded-lg border border-border p-4 text-sm">
            Faça login para ver quem você segue.
          </p>
        )}

        {user && isLoading && (
          <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
        )}

        {user && !isLoading && following.length === 0 && (
          <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Você ainda não segue nenhum vendedor.
            <br />
            <Link href="/loja/busca" className="mt-2 inline-block text-primary underline">
              Explorar loja
            </Link>
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {following.map((seller) => {
            const name = seller.shop_name || seller.display_name || seller.handle || "Vendedor";
            const rating =
              seller.average_rating != null ? Number(seller.average_rating).toFixed(1) : null;
            return (
              <li key={seller.id}>
                <Link
                  href={`/vendedor/${seller.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold">
                    {seller.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={seller.avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      name[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{name}</p>
                    {seller.handle && (
                      <p className="text-xs text-muted-foreground">@{seller.handle}</p>
                    )}
                    {rating && (
                      <p className="text-xs text-muted-foreground">
                        ⭐ {rating}
                        {seller.review_count != null ? ` · ${seller.review_count} avaliações` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </MobileLayout>
  );
}
