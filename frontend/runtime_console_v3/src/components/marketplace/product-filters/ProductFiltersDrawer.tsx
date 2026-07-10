"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Filter } from "lucide-react";
import { FilterFields, type FilterFieldsProps } from "@/components/marketplace/product-filters/FilterFields";

interface ProductFiltersDrawerProps extends FilterFieldsProps {
  activeCount: number;
}

export function ProductFiltersDrawer({ activeCount, ...fields }: ProductFiltersDrawerProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          data-testid="marketplace-filters-open"
          className="flex min-h-11 items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
          )}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 w-[min(20rem,90vw)] overflow-y-auto border-r border-border bg-background p-4 shadow-xl"
          data-testid="marketplace-filters-drawer"
        >
          <Dialog.Title className="mb-4 text-lg font-semibold text-foreground">Filtros</Dialog.Title>
          <FilterFields {...fields} />
          <Dialog.Close asChild>
            <button
              type="button"
              data-testid="marketplace-filters-apply"
              className="mt-4 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground"
            >
              Aplicar
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
