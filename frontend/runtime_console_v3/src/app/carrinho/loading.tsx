import { Skeleton } from "@/components/ui/skeleton";

/** Shell imediato — reduz TTFB percebido e cold compile bloqueante na 1ª visita. */
export default function CarrinhoLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Carregando carrinho">
      <Skeleton className="mb-8 h-2 w-full max-w-md rounded-full" />
      <Skeleton className="mb-4 h-10 w-48" />
      <Skeleton className="mb-8 h-4 w-full max-w-lg" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
