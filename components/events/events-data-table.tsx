"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconDotsVertical,
  IconTrash,
  IconEye,
  IconEdit,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
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
  DropdownMenuLabel,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { EditEventForm } from "./edit-event-form"

// Define schema para datos de eventos desde la API
export const eventoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  fecha: z.string().nullable(),
  estado: z.string(),
  comentario: z.string().nullable(),
  cliente: z.object({
    id: z.string(),
    nombre: z.string()
  }).nullable(),
  planner: z.object({
    id: z.string(),
    nombre: z.string()
  }).nullable()
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

function getEstadoColor(estado: string) {
  switch (estado.toLowerCase()) {
    case 'confirmado':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'cancelado':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'completado':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [eventToDelete, setEventToDelete] = React.useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [eventToEdit, setEventToEdit] = React.useState<Evento | null>(null)

  // Actualizar los datos cuando cambia la prop initialData
  React.useEffect(() => {
    console.log("Datos recibidos en tabla:", initialData);
    setData(initialData);
  }, [initialData]);

  const handleDeleteEvent = (id: string) => {
    setEventToDelete(id);
    setDeleteDialogOpen(true);
  }
  
  const handleEditEvent = (event: Evento) => {
    setEventToEdit(event);
    setEditDialogOpen(true);
  }
  
  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    // Recargar la página para obtener los datos actualizados
    window.location.reload();
  }
  
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      const response = await fetch(`/api/eventos?id=${eventToDelete}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Evento eliminado correctamente");
        // Actualizar la lista de eventos eliminando el evento borrado
        setData((prevEvents) => prevEvents.filter(event => event.id !== eventToDelete));
      } else {
        toast.error(`Error al eliminar: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast.error("Error al comunicarse con el servidor");
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  }

  const columns: ColumnDef<Evento>[] = [
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
        const tipoApi = row.getValue("tipo") as string;
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
        const estado = row.getValue("estado") as string;
        return (
          <Badge className={getEstadoColor(estado)}>
            {estado}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const event = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(event.id)}
              >
                <IconEye className="mr-2 h-4 w-4" />
                <span>Ver detalles</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditEvent(event)}
              >
                <IconEdit className="mr-2 h-4 w-4" />
                <span>Editar evento</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteEvent(event.id)}
                className="text-red-600 focus:bg-red-50"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
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
                checked={table.getColumn("estado")?.getFilterValue() === "pendiente"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("pendiente")
                }}
              >
                Pendientes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("estado")?.getFilterValue() === "completado"}
                onCheckedChange={() => {
                  table.getColumn("estado")?.setFilterValue("completado")
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

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para editar evento */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>
              Modifica los detalles del evento y guarda los cambios cuando hayas terminado.
            </DialogDescription>
          </DialogHeader>
          {eventToEdit && (
            <EditEventForm 
              initialData={{
                id: eventToEdit.id,
                nombre: eventToEdit.nombre,
                tipo: eventToEdit.tipo,
                fecha: eventToEdit.fecha ? new Date(eventToEdit.fecha) : undefined,
                estado: eventToEdit.estado,
                comentario: eventToEdit.comentario || "",
                cliente_id: eventToEdit.cliente?.id,
                planner_id: eventToEdit.planner?.id,
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 