import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface TestData {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

const testColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: "name",
    header: "名称",
  },
  {
    accessorKey: "status",
    header: "状态",
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
  },
];

const testData: TestData[] = [
  { id: 1, name: "Item 1", status: "active", createdAt: "2024-01-01" },
  { id: 2, name: "Item 2", status: "inactive", createdAt: "2024-01-02" },
];

describe("DataTable Mobile (TASK-5.2)", () => {
  it("SC-5.2.1: table container has overflow-x-auto for horizontal scroll", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        pageCount={1}
        currentPage={1}
      />
    );

    const tableContainer = document.querySelector(".overflow-x-auto");
    expect(tableContainer).toBeTruthy();
  });

  it("SC-5.2.2: table has min-w-full for responsive width", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        pageCount={1}
        currentPage={1}
      />
    );

    const table = document.querySelector("table.min-w-full");
    expect(table).toBeTruthy();
  });

  it("SC-5.2.3: search input is responsive", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        pageCount={1}
        currentPage={1}
        searchable={true}
        onSearch={vi.fn()}
      />
    );

    const searchInput = document.querySelector('input[placeholder="搜索..."]');
    expect(searchInput).toBeTruthy();
    
    // Check responsive classes
    const inputWrapper = searchInput?.closest(".relative");
    expect(inputWrapper).toHaveClass("max-w-sm");
  });

  it("SC-5.2.4: batch actions buttons are full width on mobile", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        pageCount={1}
        currentPage={1}
        selectable={true}
        batchActions={[
          {
            label: "删除",
            onClick: vi.fn(),
            variant: "destructive",
          },
        ]}
      />
    );

    // The batch actions container should have flex-wrap
    const batchContainer = document.querySelector(".flex-wrap");
    expect(batchContainer).toBeTruthy();
  });

  it("SC-5.2.5: pagination is simplified on mobile", () => {
    render(
      <DataTable
        data={testData}
        columns={testColumns}
        pageCount={5}
        currentPage={1}
        pageSize={10}
      />
    );

    // Jump input should be hidden on mobile (hidden sm:flex)
    const jumpContainer = document.querySelector(".hidden.sm\\:flex");
    expect(jumpContainer).toBeTruthy();
  });

  it("renders correctly with loading state", () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        pageCount={1}
        currentPage={1}
        loading={true}
      />
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no data", () => {
    render(
      <DataTable
        data={[]}
        columns={testColumns}
        pageCount={0}
        currentPage={1}
      />
    );

    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });
});