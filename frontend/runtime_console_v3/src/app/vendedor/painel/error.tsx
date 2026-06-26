"use client";

import { SegmentError } from "@/components/ui/SegmentError";

export default function VendedorPainelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SegmentError
      error={error}
      reset={reset}
      title="Erro no painel do vendedor"
      homeHref="/vendedor/painel"
    />
  );
}
