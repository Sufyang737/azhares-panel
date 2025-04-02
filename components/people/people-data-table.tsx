"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconEye,
  IconCake,
  IconMail,
  IconPhone,
  IconUser,
  IconBrandInstagram,
  IconMapPin,
  IconBuilding,
  IconUserCircle,
  IconNotes,
  IconCalendarTime
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { EditPersonDialog } from "./edit-person-dialog"

// Define schema para datos de personas desde la API
export const personaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  telefono: z.string().nullable().or(z.number().nullable()),
  email: z.string().email().nullable(),
  cumpleanio: z.string().nullable(),
  pais: z.string().nullable(),
  ciudad: z.string().nullable(),
  instagram: z.string().nullable(),
  direccion: z.string().nullable(),
  comentario: z.string().nullable(),
  tipo_persona: z.string().nullable().optional(),
  cliente_id: z.string().nullable().optional(),
  cliente: z.object({
    id: z.string(),
    nombre: z.string(),
    // Otros campos del cliente si están disponibles
  }).nullable().optional(),
  relacion: z.string().nullable().optional(),
  created: z.string(),
  updated: z.string()
})

type Persona = z.infer<typeof personaSchema>

// Función para determinar el tipo de persona
function getTipoPersonaBadge(tipo: string | null) {
  if (!tipo) return null;
  
  const tipoLower = tipo.toLowerCase();
  let color = "";
  
  if (tipoLower.includes("cliente") || tipoLower.includes("principal")) {
    color = "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
  } else if (tipoLower.includes("padre") || tipoLower.includes("madre")) {
    color = "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
  } else if (tipoLower.includes("hijo") || tipoLower.includes("hija")) {
    color = "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
  } else if (tipoLower.includes("familiar")) {
    color = "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
  } else {
    color = "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
  }
  
  return (
    <Badge variant="outline" className={`px-2 py-0.5 ${color}`}>
      {tipo}
    </Badge>
  );
}

