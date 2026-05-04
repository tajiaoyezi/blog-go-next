import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, Trash } from "lucide-react";

interface TestRow {
  id: number;
  title: string;
  status: string;
}

const columns: ColumnDef<TestRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id,
  },
  {
    accessorKey: "title",
    header: "标题",
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => row.original.status,
  },
];

const testData: TestRow[] = [
  { id: 1, title: "文章一", status: "已发布" },
  { id: 2, title: "文章二", status: "草稿" },
  { id: 3, title: "文章三", status: "已发布" },
];

describe("DataTable", () => {
  it("renders loading state", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        loading={true}
      />
    );

    expect(document.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });

  it("renders error state", () => {
    const error = new Error("网络错误");
    render(
      <DataTable
        data={[]}
        columns={columns}
        error={error}
      />
    );

    expect(screen.getByText("加载失败")).toBeInTheDocument();
    expect(screen.getByText("网络错误")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
      />
    );

    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
      />
    );

    expect(screen.getByText("文章一")).toBeInTheDocument();
    expect(screen.getByText("文章二")).toBeInTheDocument();
    expect(screen.getByText("文章三")).toBeInTheDocument();
  });

  it("renders custom empty state", () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        emptyTitle="无文章"
        emptyDescription="点击添加"
      />
    );

    expect(screen.getByText("无文章")).toBeInTheDocument();
    expect(screen.getByText("点击添加")).toBeInTheDocument();
  });

  it("supports row selection", () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        selectable={true}
        onSelectionChange={onSelectionChange}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(1);

    fireEvent.click(checkboxes[1]);
    expect(onSelectionChange).toHaveBeenCalledWith([testData[0]]);
  });

  it("supports batch actions", () => {
    const onBatchDelete = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        selectable={true}
        batchActions={[
          {
            label: "批量删除",
            variant: "destructive",
            onClick: onBatchDelete,
          },
        ]}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    const batchButton = screen.getByText("批量删除");
    expect(batchButton).toBeInTheDocument();

    fireEvent.click(batchButton);
    expect(onBatchDelete).toHaveBeenCalledWith([testData[0]]);
  });

  it("supports row actions", () => {
    const onDelete = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        rowActions={[
          {
            label: "删除",
            icon: Trash,
            onClick: onDelete,
          },
        ]}
      />
    );

    expect(screen.getAllByText("操作").length).toBeGreaterThan(0);
  });

  it("supports search", async () => {
    const onSearch = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        searchable={true}
        searchPlaceholder="搜索文章"
        onSearch={onSearch}
      />
    );

    const searchInput = screen.getByPlaceholderText("搜索文章");
    fireEvent.change(searchInput, { target: { value: "文章一" } });

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith("文章一");
    });
  });

  it("supports pagination", () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        pageCount={5}
        currentPage={1}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText(/第 1 页/)).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    
    // Find and click a pagination button (not the first one which might be prev)
    const pageButtons = buttons.filter(btn => btn.textContent?.match(/^\d+$/));
    if (pageButtons.length > 1) {
      fireEvent.click(pageButtons[1]);
      expect(onPageChange).toHaveBeenCalled();
    }
  });

  it("applies custom className", () => {
    const { container } = render(
      <DataTable
        data={testData}
        columns={columns}
        className="custom-table"
      />
    );

    expect(container.querySelector(".custom-table")).toBeInTheDocument();
  });

  it("displays pagination info correctly", () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        pageCount={10}
        currentPage={3}
      />
    );

    expect(screen.getByText(/第 3 页/)).toBeInTheDocument();
    expect(screen.getByText(/总计 3 条/)).toBeInTheDocument();
  });

  it("supports sorting", () => {
    const onSortChange = vi.fn();
    const sortableColumns: ColumnDef<TestRow>[] = [
      {
        accessorKey: "id",
        header: "ID",
        enableSorting: true,
      },
      {
        accessorKey: "title",
        header: "标题",
        enableSorting: true,
      },
    ];

    render(
      <DataTable
        data={testData}
        columns={sortableColumns}
        sortable={true}
        onSortChange={onSortChange}
      />
    );

    const headers = screen.getAllByRole("columnheader");
    if (headers.length > 0) {
      fireEvent.click(headers[0]);
      expect(onSortChange).toHaveBeenCalled();
    }
  });

  it("supports filterable columns", () => {
    const onFilterChange = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        filterable={true}
        onFilterChange={onFilterChange}
      />
    );

    // Should render column settings button
    expect(screen.getByText("列设置")).toBeInTheDocument();
  });

  it("renders row actions dropdown", () => {
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        rowActions={[
          {
            label: "编辑",
            onClick: onEdit,
          },
          {
            label: "删除",
            onClick: onDelete,
          },
        ]}
      />
    );

    expect(screen.getAllByText("操作").length).toBeGreaterThan(0);
  });

  it("handles empty row actions", () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        rowActions={[]}
      />
    );

    // Should not render actions column header
    expect(screen.queryByText("操作")).not.toBeInTheDocument();
  });
});
