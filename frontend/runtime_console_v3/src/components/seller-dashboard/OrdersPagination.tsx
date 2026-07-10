"use client";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function OrdersPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pt-2" data-testid="seller-orders-pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground transition hover:bg-muted/80 disabled:opacity-40"
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="px-2 py-1 text-sm text-muted-foreground" data-testid="seller-orders-page-indicator">
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
