"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconCircleCheck,
  IconUserCircle,
  IconDotsVertical,
  IconAlertCircle,
  IconClock,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Define schema for person data
export const personSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  department: z.string(),
  position: z.string(),
  hireDate: z.string(),
  status: z.string(),
})

type Person = z.infer<typeof personSchema>

const columns: ColumnDef<Person>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const firstName = row.original.firstName;
      const lastName = row.original.lastName;
      const fullName = `${firstName} ${lastName}`;
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{fullName}</div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-blue-600 dark:text-blue-400">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.getValue("department")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "position",
    header: "Position",
    cell: ({ row }) => <div>{row.getValue("position")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant="outline" className={`text-muted-foreground px-1.5 ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "hireDate",
    header: "Hire Date",
    cell: ({ row }) => <div>{new Date(row.getValue("hireDate")).toLocaleDateString()}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const fullName = `${row.original.firstName} ${row.original.lastName}`;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Open menu"
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            >
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() => {
                toast.success(`Viewed profile for ${fullName}`)
              }}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast.success(`Editing ${fullName}`)
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast(`Deleted ${fullName}`)
              }}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Helper function to get status colors
function getStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100/20 dark:bg-green-900/20"
    case "Inactive":
      return "bg-red-100/20 dark:bg-red-900/20"
    case "On Leave":
      return "bg-yellow-100/20 dark:bg-yellow-900/20"
    default:
      return ""
  }
}

// Helper function to get status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "Active":
      return <IconCircleCheck className="mr-1 text-green-500" />
    case "Inactive":
      return <IconAlertCircle className="mr-1 text-red-500" />
    case "On Leave":
      return <IconClock className="mr-1 text-yellow-500" />
    default:
      return null
  }
}

export function PeopleDataTable({
  data: initialData,
}: {
  data: z.infer<typeof personSchema>[]
}) {
  const [data] = React.useState(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Filter people..."
            value={(table.getColumn("department")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("department")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto flex gap-1">
                Status
                <IconChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={!table.getColumn("status")?.getFilterValue()}
                onCheckedChange={() => {
                  table.getColumn("status")?.setFilterValue(undefined)
                }}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("status")?.getFilterValue() === "Active"}
                onCheckedChange={() => {
                  table.getColumn("status")?.setFilterValue("Active")
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("status")?.getFilterValue() === "Inactive"}
                onCheckedChange={() => {
                  table.getColumn("status")?.setFilterValue("Inactive")
                }}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("status")?.getFilterValue() === "On Leave"}
                onCheckedChange={() => {
                  table.getColumn("status")?.setFilterValue("On Leave")
                }}
              >
                On Leave
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.getCanHide()
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 