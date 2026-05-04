import { ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table"
import * as React from "react"

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  pageCount?: number
  totalRows?: number
  pageSize?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onSortChange?: (sorting: SortingState) => void
  onFilterChange?: (filters: ColumnFiltersState) => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  batchActions?: BatchAction<TData>[]
  loading?: boolean
  error?: Error | null
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  rowActions?: RowAction<TData>[]
  className?: string
}

export interface BatchAction<TData = unknown> {
  label: string
  onClick: (selectedRows: TData[]) => void
  variant?: "default" | "destructive" | "outline"
}

export interface RowAction<TData> {
  label: string
  onClick: (row: TData) => void
  icon?: React.ComponentType<{ className?: string }>
}
