"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconCheck,
  IconDotsVertical,
  IconX,
  IconBuilding,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditClientDialog } from "./edit-client-dialog"

// Define schema for client data
export const clientSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  telefono: z.string().nullable().optional(),
  direccion: z.string().nullable().optional(),
  comentarios: z.string().nullable().optional(),
  estado: z.string().default("Activo"),
  created: z.string(),
  updated: z.string(),
  eventos: z.array(z.string()).optional()
})

type Client = z.infer<typeof clientSchema>

// Helper function to get status colors
function getStatusColor(status: string) {
  switch (status) {
    case "Activo":
      return "bg-green-100/20 dark:bg-green-900/20"
    case "Inactivo":
      return "bg-red-100/20 dark:bg-red-900/20"
    default:
      return ""
  }
}

export function ClientsDataTable({
  data: initialData,
}: {
  data: z.infer<typeof clientSchema>[]
}) {
  const [data, setData] = React.useState(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null)
  const [isDeletingClient, setIsDeletingClient] = React.useState(false)

  // Actualizar los datos locales cuando cambian los datos de entrada
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Función para eliminar un cliente
  const deleteClient = async (clientId: string) => {
    if (!clientId) return
    
    setIsDeletingClient(true)
    
    try {
      const response = await fetch(`/api/clientes?id=${clientId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Error al eliminar el cliente")
      }

      toast.success("Cliente eliminado correctamente")
      
      // Actualizar el estado local para reflejar la eliminación
      setData((prev) => prev.filter((client) => client.id !== clientId))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar el cliente"
      toast.error(errorMessage)
    } finally {
      setIsDeletingClient(false)
      setIsDeleteDialogOpen(false)
      setClientToDelete(null)
    }
  }

  // Función para refrescar los datos después de una actualización
  const refreshData = async () => {
    try {
      const response = await fetch('/api/clientes')
      
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setData(data.data)
      }
    } catch (error) {
      console.error('Error al refrescar los datos de clientes:', error)
    }
  }

  const columns: ColumnDef<Client>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
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
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconBuilding className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{row.getValue("nombre")}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => <div>{row.getValue("contacto") || "-"}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="text-blue-600 dark:text-blue-400">{row.getValue("email") || "-"}</div>,
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => <div>{row.getValue("telefono") || "-"}</div>,
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("direccion") || "-"}</div>,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue("estado") as string
        return (
          <Badge variant="outline" className={`text-muted-foreground px-1.5 ${getStatusColor(estado)}`}>
            {estado === "Activo" ? (
              <IconCheck className="mr-1 text-green-500" />
            ) : (
              <IconX className="mr-1 text-red-500" />
            )}
            {estado}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created",
      header: "Fecha Creación",
      cell: ({ row }) => <div>{new Date(row.getValue("created")).toLocaleDateString()}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const client = row.original;
        
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
                  setEditingClient(client);
                  setIsEditDialogOpen(true);
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setClientToDelete(client);
                  setIsDeleteDialogOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

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
            placeholder="Filter clients..."
            value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("nombre")?.setFilterValue(event.target.value)
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
                checked={!table.getColumn("estado")?.getFilterValue()}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue(undefined)
                }}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "Activo"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("Activo")
                }}
              >
                Activo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "Inactivo"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("Inactivo")
                }}
              >
                Inactivo
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

      {/* Dialog for editing clients */}
      <EditClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={editingClient}
        onClientUpdated={refreshData}
      />
      
      {/* Dialog for confirming deletion */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente 
              <span className="font-semibold"> {clientToDelete?.nombre}</span> del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingClient}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (clientToDelete) {
                  deleteClient(clientToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingClient}
            >
              {isDeletingClient ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 