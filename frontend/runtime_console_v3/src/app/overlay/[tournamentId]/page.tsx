"use client";

import { useParams } from "next/navigation";
import { OverlayConfig } from "@/components/streaming/OverlayConfig";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function OverlayPage() {
  const params = useParams();
  const id = String(params.tournamentId);
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Overlay OBS</h1>
        <div className="mt-6">
          <OverlayConfig tournamentId={id} />
        </div>
      </div>
    </MobileLayout>
  );
}
