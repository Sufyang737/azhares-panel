"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconWorldWww,
  IconPercentage,
  IconBrandInstagram,
  IconBuildingStore,
  IconId,
  IconLoader2,
  IconTags
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

// Define schema para datos de proveedores desde la API
export const proveedorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  alias: z.string().nullable().optional(),
  contacto: z.string().nullable().optional(),
  telefono: z.number().nullable().optional().or(z.string().nullable().optional()),
  email: z.string().email().nullable().optional(),
  pais: z.string().nullable().optional(),
  web: z.string().url().nullable().optional(),
  instagram: z.string().url().nullable().optional(),
  direccion: z.string().nullable().optional(),
  comision: z.number().nullable().optional().or(z.string().nullable().optional()),
  categoria: z.string().nullable().optional(),
  created: z.string(),
  updated: z.string()
})

type Proveedor = z.infer<typeof proveedorSchema>

// Función para capitalizar la primera letra
const capitalizeFirstLetter = (string: string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Mapa para nombres de países especiales
const NOMBRES_PAISES: Record<string, string> = {
  'espana': 'España',
  'usa': 'Estados Unidos',
};

// Función para formatear el nombre del país
const formatearPais = (codigo: string) => {
  if (!codigo) return '';
  return NOMBRES_PAISES[codigo] || capitalizeFirstLetter(codigo);
}

export function ProveedoresDataTable({
  data: initialData,
  loading = false,
  onDelete,
  onEdit,
  onView
}: {
  data: Proveedor[]
  loading?: boolean
  onDelete?: (proveedor: Proveedor) => void
  onEdit?: (proveedor: Proveedor) => void
  onView?: (proveedor: Proveedor) => void
}) {
  const [data, setData] = React.useState<Proveedor[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    telefono: true,
    email: true,
    alias: true,
    contacto: true,
    pais: true,
    web: true,
    instagram: true,
    direccion: true,
    comision: true,
    categoria: true,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Actualizar los datos cuando cambia la prop initialData
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleDeleteProveedor = (proveedor: Proveedor) => {
    if (onDelete) {
      onDelete(proveedor);
    } else {
      console.warn("No se proporcionó una función onDelete");
    }
  }
  
  const handleEditProveedor = (proveedor: Proveedor) => {
    if (onEdit) {
      onEdit(proveedor);
    } else {
      console.warn("No se proporcionó una función onEdit");
    }
  }

  const handleViewDetails = (proveedor: Proveedor) => {
    if (onView) {
      onView(proveedor);
    } else {
      console.warn("No se proporcionó una función onView");
    }
  }

  const columns: ColumnDef<Proveedor>[] = [
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
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center">
          <IconBuildingStore className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("nombre")}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "alias",
      header: "Alias",
      cell: ({ row }) => {
        const alias = row.getValue("alias") as string | null;
        if (!alias) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconId className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{alias}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => {
        const contacto = row.getValue("contacto") as string | null;
        if (!contacto) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconUser className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{contacto}</span>
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
      accessorKey: "pais",
      header: "País",
      cell: ({ row }) => {
        const pais = row.getValue("pais") as string | null;
        if (!pais) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconMapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formatearPais(pais)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "web",
      header: "Web",
      cell: ({ row }) => {
        const web = row.getValue("web") as string | null;
        if (!web) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconWorldWww className="mr-2 h-4 w-4 text-muted-foreground" />
            <a 
              href={web} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {web}
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: "instagram",
      header: "Instagram",
      cell: ({ row }) => {
        const instagram = row.getValue("instagram") as string | null;
        if (!instagram) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconBrandInstagram className="mr-2 h-4 w-4 text-muted-foreground" />
            <a 
              href={instagram} 
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
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => {
        const direccion = row.getValue("direccion") as string | null;
        if (!direccion) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconMapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{direccion}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "comision",
      header: "Comisión",
      cell: ({ row }) => {
        const comision = row.getValue("comision") as number | string | null;
        if (comision === null || comision === undefined) 
          return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconPercentage className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{comision.toString()}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => {
        const categoria = row.getValue("categoria") as string | null;
        if (!categoria) return <div className="text-muted-foreground">No disponible</div>;
        
        return (
          <div className="flex items-center">
            <IconTags className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{categoria}</span>
          </div>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const proveedor = row.original;
        
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
              <DropdownMenuItem onClick={() => handleViewDetails(proveedor)}>
                <IconUser className="mr-2 h-4 w-4" />
                <span>Ver detalles</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditProveedor(proveedor)}>
                <IconEdit className="mr-2 h-4 w-4" />
                <span>Editar proveedor</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteProveedor(proveedor)}
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
            value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("nombre")?.setFilterValue(event.target.value)
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
                      {column.id === "nombre" 
                        ? "Nombre" 
                        : column.id === "alias" 
                        ? "Alias"
                        : column.id === "contacto"
                        ? "Contacto"
                        : column.id === "email"
                        ? "Email"
                        : column.id === "telefono"
                        ? "Teléfono"
                        : column.id === "pais"
                        ? "País"
                        : column.id === "web"
                        ? "Web"
                        : column.id === "instagram"
                        ? "Instagram"
                        : column.id === "direccion"
                        ? "Dirección"
                        : column.id === "comision"
                        ? "Comisión"
                        : column.id === "categoria"
                        ? "Categoría"
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <IconLoader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Cargando proveedores...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  No se encontraron proveedores.
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