"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLoader,
  IconCalendarEvent,
  IconPencil,
  IconTrash,
  IconEye,
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
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Define schema para datos de eventos desde la API
export const eventoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  fecha: z.string().nullable().optional(),
  estado: z.string(),
  comentario: z.string().nullable().optional(),
  cliente: z.object({
    id: z.string(),
    nombre: z.string(),
    contacto: z.string().optional(),
    email: z.string().optional(),
  }).nullable().optional(),
  planner: z.object({
    id: z.string(),
    nombre: z.string(),
  }).nullable().optional(),
  created: z.string(),
  updated: z.string(),
})

type Evento = z.infer<typeof eventoSchema>

// Función para mapear tipos de eventos a textos legibles
function mapearTipoLegible(tipoApi: string | null | undefined): string {
  if (!tipoApi) return "Sin definir";
  
  const mapaTipos: Record<string, string> = {
    "aniversario": "Aniversario",
    "bat-bar": "Bat/Bar Mitzvah",
    "bautismo": "Bautismo",
    "casamiento": "Casamiento",
    "civil": "Civil",
    "comunion": "Comunión",
    "corporativo": "Corporativo",
    "cumpleanos": "Cumpleaños",
    "egresados": "Egresados",
    "en-casa": "En Casa",
    "festejo": "Festejo",
    "fiesta15": "15 Años"
  };

  return mapaTipos[tipoApi.toLowerCase()] || tipoApi;
}

// Función para mapear estados de la API a estados visuales
function mapearEstadoVisual(estadoApi: string | null | undefined): string {
  if (!estadoApi) return "Pendiente";
  
  switch (estadoApi.toLowerCase()) {
    case "finalizado":
      return "Completado";
    case "en-curso":
      return "Pendiente";
    case "cancelado":
      return "Cancelado";
    default:
      return "Pendiente";
  }
}

const columns: ColumnDef<Evento>[] = [
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
          aria-label="Seleccionar todo"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nombre",
    header: "Nombre del Evento",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipoApi = row.getValue("tipo") as string | null | undefined;
      const tipoLegible = mapearTipoLegible(tipoApi);
      
      return (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {tipoLegible}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => {
      const fecha = row.getValue("fecha") as string | null;
      if (!fecha) return <div className="text-muted-foreground">No definida</div>;
      
      try {
        return <div>{format(parseISO(fecha), "PP", { locale: es })}</div>;
      } catch {
        // En caso de error de parseo de fecha, mostramos el valor sin formato
        return <div className="text-muted-foreground">{fecha}</div>;
      }
    },
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const cliente = row.original.cliente;
      return <div>{cliente ? cliente.nombre : "Sin asignar"}</div>;
    },
  },
  {
    accessorKey: "planner",
    header: "Planner",
    cell: ({ row }) => {
      const planner = row.original.planner;
      return <div>{planner ? planner.nombre : "Sin asignar"}</div>;
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estadoApi = row.getValue("estado") as string | null | undefined;
      const estado = mapearEstadoVisual(estadoApi);
      
      return (
        <Badge variant="outline" className={`text-muted-foreground px-1.5 ${getStatusColor(estadoApi)}`}>
          {estado === "Completado" ? (
            <IconCircleCheckFilled className="mr-1 fill-green-500 dark:fill-green-400" />
          ) : estado === "Confirmado" ? (
            <IconCalendarEvent className="mr-1 text-blue-500" />
          ) : estado === "Cancelado" ? (
            <IconTrash className="mr-1 text-red-500" />
          ) : (
            <IconLoader className="mr-1 text-yellow-500" />
          )}
          {estado}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Abrir menú"
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            >
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() => {
                toast.success(`Ver detalles de ${row.original.nombre}`)
              }}
            >
              <IconEye className="h-4 w-4 mr-2" /> Ver Detalles
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast.success(`Editando ${row.original.nombre}`)
              }}
            >
              <IconPencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast(`Eliminado ${row.original.nombre}`)
              }}
              className="text-destructive focus:text-destructive"
            >
              <IconTrash className="h-4 w-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Helper function to get status colors
function getStatusColor(estado: string | null | undefined) {
  // Convertir estados de la API a los estados visuales de la UI
  const estadoVisual = mapearEstadoVisual(estado);
  
  switch (estadoVisual) {
    case "Completado":
      return "bg-green-100/20 dark:bg-green-900/20"
    case "Confirmado":
      return "bg-blue-100/20 dark:bg-blue-900/20"
    case "Pendiente":
      return "bg-yellow-100/20 dark:bg-yellow-900/20"
    case "Cancelado":
      return "bg-red-100/20 dark:bg-red-900/20"
    default:
      return ""
  }
}

export function EventsDataTable({
  data: initialData
}: {
  data: Evento[]
}) {
  const [data, setData] = React.useState<Evento[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Actualizar los datos cuando cambia la prop initialData
  React.useEffect(() => {
    console.log("Datos recibidos en tabla:", initialData);
    setData(initialData);
  }, [initialData]);

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
            placeholder="Filtrar eventos..."
            value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("nombre")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto flex gap-1">
                Estado
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
                Todos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "en-curso"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("en-curso")
                }}
              >
                Pendientes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "finalizado"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("finalizado")
                }}
              >
                Completados
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "cancelado"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("cancelado")
                }}
              >
                Cancelados
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columnas
                <IconChevronDown className="ml-2 h-4 w-4" />
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
                      {column.id === "nombre" 
                        ? "Nombre" 
                        : column.id === "tipo" 
                        ? "Tipo"
                        : column.id === "fecha"
                        ? "Fecha"
                        : column.id === "cliente"
                        ? "Cliente"
                        : column.id === "planner"
                        ? "Planner"
                        : column.id === "estado"
                        ? "Estado"
                        : column.id}
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
                  No hay eventos para mostrar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
} 