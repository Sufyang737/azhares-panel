"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { 
  IconCalendar, 
  IconCoins, 
  IconCash, 
  IconBuildingBank,
  IconX,
  IconTrash
} from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Contabilidad } from "@/app/dashboard/contabilidad/page"

const formSchema = z.object({
  id: z.string(),
  type: z.enum(["cobro", "pago"]),
  categoria: z.string().min(1, "La categoría es requerida"),
  subcargo: z.string().optional(),
  detalle: z.string().optional(),
  especie: z.enum(["efectivo", "transferencia", "otro"]),
  comentario: z.string().optional(),
  moneda: z.enum(["usd", "ars"]),
  montoEspera: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  fechaEspera: z.date(),
  fechaEfectuado: z.date().optional().nullable(),
  efectuado: z.boolean().default(false),
  cliente_id: z.string().optional(),
  proveedor_id: z.string().optional(),
  evento_id: z.string().optional(),
  equipo_id: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Export the FormValues type for use in other components
export type { FormValues };

interface EditContabilidadDialogProps {
  registro: Contabilidad | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: FormValues) => void
  onDelete: (id: string) => void
}

export function EditContabilidadDialog({
  registro,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EditContabilidadDialogProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dolarBlue, setDolarBlue] = useState<{ compra: number, venta: number } | null>(null)
  const [dolarLoading, setDolarLoading] = useState(false)
  
  // Estados para almacenar los datos de vínculos
  const [clientes, setClientes] = useState<{id: string, nombre: string}[]>([])
  const [proveedores, setProveedores] = useState<{id: string, nombre: string}[]>([])
  const [eventos, setEventos] = useState<{id: string, nombre: string}[]>([])
  const [equipos, setEquipos] = useState<{id: string, nombre: string}[]>([])
  
  // Estados para almacenar categorías y subcategorías
  const [categorias, setCategorias] = useState<string[]>([])
  const [subcargos] = useState<string[]>(["clientes", "otros", "proveedores", "sueldos"])
  const [detalles] = useState<string[]>(["comision", "handy", "honorarios", "maquillaje", "planner", "staff", "viandas"])
  
  // Estado para manejar la carga de datos
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      type: "cobro",
      categoria: "",
      subcargo: "",
      detalle: "",
      especie: "efectivo",
      comentario: "",
      moneda: "usd",
      montoEspera: 0,
      fechaEspera: new Date(),
      fechaEfectuado: null,
      efectuado: false,
      cliente_id: "",
      proveedor_id: "",
      evento_id: "",
      equipo_id: "",
      created: "",
      updated: "",
    },
  })

  useEffect(() => {
    if (registro && open) {
      // Convertir fechas a objetos Date
      const fechaEspera = registro.fechaEspera ? new Date(registro.fechaEspera) : new Date()
      const fechaEfectuado = registro.fechaEfectuado ? new Date(registro.fechaEfectuado) : null
      
      form.reset({
        ...registro,
        fechaEspera,
        fechaEfectuado,
        efectuado: !!registro.fechaEfectuado,
      })
    }
  }, [registro, open, form])

  // Cargar la cotización del dólar blue y datos relacionados al abrir el diálogo
  useEffect(() => {
    if (open && registro) {
      // Cargar cotización del dólar
      const fetchDolarBlue = async () => {
        setDolarLoading(true)
        try {
          const response = await fetch('https://dolarapi.com/v1/dolares/blue')
          if (response.ok) {
            const data = await response.json()
            setDolarBlue({
              compra: data.compra,
              venta: data.venta
            })
          } else {
            console.error('Error al obtener cotización del dólar blue')
            toast.error('No se pudo obtener la cotización del dólar')
          }
        } catch (error) {
          console.error('Error al obtener cotización:', error)
        } finally {
          setDolarLoading(false)
        }
      }
      
      // Cargar categorías desde la API
      const fetchCategorias = async () => {
        try {
          const response = await fetch('/api/contabilidad/categorias')
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data) && data.length > 0) {
              setCategorias(data)
            } else {
              // Si no hay categorías, usar valores predeterminados
              setCategorias(["evento", "oficina"])
            }
          } else {
            console.error('Error al obtener categorías')
            toast.error('No se pudieron cargar las categorías')
            // Usar valores predeterminados
            setCategorias(["evento", "oficina"])
          }
        } catch (error) {
          console.error('Error al obtener categorías:', error)
          // Usar valores predeterminados
          setCategorias(["evento", "oficina"])
        }
      }
      
      // Cargar datos de clientes, proveedores, eventos y equipos
      const fetchRelatedData = async () => {
        setIsLoadingData(true)
        try {
          // Cargar clientes
          const clientesResponse = await fetch('/api/clientes')
          if (clientesResponse.ok) {
            const data = await clientesResponse.json()
            setClientes(data.items || [])
          }

          // Cargar proveedores
          const proveedoresResponse = await fetch('/api/proveedores')
          if (proveedoresResponse.ok) {
            const data = await proveedoresResponse.json()
            setProveedores(data.items || [])
          }

          // Cargar eventos
          const eventosResponse = await fetch('/api/eventos')
          if (eventosResponse.ok) {
            const data = await eventosResponse.json()
            setEventos(data.items || [])
          }

          // Cargar equipos
          const equiposResponse = await fetch('/api/equipos')
          if (equiposResponse.ok) {
            const data = await equiposResponse.json()
            setEquipos(data.items || [])
          }

          // Cargar categorías
          fetchCategorias()
        } catch (error) {
          console.error('Error al cargar datos relacionados:', error)
          toast.error('Error al cargar algunos datos relacionados')
        } finally {
          setIsLoadingData(false)
        }
      }
      
      fetchDolarBlue()
      fetchRelatedData()
    }
  }, [open, registro])

  const tipoCambio = React.useMemo(() => {
    return {
      ars: dolarBlue ? (form.watch("type") === "cobro" ? 1/dolarBlue.compra : 1/dolarBlue.venta) : 0.0011,
      usd: 1
    }
  }, [dolarBlue, form.watch("type")])

  // Observar cambios en los campos para mostrar dólares
  const watchMoneda = form.watch("moneda")
  const watchMonto = form.watch("montoEspera")
  const efectuado = form.watch("efectuado")

  // Calcular el monto en dólares según la moneda seleccionada
  const montoDolares = watchMonto ? (watchMonto * tipoCambio[watchMoneda as keyof typeof tipoCambio]) : 0

  // Función para manejar el envío del formulario
  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);
      
      // Si está efectuado, asegurarse de que tenga fecha de efectuado
      if (values.efectuado && !values.fechaEfectuado) {
        values.fechaEfectuado = new Date();
      }
      
      // Si no está efectuado, eliminar la fecha de efectuado
      if (!values.efectuado) {
        values.fechaEfectuado = null;
      }
      
      // Convertir valores "none" a null para las relaciones y asegurar que los IDs sean strings válidos
      const formattedValues = {
        ...values,
        dolarEsperado: montoDolares,
        // Asegurar que los IDs sean null si no hay selección
        cliente_id: values.cliente_id === "none" ? null : values.cliente_id,
        proveedor_id: values.proveedor_id === "none" ? null : values.proveedor_id,
        evento_id: values.evento_id === "none" ? null : values.evento_id,
        equipo_id: values.equipo_id === "none" ? null : values.equipo_id,
        // Asegurar que los campos opcionales sean null si están vacíos
        subcargo: values.subcargo || null,
        detalle: values.detalle || null,
        comentario: values.comentario || null,
        // Asegurar que las fechas estén en el formato correcto
        fechaEspera: values.fechaEspera.toISOString(),
        fechaEfectuado: values.fechaEfectuado ? values.fechaEfectuado.toISOString() : null,
      };
      
      // Preparar FormData para enviar a la API
      const formData = new FormData();
      
      // Agregar solo los campos que no son null
      Object.entries(formattedValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });
      
      console.log("Enviando datos a API:", Object.fromEntries(formData.entries()));
      
      // Enviar datos a la API
      const response = await fetch(`/api/contabilidad${values.id ? `?id=${values.id}` : ''}`, {
        method: values.id ? 'PUT' : 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error(`Error al actualizar registro: ${errorData.error || response.statusText}`);
      }
      
      // Obtener los datos del registro actualizado
      const updatedRegistro = await response.json();
      console.log("Registro actualizado:", updatedRegistro);
      
      // Notificar al componente padre con el registro actualizado
      if (onSave) {
        onSave(formattedValues);
      }
      
      toast.success("Registro actualizado correctamente");
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar el registro:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar el registro");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (registro?.id) {
      try {
        setIsDeleting(true);
        
        // Enviar solicitud de eliminación a la API
        const response = await fetch(`/api/contabilidad?id=${registro.id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error del servidor:", errorData);
          throw new Error(`Error al eliminar registro: ${errorData.error || response.statusText}`);
        }
        
        // Notificar al componente padre
        if (onDelete) {
          onDelete(registro.id);
        }
        
        setShowDeleteAlert(false);
        onOpenChange(false);
        toast.success("Registro eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el registro:", error);
        toast.error(error instanceof Error ? error.message : "Error al eliminar el registro");
      } finally {
        setIsDeleting(false);
      }
    }
  }

  // No mostrar nada si no hay un registro seleccionado
  if (!registro) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro Contable</DialogTitle>
            <DialogDescription>
              Modificar los datos del registro contable. 
              Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Tipo de Operación *</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cobro" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-1">
                              <IconCoins className="h-4 w-4 text-green-500" /> Cobro
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pago" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-1">
                              <IconCash className="h-4 w-4 text-red-500" /> Pago
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          disabled={isLoadingData}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingData ? (
                              <SelectItem value="loading">Cargando categorías...</SelectItem>
                            ) : (
                              categorias.map((categoria) => (
                                <SelectItem key={categoria} value={categoria}>
                                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Clasifica el movimiento según su categoría principal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcargo</FormLabel>
                        <Select
                          disabled={isLoadingData}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un subcargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcargos.map((subcargo) => (
                              <SelectItem key={subcargo} value={subcargo}>
                                {subcargo.charAt(0).toUpperCase() + subcargo.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="detalle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalle</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un detalle" />
                          </SelectTrigger>
                          <SelectContent>
                            {detalles.map((detalle) => (
                              <SelectItem key={detalle} value={detalle}>
                                {detalle.charAt(0).toUpperCase() + detalle.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="especie"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Forma de Pago *</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="efectivo" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-1">
                              <IconCash className="h-4 w-4" /> Efectivo
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="transferencia" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-1">
                              <IconBuildingBank className="h-4 w-4" /> Transferencia
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="otro" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Otro</FormLabel>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="comentario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comentario</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre la transacción..."
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="moneda"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Moneda *</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="usd" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                USD - Dólar
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="ars" />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                ARS - Peso Argentino
                                {dolarBlue && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Compra: ${dolarBlue.compra} / Venta: ${dolarBlue.venta})
                                  </span>
                                )}
                                {dolarLoading && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (Cargando cotización...)
                                  </span>
                                )}
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="montoEspera"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          {watchMonto > 0 && watchMoneda !== 'usd' && dolarBlue && (
                            <FormDescription>
                              ≈ ${montoDolares.toFixed(2)} USD (cotización dólar blue {form.watch("type") === 'cobro' ? 'compra' : 'venta'})
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fechaEspera"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha Esperada *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                type="button"
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                                <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              locale={es}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="efectuado"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Estado del Registro</FormLabel>
                          <FormDescription>
                            {field.value ? "Efectuado (completado)" : "Pendiente (esperado)"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {efectuado && (
                    <FormField
                      control={form.control}
                      name="fechaEfectuado"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Realización</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  type="button"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Hoy (por defecto)</span>
                                  )}
                                  <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-2 flex justify-between items-center border-b">
                                <span className="text-sm font-medium">Fecha de pago/cobro</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => form.setValue("fechaEfectuado", null)}
                                >
                                  <IconX className="h-4 w-4" />
                                </Button>
                              </div>
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Si no se selecciona, se usará la fecha actual
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Separator className="my-2" />
                  
                  <h3 className="text-sm font-medium pb-2">Relaciones (Opcional)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cliente_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select
                            disabled={isLoadingData}
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin cliente</SelectItem>
                              {clientes.map((cliente) => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="proveedor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor</FormLabel>
                          <Select
                            disabled={isLoadingData}
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin proveedor</SelectItem>
                              {proveedores.map((proveedor) => (
                                <SelectItem key={proveedor.id} value={proveedor.id}>
                                  {proveedor.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="evento_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evento</FormLabel>
                          <Select
                            disabled={isLoadingData}
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar evento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin evento</SelectItem>
                              {eventos.map((evento) => (
                                <SelectItem key={evento.id} value={evento.id}>
                                  {evento.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="equipo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipo</FormLabel>
                          <Select
                            disabled={isLoadingData}
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar equipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin equipo</SelectItem>
                              {equipos.map((equipo) => (
                                <SelectItem key={equipo.id} value={equipo.id}>
                                  {equipo.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {registro?.created && (
                    <div className="text-xs text-muted-foreground">
                      <p>ID: {registro.id}</p>
                      <p>Creado: {new Date(registro.created).toLocaleString()}</p>
                      {registro.updated && (
                        <p>Actualizado: {new Date(registro.updated).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={isSubmitting || isDeleting}
                >
                  Eliminar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Eliminar el registro lo quitará permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Eliminando...
                </>
              ) : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 