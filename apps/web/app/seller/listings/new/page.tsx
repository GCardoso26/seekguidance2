"use client";

import Link from "next/link";
import { Protected } from "@/src/components/Protected";
import { SellerWizard } from "@/src/components/seller/SellerWizard";
import { Card } from "@/src/components/ui";

function NewListingBody() {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900">Novo anúncio</h1>
        <Link href="/seller" className="text-sm text-zinc-600 underline">
          Portal
        </Link>
      </div>
      <SellerWizard />
    </Card>
  );
}

export default function NewListingPage() {
  return (
    <Protected role="seller">
      <NewListingBody />
    </Protected>
  );
}
