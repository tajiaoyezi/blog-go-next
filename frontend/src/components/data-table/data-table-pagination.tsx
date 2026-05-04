"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { cn } from "@/lib/utils"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageCount?: number
  currentPage?: number
  totalRows?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTablePagination<TData>({
  table,
  pageCount,
  currentPage,
  totalRows: totalRowsProp,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const pageSize = table.getState().pagination.pageSize
  const pageIndex = table.getState().pagination.pageIndex
  
  // 1-based page number for display
  const currentPageNumber = currentPage ?? pageIndex + 1
  const totalPages = pageCount ?? table.getPageCount()
  // Use prop if provided (for manual pagination), otherwise fall back to current page rows
  const totalRows = totalRowsProp ?? table.getCoreRowModel().rows.length

  const canPreviousPage = currentPageNumber > 1
  const canNextPage = currentPageNumber < totalPages

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    
    if (onPageChange) {
      onPageChange(page)
    } else {
      table.setPageIndex(page - 1)
    }
  }

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return
    const size = parseInt(value, 10)
    if (onPageSizeChange) {
      onPageSizeChange(size)
    } else {
      table.setPageSize(size)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPageNumber <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPageNumber >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPageNumber - 1; i <= currentPageNumber + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const [jumpPage, setJumpPage] = React.useState("")

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(jumpPage, 10)
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        handlePageChange(page)
        setJumpPage("")
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          第 {currentPageNumber} 页，共 {totalPages} 页，总计 {totalRows} 条
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(1)}
            disabled={!canPreviousPage}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(currentPageNumber - 1)}
            disabled={!canPreviousPage}
          >
            <ChevronLeft className="size-4" />
          </Button>

          {getPageNumbers().map((page, index) =>
            typeof page === "string" ? (
              <span key={index} className="px-2 text-muted-foreground">
                {page}
              </span>
            ) : (
              <Button
                key={index}
                variant={page === currentPageNumber ? "default" : "outline"}
                size="icon-sm"
                onClick={() => handlePageChange(page)}
                className={cn(
                  "size-8",
                  page === currentPageNumber && "pointer-events-none"
                )}
              >
                {page}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(currentPageNumber + 1)}
            disabled={!canNextPage}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canNextPage}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-muted-foreground">跳转</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
            onKeyDown={handleJump}
            className="h-8 w-16 text-center"
            placeholder="页码"
          />
        </div>

        <Select
          value={pageSize.toString()}
          onValueChange={handlePageSizeChange}
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue placeholder="每页条数" />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} 条/页
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
