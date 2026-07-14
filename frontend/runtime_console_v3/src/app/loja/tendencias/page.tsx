import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageContainer } from "@/components/ui/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import {
  MoverCardGrid,
  TopMoversHero,
  TopMoversInsights,
} from "@/components/top-movers/TopMoversPanels";
import { TopMoversFiltersIsland } from "@/components/top-movers/TopMoversFiltersIsland";
import { TopMoversTableIsland } from "@/components/top-movers/TopMoversTableIsland";
import { fetchTopMovers } from "@/lib/top-movers/fetch";
import { withCanonical } from "@/lib/page-metadata";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  return withCanonical("/loja/tendencias", {
    title: "Top Movers — Tendências do marketplace | Judge TCG",
    description:
      "Altas, quedas, liquidez e volume do marketplace de TCGs. Terminal de mercado alimentado por Data Marts.",
    openGraph: {
      title: "Top Movers | Judge TCG",
      description: "Mercado em movimento — gainers, losers e liquidez.",
      images: ["/og-image.jpg"],
    },
  });
}

function asStr(v: string | string[] | undefined, fallback = "") {
  if (Array.isArray(v)) return v[0] ?? fallback;
  return v ?? fallback;
}

async function TopMoversBody({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const game = asStr(sp.game);
  const period = asStr(sp.period, "7d");
  const sort = asStr(sp.sort, "alta");
  const foil = asStr(sp.foil);
  const data = await fetchTopMovers({
    game: game || undefined,
    period,
    sort,
    foil: foil === "1" ? "true" : undefined,
    limit: "48",
  });

  const tableRows = data.filtered?.length
    ? data.filtered
    : data.trending?.length
      ? data.trending
      : data.top_gainers ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Top Movers — Judge TCG",
    description: "Tendências de preço e liquidez do marketplace",
    url: "https://judgetcg.com.br/loja/tendencias",
    isPartOf: { "@type": "WebSite", name: "Judge TCG", url: "https://judgetcg.com.br" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-caption text-muted-foreground">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/loja" className="hover:text-foreground">
              Loja
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">Top Movers</li>
        </ol>
      </nav>

      <TopMoversHero data={data} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-10">
          <Suspense fallback={<Skeleton className="h-28 w-full" />}>
            <TopMoversFiltersIsland />
          </Suspense>

          <MoverCardGrid title="Cards em alta" description="Maiores altas na janela" cards={data.top_gainers?.slice(0, 4) ?? []} />
          <MoverCardGrid title="Cards em baixa" description="Maiores quedas" cards={data.top_losers?.slice(0, 4) ?? []} />
          <MoverCardGrid title="Mais pesquisadas" cards={data.most_viewed?.slice(0, 4) ?? []} />
          <MoverCardGrid title="Mais vendidas" cards={data.most_sold?.slice(0, 4) ?? []} />
          <MoverCardGrid title="Maior liquidez" cards={data.highest_liquidity?.slice(0, 4) ?? []} />

          <section>
            <SectionHeader title="Tabela completa" description="Ordenação via Runtime API (Data Marts)" />
            <TopMoversTableIsland rows={tableRows} />
          </section>
        </div>
        <TopMoversInsights insights={data.insights ?? []} />
      </div>
    </>
  );
}

export default function LojaTendenciasPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MobileLayout>
      <PageContainer>
        <Suspense
          fallback={
            <div className="space-y-4 py-10" aria-busy>
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          }
        >
          <TopMoversBody searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </MobileLayout>
  );
}
