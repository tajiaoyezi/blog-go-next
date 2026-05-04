"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

import { DataTableToolbar } from "./data-table-toolbar"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableProps } from "./types"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

function DataTableCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  const ref = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate ?? false
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={indeterminate ? "部分选中" : checked ? "已选中" : "未选中"}
      className={cn(
        "size-4 cursor-pointer rounded border border-input bg-background text-primary accent-primary transition-colors",
        className
      )}
    />
  )
}

export function DataTable<TData>({
  data,
  columns,
  pageCount,
  totalRows,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  sortable = true,
  filterable = true,
  searchable = false,
  searchPlaceholder,
  onSearch,
  onSortChange,
  onFilterChange,
  selectable = false,
  onSelectionChange,
  batchActions,
  loading = false,
  error = null,
  emptyTitle = "暂无数据",
  emptyDescription = "当前列表为空",
  emptyAction,
  rowActions,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const handleSortingChange = React.useCallback(
    (updaterOrValue: SortingState | ((prev: SortingState) => SortingState)) => {
      const newSorting = typeof updaterOrValue === "function" 
        ? updaterOrValue(sorting) 
        : updaterOrValue
      setSorting(newSorting)
      onSortChange?.(newSorting)
    },
    [sorting, onSortChange]
  )

  const handleColumnFiltersChange = React.useCallback(
    (updaterOrValue: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters)
        : updaterOrValue
      setColumnFilters(newFilters)
      onFilterChange?.(newFilters)
    },
    [columnFilters, onFilterChange]
  )

  const handleRowSelectionChange = React.useCallback(
    (updaterOrValue: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection)
        : updaterOrValue
      setRowSelection(newSelection)
    },
    [rowSelection]
  )

  const tableColumns = React.useMemo(() => {
    if (!selectable) return columns

    const selectColumn = {
      id: "select",
      header: ({ table }: { table: import("@tanstack/react-table").Table<TData> }) => (
        <DataTableCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(value)}
        />
      ),
      cell: ({ row }: { row: import("@tanstack/react-table").Row<TData> }) => (
        <DataTableCheckbox
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }

    return [selectColumn, ...columns]
  }, [columns, selectable])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
    },
    pageCount: pageCount ?? -1,
    manualPagination: true,
    manualSorting: !!onSortChange,
    manualFiltering: !!onFilterChange,
    enableRowSelection: selectable,
    enableSorting: sortable,
    enableColumnFilters: filterable,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getFilteredRowModel: filterable ? getFilteredRowModel() : undefined,
    getPaginationRowModel: getPaginationRowModel(),
  })

  const onSelectionChangeRef = React.useRef(onSelectionChange)
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  })

  React.useEffect(() => {
    if (onSelectionChangeRef.current) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
      onSelectionChangeRef.current(selectedRows)
    }
  }, [rowSelection, table])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-lg font-medium text-destructive">加载失败</p>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="rounded-lg border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[300px]" />
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={cn("rounded-lg border bg-card", className)}
      />
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <DataTableToolbar
        table={table}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        filterable={filterable}
        selectable={selectable}
        batchActions={batchActions}
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        header.column.getCanSort() && "cursor-pointer select-none"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </TableHead>
                  )
                })}
                {rowActions && rowActions.length > 0 && (
                  <TableHead className="w-[50px]">操作</TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">操作</span>
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          {rowActions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(row.original)}
                            >
                              {action.icon && (
                                <action.icon className="mr-2 size-4" />
                              )}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (rowActions ? 1 : 0)
                  }
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        pageCount={pageCount}
        currentPage={currentPage}
        totalRows={totalRows}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
