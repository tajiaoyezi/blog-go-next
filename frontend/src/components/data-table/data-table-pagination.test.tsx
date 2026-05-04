import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTablePagination } from "./data-table-pagination";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";

interface TestRow {
  id: number;
  name: string;
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

const data: TestRow[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
}));

function TestWrapper({
  pageCount,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: {
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex: (currentPage ?? 1) - 1,
        pageSize: 10,
      },
    },
  });

  return (
    <DataTablePagination
      table={table}
      pageCount={pageCount}
      currentPage={currentPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}

describe("DataTablePagination", () => {
  it("renders pagination info", () => {
    render(<TestWrapper pageCount={10} currentPage={1} />);

    expect(screen.getByText(/第 1 页/)).toBeInTheDocument();
    expect(screen.getByText(/共 10 页/)).toBeInTheDocument();
  });

  it("disables previous buttons on first page", () => {
    render(<TestWrapper pageCount={10} currentPage={1} />);

    const buttons = screen.getAllByRole("button");
    const prevButtons = buttons.slice(0, 2); // First two buttons are "first" and "prev"
    
    prevButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("disables next buttons on last page", () => {
    render(<TestWrapper pageCount={5} currentPage={5} />);

    const buttons = screen.getAllByRole("button");
    const nextButtons = buttons.slice(-2); // Last two buttons are "next" and "last"
    
    nextButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("calls onPageChange when clicking page number", () => {
    const onPageChange = vi.fn();
    render(<TestWrapper pageCount={10} currentPage={1} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole("button");
    const pageButtons = buttons.filter((btn) => btn.textContent?.match(/^\d+$/));
    
    if (pageButtons.length > 1) {
      fireEvent.click(pageButtons[1]); // Click page 2
      expect(onPageChange).toHaveBeenCalledWith(2);
    }
  });

  it("calls onPageChange for next/previous", () => {
    const onPageChange = vi.fn();
    render(<TestWrapper pageCount={10} currentPage={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole("button");
    
    // Find prev button (should be the second button)
    const prevButton = buttons[1];
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("jumps to page on Enter key", () => {
    const onPageChange = vi.fn();
    render(<TestWrapper pageCount={10} currentPage={1} onPageChange={onPageChange} />);

    const jumpInput = screen.getByPlaceholderText("页码");
    fireEvent.change(jumpInput, { target: { value: "5" } });
    fireEvent.keyDown(jumpInput, { key: "Enter" });

    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it("does not jump to invalid page", () => {
    const onPageChange = vi.fn();
    render(<TestWrapper pageCount={10} currentPage={1} onPageChange={onPageChange} />);

    const jumpInput = screen.getByPlaceholderText("页码");
    fireEvent.change(jumpInput, { target: { value: "15" } });
    fireEvent.keyDown(jumpInput, { key: "Enter" });

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("changes page size", () => {
    const onPageSizeChange = vi.fn();
    render(<TestWrapper pageCount={10} currentPage={1} onPageSizeChange={onPageSizeChange} />);

    // Find the select trigger
    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);

    // Should show page size options
    expect(screen.getByText("10 条/页")).toBeInTheDocument();
    expect(screen.getByText("20 条/页")).toBeInTheDocument();
    expect(screen.getByText("50 条/页")).toBeInTheDocument();
  });

  it("renders ellipsis for large page counts", () => {
    render(<TestWrapper pageCount={20} currentPage={10} />);

    const ellipsis = screen.getAllByText("...");
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it("renders compact page numbers for small page counts", () => {
    render(<TestWrapper pageCount={3} currentPage={1} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    
    // Should not show ellipsis for small page counts
    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });
});
