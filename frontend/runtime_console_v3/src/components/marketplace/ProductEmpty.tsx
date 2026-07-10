import Link from "next/link";

interface ProductEmptyProps {
  onClear?: () => void;
}

export function ProductEmpty({ onClear }: ProductEmptyProps) {
  return (
    <div
      className="rounded-xl border border-dashed border-border p-10 text-center"
      data-testid="marketplace-products-empty"
    >
      <p className="text-lg font-semibold text-foreground">Nenhum produto encontrado</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Tente ampliar a faixa de preço ou remover alguns filtros.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/80"
          >
            Limpar filtros
          </button>
        )}
        <Link href="/loja/busca" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Buscar cartas no catálogo
        </Link>
      </div>
    </div>
  );
}
