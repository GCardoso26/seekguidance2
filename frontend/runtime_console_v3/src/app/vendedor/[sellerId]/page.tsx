type Props = { params: Promise<{ sellerId: string }> };

export default async function SellerAboutPage({ params }: Props) {
  const { sellerId } = await params;
  const res = await fetch(
    `${(process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "")}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/profile`,
    { next: { revalidate: 120 } },
  );
  const data = res.ok ? await res.json() : null;
  const profile = data?.seller;

  return (
    <div className="prose prose-invert max-w-none">
      <h2 className="text-lg font-semibold">Sobre</h2>
      {profile?.bio ? (
        <p className="text-muted-foreground">{profile.bio}</p>
      ) : (
        <p className="text-muted-foreground">Este vendedor ainda não adicionou uma descrição.</p>
      )}
      {profile?.member_since && (
        <p className="mt-4 text-sm text-muted-foreground">
          Membro desde {new Date(profile.member_since).toLocaleDateString("pt-BR")}
        </p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-bold">{profile?.active_listings ?? 0}</p>
          <p className="text-xs text-muted-foreground">Listagens ativas</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-bold">{profile?.total_sales ?? 0}</p>
          <p className="text-xs text-muted-foreground">Vendas</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-bold">{profile?.rating_average?.toFixed(1) ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Avaliação média</p>
        </div>
      </div>
    </div>
  );
}
