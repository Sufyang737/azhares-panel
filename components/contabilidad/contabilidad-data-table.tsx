"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconEye,
  IconLoader2,
  IconCoins,
  IconCash,
  IconBuildingBank,
  IconReceipt,
  IconCalendar,
  IconCheck,
  IconClock,
  IconUser,
  IconBuildingStore
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

import { Contabilidad } from "@/app/dashboard/contabilidad/page"

// Función para formatear fechas
const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// Función para formatear montos con moneda
const formatMonto = (monto: number | null, moneda: string) => {
  if (monto === null) return "-";
  
  const simbolo = '$'; // Tanto para USD como para ARS usamos $
  
  // Para formatos específicos según la moneda
  const formateado = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(monto);
  
  // Incluimos el código de moneda junto al símbolo
  return `${simbolo} ${formateado}`;
};

export function ContabilidadDataTable({
  data: initialData,
  loading = false,
  onDelete,
  onEdit,
  onView
}: {
  data: Contabilidad[]
  loading?: boolean
  onDelete?: (registro: Contabilidad) => void
  onEdit?: (registro: Contabilidad) => void
  onView?: (registro: Contabilidad) => void
}) {
  const [data, setData] = React.useState<Contabilidad[]>(initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    id: false,
    detalle: true,
    especie: true,
    moneda: true,
    comentario: true,
    cliente_id: false,
    proveedor_id: false,
    evento_id: false,
    equipo_id: false,
    dolarEsperado: false,
  })
  const [rowSelection, setRowSelection] = React.useState({})

  // Actualizar los datos cuando cambia la prop initialData
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleDeleteRegistro = (registro: Contabilidad) => {
    if (onDelete) {
      onDelete(registro);
    } else {
      console.warn("No se proporcionó una función onDelete");
    }
  }
  
  const handleEditRegistro = (registro: Contabilidad) => {
    if (onEdit) {
      onEdit(registro);
    } else {
      console.warn("No se proporcionó una función onEdit");
    }
  }

  const handleViewDetails = (registro: Contabilidad) => {
    if (onView) {
      onView(registro);
    } else {
      console.warn("No se proporcionó una función onView");
    }
  }

  const columns: ColumnDef<Contabilidad>[] = [
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
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const isCobro = type === "cobro";
        
        return (
          <div className="flex items-center">
            {isCobro ? (
              <IconCoins className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <IconCash className="mr-2 h-4 w-4 text-red-500" />
            )}
            <Badge variant={isCobro ? "success" : "destructive"}>
              {isCobro ? "Cobro" : "Pago"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => {
        const categoria = row.getValue("categoria") as string;
        return (
          <div className="flex items-center">
            <IconReceipt className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{categoria}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "subcargo",
      header: "Subcargo",
      cell: ({ row }) => {
        const subcargo = row.getValue("subcargo") as string;
        return (
          <div className="flex items-center">
            <span className="capitalize">{subcargo}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "detalle",
      header: "Detalle",
      cell: ({ row }) => {
        const detalle = row.getValue("detalle") as string;
        return <span className="capitalize">{detalle}</span>;
      },
    },
    {
      accessorKey: "montoEspera",
      header: "Monto",
      cell: ({ row }) => {
        const monto = row.getValue("montoEspera") as number | null;
        const moneda = row.original.moneda;
        const type = row.original.type;
        
        return (
          <div className={`font-medium ${type === "cobro" ? "text-green-600" : "text-red-600"}`}>
            {formatMonto(monto, moneda)}
            <span className="ml-1 text-xs uppercase">{moneda}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "especie",
      header: "Especie",
      cell: ({ row }) => {
        const especie = row.getValue("especie") as string;
        let icon;
        
        switch (especie) {
          case 'efectivo':
            icon = <IconCash className="mr-2 h-4 w-4 text-muted-foreground" />;
            break;
          case 'transferencia':
            icon = <IconBuildingBank className="mr-2 h-4 w-4 text-muted-foreground" />;
            break;
          default:
            icon = <IconCoins className="mr-2 h-4 w-4 text-muted-foreground" />;
        }
        
        return (
          <div className="flex items-center">
            {icon}
            <span className="capitalize">{especie}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "fechaEspera",
      header: "Fecha Esperada",
      cell: ({ row }) => {
        const fecha = row.getValue("fechaEspera") as string;
        return (
          <div className="flex items-center">
            <IconCalendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formatDate(fecha)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "fechaEfectuado",
      header: "Estado",
      cell: ({ row }) => {
        const fechaEfectuado = row.original.fechaEfectuado;
        
        if (fechaEfectuado) {
          return (
            <div className="flex items-center">
              <IconCheck className="mr-2 h-4 w-4 text-green-500" />
              <span className="text-green-600">Efectuado</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {formatDate(fechaEfectuado)}
              </span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center">
              <IconClock className="mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600">Pendiente</span>
            </div>
          );
        }
      },
    },
    {
      accessorKey: "comentario",
      header: "Comentario",
      cell: ({ row }) => {
        const comentario = row.getValue("comentario") as string | null;
        if (!comentario) return <span className="text-muted-foreground">Sin comentarios</span>;
        
        return (
          <span className="line-clamp-1">{comentario}</span>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const registro = row.original;
        
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
              <DropdownMenuItem onClick={() => handleViewDetails(registro)}>
                <IconEye className="mr-2 h-4 w-4" />
                <span>Ver detalles</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditRegistro(registro)}>
                <IconEdit className="mr-2 h-4 w-4" />
                <span>Editar registro</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteRegistro(registro)}
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
            placeholder="Buscar por categoría/detalle..."
            value={(table.getColumn("categoria")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("categoria")?.setFilterValue(event.target.value)
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
                  const columnId = column.id;
                  
                  // Mapa de nombres de columnas para mostrar
                  const columnNames: {[key: string]: string} = {
                    type: "Tipo",
                    categoria: "Categoría",
                    subcargo: "Subcargo",
                    detalle: "Detalle",
                    montoEspera: "Monto",
                    especie: "Especie",
                    moneda: "Moneda",
                    fechaEspera: "Fecha Esperada",
                    fechaEfectuado: "Estado",
                    comentario: "Comentario",
                  };
                  
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnNames[columnId] || columnId}
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
                    <span>Cargando registros...</span>
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
                  No se encontraron registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} registro(s) seleccionado(s).
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