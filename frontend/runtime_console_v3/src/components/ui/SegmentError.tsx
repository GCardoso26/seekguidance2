"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  homeHref?: string;
};

export function SegmentError({ error, reset, title = "Algo deu errado", homeHref }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-bold text-red-300">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-luxury-mist">
        Ocorreu um erro inesperado. Tente novamente ou volte mais tarde.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Tentar novamente
        </Button>
        {homeHref ? (
          <Button asChild variant="outline" className="border-white/20">
            <Link href={homeHref}>Voltar</Link>
          </Button>
        ) : null}
      </div>
    </main>
  );
}
