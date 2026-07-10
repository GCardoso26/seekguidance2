"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function ListingsPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div
      className="flex justify-center gap-2 pt-2"
      data-testid="seller-listings-pagination"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground transition hover:bg-muted/80 disabled:opacity-40"
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="px-2 py-1 text-sm text-muted-foreground" data-testid="seller-listings-page-indicator">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground transition hover:bg-muted/80 disabled:opacity-40"
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </div>
  );
}

type UpsellProps = {
  href?: string;
  label?: string;
};

export function NovaListagemAction({ href = "/vendedor/painel/planos", label = "Upgrade para mais listagens" }: UpsellProps) {
  return (
    <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function NovaListagemButton() {
  return (
    <Button asChild className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90-light">
      <Link href="/vendedor/painel/listagens/nova">+ Nova listagem</Link>
    </Button>
  );
}
