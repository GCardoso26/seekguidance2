"use client";

import { SegmentError } from "@/components/ui/SegmentError";

export default function CheckoutError({
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
      title="Erro no checkout"
      homeHref="/marketplace/cart"
    />
  );
}
