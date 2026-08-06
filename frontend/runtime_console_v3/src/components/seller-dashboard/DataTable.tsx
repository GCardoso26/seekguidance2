"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { opsColumnCellClass, type OpsColumnMeta } from "@/lib/ops-table";

type Props<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  testId?: string;
  emptyMessage?: string;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: T) => string;
  stickyHeader?: boolean;
  density?: "comfortable" | "compact";
};

function columnMeta(def: ColumnDef<unknown, unknown>): OpsColumnMeta | undefined {
  return def.meta as OpsColumnMeta | undefined;
}

export function DataTable<T>({
  data,
  columns,
  testId = "seller-data-table",
  emptyMessage = "Nenhum registro.",
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  stickyHeader = true,
  density = "comfortable",
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, ...(enableRowSelection && rowSelection !== undefined ? { rowSelection } : {}) },
    onSortingChange: setSorting,
    onRowSelectionChange,
    enableRowSelection,
    getRowId: getRowId as ((row: T) => string) | undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
        <p className="text-small text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden" data-testid={testId}>
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full min-w-[640px] text-left",
            density === "compact" ? "text-caption" : "text-small",
          )}
        >
          <thead
            className={cn(
              "border-b border-border bg-muted/50",
              stickyHeader && "sticky top-0 z-10 backdrop-blur-sm",
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = columnMeta(header.column.columnDef as ColumnDef<unknown, unknown>);
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 font-medium text-muted-foreground",
                        density === "compact" ? "py-2" : "py-3",
                        opsColumnCellClass(meta),
                      )}
                      aria-sort={
                        sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                      }
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                            sorted && "text-primary",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span aria-hidden className="text-caption opacity-70">
                            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = columnMeta(cell.column.columnDef as ColumnDef<unknown, unknown>);
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 text-foreground",
                        density === "compact" ? "py-2" : "py-3",
                        opsColumnCellClass(meta),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
