"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { Search, Settings2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useDebounce } from "./use-debounce"
import { BatchAction } from "./types"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  filterable?: boolean
  selectable?: boolean
  batchActions?: BatchAction<TData>[]
}

export function DataTableToolbar<TData>({
  table,
  searchable = false,
  searchPlaceholder = "搜索...",
  onSearch,
  filterable = false,
  selectable = false,
  batchActions,
}: DataTableToolbarProps<TData>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const debouncedQuery = useDebounce(searchQuery, 300)

  React.useEffect(() => {
    if (onSearch) {
      onSearch(debouncedQuery)
    }
  }, [debouncedQuery, onSearch])

  const selectedRows = table.getSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  const handleClearSearch = () => {
    setSearchQuery("")
    if (onSearch) {
      onSearch("")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-4">
      <div className="flex flex-1 items-center gap-2">
        {searchable && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full max-w-[200px] pl-8 pr-8 sm:max-w-[280px]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {selectable && hasSelection && batchActions && batchActions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedRows.length} 项
            </span>
            {batchActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  action.onClick(selectedRows.map((row) => row.original))
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              取消选择
            </Button>
          </div>
        )}
      </div>

      {filterable && (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className="h-8">
              <Settings2 className="mr-2 size-4" />
              列设置
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>显示列</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  column.id !== "select" &&
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {(column.columnDef.meta as { name?: string } | undefined)?.name ?? column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