export function PeopleDataTable({
  data: initialData
}: {
  data: Persona[]
}) {
  const [data, setData] = React.useState<Persona[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    telefono: true,
    email: true,
    cumpleanio: true,
    ubicacion: true,
    instagram: true,
    tipo_persona: true,
    cliente: true,
    comentario: true,
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [personToDelete, setPersonToDelete] = React.useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [personToEdit, setPersonToEdit] = React.useState<Persona | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = React.useState(false)
  const [personDetails, setPersonDetails] = React.useState<Persona | null>(null)

  // Actualizar los datos cuando cambia la prop initialData
  React.useEffect(() => {
    console.log("Datos recibidos en tabla de personas:", initialData);
    setData(initialData);
  }, [initialData]);

  const handleDeletePerson = (id: string) => {
    setPersonToDelete(id);
    setDeleteDialogOpen(true);
  }
  
  const confirmDelete = async () => {
    if (!personToDelete) return;
    
    try {
      const response = await fetch(`/api/personas?id=${personToDelete}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Persona eliminada correctamente");
        // Actualizar la lista de personas eliminando la persona borrada
        setData((prevPersons) => prevPersons.filter(person => person.id !== personToDelete));
      } else {
        toast.error(`Error al eliminar: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      toast.error("Error al comunicarse con el servidor");
    } finally {
      setDeleteDialogOpen(false);
      setPersonToDelete(null);
    }
  }

  const handleEditPerson = (person: Persona) => {
    setPersonToEdit(person);
    setEditDialogOpen(true);
  }

  const handleViewDetails = (person: Persona) => {
    setPersonDetails(person);
    setViewDetailsOpen(true);
  }

  const handlePersonUpdated = (updatedPerson: Persona) => {
    // Actualizar los datos locales con la persona actualizada
    setData(prevData => 
      prevData.map(p => 
        p.id === updatedPerson.id ? updatedPerson : p
      )
    );
  }

  const columns: ColumnDef<Persona>[] = [
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
      accessorFn: (row) => `${row.nombre} ${row.apellido || ''}`.trim(),
      id: "nombreCompleto", 
      header: "Nombre",
      cell: ({ row }) => {
        const nombre = row.original.nombre;
        const apellido = row.original.apellido;
        const nombreCompleto = `${nombre} ${apellido || ''}`.trim();
        
        return (
          <div className="flex items-center">
            <IconUser className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{nombreCompleto}</span>
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "tipo_persona",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue("tipo_persona") as string | null;
        if (!tipo) return <div className="text-muted-foreground">No especificado</div>;
        
        let descripcion = "";
        
        if (tipo.toLowerCase().includes("cliente principal")) {
          descripcion = "Persona principal de contacto del cliente";
        } else if (tipo.toLowerCase().includes("padre")) {
          descripcion = "Padre de familia relacionado con el cliente";
        } else if (tipo.toLowerCase().includes("madre")) {
          descripcion = "Madre de familia relacionada con el cliente";
        } else if (tipo.toLowerCase().includes("hijo") || tipo.toLowerCase().includes("hija")) {
          descripcion = "Hijo/a relacionado/a con el cliente";
        } else if (tipo.toLowerCase().includes("familiar")) {
          descripcion = "Familiar relacionado con el cliente";
        } else {
          descripcion = "Rol de la persona";
        }
        
        return (
          <div title={descripcion}>
            {getTipoPersonaBadge(tipo)}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null;
        if (!email) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconMail className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => {
        const telefono = row.getValue("telefono") as string | number | null;
        if (!telefono) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconPhone className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{telefono.toString()}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "cumpleanio",
      header: "Cumpleaños",
      cell: ({ row }) => {
        const cumpleanio = row.getValue("cumpleanio") as string | null;
        if (!cumpleanio) return <div className="text-muted-foreground">No disponible</div>;
        
        try {
          return (
            <div className="flex items-center">
              <IconCake className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(cumpleanio), "PP", { locale: es })}</span>
            </div>
          );
        } catch {
          return (
            <div className="flex items-center">
              <IconCake className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{cumpleanio}</span>
            </div>
          );
        }
      },
    },
    {
      accessorKey: "instagram",
      header: "Instagram",
      cell: ({ row }) => {
        const instagram = row.original.instagram;
        if (!instagram) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconBrandInstagram className="mr-2 h-4 w-4 text-muted-foreground" />
            <a 
              href={`https://instagram.com/${instagram.replace('@', '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {instagram}
            </a>
          </div>
        );
      },
    },
    {
      accessorFn: (row) => `${row.ciudad || ''} ${row.pais || ''}`.trim(),
      id: "ubicacion",
      header: "Ubicación",
      cell: ({ row }) => {
        const ciudad = row.original.ciudad;
        const pais = row.original.pais;
        
        if (!ciudad && !pais) return <div className="text-muted-foreground">No disponible</div>;
        
        const ubicacion = [ciudad, pais].filter(Boolean).join(", ");
        
        return (
          <div className="flex items-center">
            <IconMapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{ubicacion}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "cliente",
      header: "Cliente Asociado",
      cell: ({ row }) => {
        const cliente = row.original.cliente;
        if (!cliente) return <div className="text-muted-foreground">No asociado</div>;
        
        return (
          <div className="flex items-center">
            <IconBuilding className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{cliente.nombre}</span>
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        const cliente = row.original.cliente;
        if (!cliente) return false;
        return cliente.nombre.toLowerCase().includes(filterValue.toLowerCase());
      }
    },
    {
      accessorKey: "comentario",
      header: "Comentarios",
      cell: ({ row }) => {
        const comentario = row.original.comentario;
        if (!comentario) return <div className="text-muted-foreground">Sin comentarios</div>;
        
        const comentarioCorto = comentario.length > 50 
          ? `${comentario.substring(0, 47)}...` 
          : comentario;
        
        return (
          <div className="flex items-center">
            <IconNotes className="mr-2 h-4 w-4 text-muted-foreground" />
            <span title={comentario}>{comentarioCorto}</span>
          </div>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const person = row.original;
        
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
              <DropdownMenuItem onClick={() => handleViewDetails(person)}>
                <IconEye className="mr-2 h-4 w-4" />
                <span>Ver detalles</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditPerson(person)}>
                <IconEdit className="mr-2 h-4 w-4" />
                <span>Editar persona</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeletePerson(person.id)}
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
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Buscar por nombre..."
            value={(table.getColumn("nombreCompleto")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("nombreCompleto")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          <Input
            placeholder="Filtrar por cliente..."
            value={(table.getColumn("cliente")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("cliente")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
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
                      {column.id === "nombreCompleto" 
                        ? "Nombre" 
                        : column.id === "email" 
                        ? "Email"
                        : column.id === "telefono"
                        ? "Teléfono"
                        : column.id === "cumpleanio"
                        ? "Cumpleaños"
                        : column.id === "ubicacion"
                        ? "Ubicación"
                        : column.id === "tipo_persona"
                        ? "Tipo"
                        : column.id === "instagram"
                        ? "Instagram"
                        : column.id === "cliente"
                        ? "Cliente"
                        : column.id === "comentario"
                        ? "Comentarios"
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron personas.
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
              ¿Estás seguro de que deseas eliminar esta persona? Esta acción no se puede deshacer.
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

      {/* Diálogo de edición de persona */}
      {personToEdit && (
        <EditPersonDialog
          person={personToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onPersonUpdated={handlePersonUpdated}
        />
      )}

      {/* Diálogo para ver detalles completos */}
      {personDetails && (
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles de la Persona</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconUser className="mr-2 h-4 w-4" />
                  Nombre
                </h3>
                <p>{`${personDetails.nombre} ${personDetails.apellido || ''}`}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconUserCircle className="mr-2 h-4 w-4" />
                  Tipo
                </h3>
                <p>{personDetails.tipo_persona || 'No especificado'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconPhone className="mr-2 h-4 w-4" />
                  Teléfono
                </h3>
                <p>{personDetails.telefono || 'No disponible'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconMail className="mr-2 h-4 w-4" />
                  Email
                </h3>
                <p>{personDetails.email || 'No disponible'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconCake className="mr-2 h-4 w-4" />
                  Cumpleaños
                </h3>
                <p>
                  {personDetails.cumpleanio ? (
                    format(parseISO(personDetails.cumpleanio), "PP", { locale: es })
                  ) : 'No disponible'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconBrandInstagram className="mr-2 h-4 w-4" />
                  Instagram
                </h3>
                <p>{personDetails.instagram || 'No disponible'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  Ubicación
                </h3>
                <p>
                  {[personDetails.direccion, personDetails.ciudad, personDetails.pais]
                    .filter(Boolean)
                    .join(', ') || 'No disponible'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconBuilding className="mr-2 h-4 w-4" />
                  Cliente Asociado
                </h3>
                {personDetails.cliente ? (
                  <div>
                    <p className="font-medium">{personDetails.cliente.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {personDetails.tipo_persona || 'Tipo de relación no especificado'}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No asociado a ningún cliente</p>
                )}
              </div>
              
              <div className="col-span-2">
                <h3 className="font-semibold flex items-center mb-1">
                  <IconNotes className="mr-2 h-4 w-4" />
                  Comentarios
                </h3>
                <p className="whitespace-pre-wrap">{personDetails.comentario || 'Sin comentarios'}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconCalendarTime className="mr-2 h-4 w-4" />
                  Creado
                </h3>
                <p>{format(parseISO(personDetails.created), "PPpp", { locale: es })}</p>
              </div>
              
              <div>
                <h3 className="font-semibold flex items-center mb-1">
                  <IconCalendarTime className="mr-2 h-4 w-4" />
                  Última actualización
                </h3>
                <p>{format(parseISO(personDetails.updated), "PPpp", { locale: es })}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewDetailsOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 