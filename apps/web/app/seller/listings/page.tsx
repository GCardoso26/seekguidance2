"use client";

import Link from "next/link";
import { Protected } from "@/src/components/Protected";
import { SellerListingsList } from "@/src/components/seller/SellerListingsList";
import { Button, Card } from "@/src/components/ui";

function ListingsBody() {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900">Meus anúncios</h1>
        <Link href="/seller/listings/new">
          <Button type="button">Publicar</Button>
        </Link>
      </div>
      <SellerListingsList />
    </Card>
  );
}

export default function SellerListingsPage() {
  return (
    <Protected role="seller">
      <ListingsBody />
    </Protected>
  );
}
