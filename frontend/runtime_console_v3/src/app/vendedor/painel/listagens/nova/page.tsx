"use client";

import { Suspense } from "react";
import { ListingPublishWizard } from "@/components/seller-dashboard/listings/ListingPublishWizard";
import { PageHeader, PageShell, PageSkeleton } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";

export default function NovaListagemPage() {
  return (
    <>
      <SellerHeader />
      <PageShell>
        <PageHeader
          title="Publicar carta"
          description="Busque, configure e publique em poucos cliques."
        />
        <Suspense fallback={<PageSkeleton rows={6} />}>
          <ListingPublishWizard />
        </Suspense>
      </PageShell>
    </>
  );
}
