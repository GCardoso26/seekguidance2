/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/seller-dashboard/DataTable";

type Row = { id: string; name: string; price: number };

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "price", header: "Preço" },
];

const rows: Row[] = [
  { id: "1", name: "Lightning Bolt", price: 12.5 },
  { id: "2", name: "Counterspell", price: 8 },
];

describe("DataTable", () => {
  it("renderiza colunas e permite sort por clique no header", () => {
    render(<DataTable data={rows} columns={columns} testId="test-table" />);

    expect(screen.getByTestId("test-table")).toBeTruthy();
    expect(screen.getByText("Lightning Bolt")).toBeTruthy();
    expect(screen.getByText("Counterspell")).toBeTruthy();

    const priceHeader = screen.getByRole("button", { name: /preço/i });
    fireEvent.click(priceHeader);
    fireEvent.click(priceHeader);

    const rowsAfterSort = screen.getAllByRole("row").slice(1);
    expect(rowsAfterSort[0]?.textContent).toContain("Counterspell");
  });

  it("mostra mensagem quando vazio", () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Sem dados" />);
    expect(screen.getByText("Sem dados")).toBeTruthy();
  });
});
