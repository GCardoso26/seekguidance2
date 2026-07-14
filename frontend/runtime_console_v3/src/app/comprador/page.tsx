import { Suspense } from "react";
import { CompradorClient } from "@/app/comprador/CompradorClient";

export default function CompradorPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-5xl px-4 py-8" aria-busy="true">
          <div className="min-h-[70vh] space-y-8">
            <div className="h-16 max-w-md animate-pulse rounded-lg bg-muted/50" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
              <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
            </div>
          </div>
        </div>
      }
    >
      <CompradorClient />
    </Suspense>
  );
}
