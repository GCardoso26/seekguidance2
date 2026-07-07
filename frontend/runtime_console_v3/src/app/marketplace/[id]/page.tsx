"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDecklistDetail } from "@/hooks/useDecklistDetail";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DecklistDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { decklist, isLoading, error } = useDecklistDetail(id);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8 text-luxury-mist">Carregando decklist…</div>
      </MobileLayout>
    );
  }

  if (error || !decklist) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-400">Decklist não encontrada</p>
          <Link href="/marketplace/produtos">
            <Button variant="outline" className="mt-4 border-white/10">
              Voltar aos produtos selados
            </Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/marketplace/produtos" className="text-sm text-luxury-mist">
          ← Produtos selados
        </Link>

        <div className="mb-6 mt-2">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge>{decklist.game_code}</Badge>
            <Badge className="border border-white/10 bg-transparent text-luxury-frost/90">
              {decklist.format}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{decklist.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-luxury-mist">
            {decklist.seller_handle && (
              <Link href={`/player/${decklist.seller_handle}`} className="hover:text-luxury-gold">
                @{decklist.seller_handle}
              </Link>
            )}
            <span>⭐ {Number(decklist.average_rating ?? 0).toFixed(1)}</span>
            <span>{decklist.sales_count} vendas</span>
          </div>
          {decklist.description && <p className="mt-3 text-luxury-frost/90">{decklist.description}</p>}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="luxury-card border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Decklist</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-lg bg-luxury-midnight p-4 text-xs text-luxury-frost">
                  {JSON.stringify(decklist.decklist_data, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="luxury-card border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                {decklist.reviews.length === 0 ? (
                  <p className="text-luxury-mist/70">Nenhuma avaliação ainda</p>
                ) : (
                  <div className="space-y-4">
                    {decklist.reviews.map((review) => (
                      <div key={review.id} className="border-b border-white/10 pb-4 last:border-0">
                        <p className="font-medium">
                          ⭐ {review.rating}/5
                          {review.display_name && (
                            <span className="ml-2 text-sm font-normal text-luxury-mist">
                              por {review.display_name}
                            </span>
                          )}
                        </p>
                        {review.comment && <p className="mt-1 text-sm text-luxury-frost/90">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="luxury-card border-white/10 bg-white/5">
              <CardContent className="p-6">
                <p className="text-3xl font-bold text-luxury-gold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                    decklist.price_cents / 100,
                  )}
                </p>
                <p className="mb-4 text-sm text-luxury-mist/70">{decklist.sales_count} pessoas já compraram</p>
                <Button className="w-full bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold-light">
                  Comprar agora
                </Button>
                <p className="mt-2 text-center text-xs text-luxury-mist/70">Pagamento seguro via Stripe</p>
              </CardContent>
            </Card>

            {decklist.seller_handle && (
              <Card className="luxury-card mt-4 border-white/10 bg-white/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold">Sobre o vendedor</h3>
                  <p className="mt-2 text-sm text-luxury-mist">
                    {decklist.seller_name ?? decklist.seller_handle}
                  </p>
                  <Link href={`/player/${decklist.seller_handle}`}>
                    <Button variant="outline" className="mt-3 w-full border-white/10">
                      Ver perfil
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
