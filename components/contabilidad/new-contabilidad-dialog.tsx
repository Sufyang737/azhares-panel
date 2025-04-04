"use client"

import * as React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CalendarIcon } from "@radix-ui/react-icons"
import { IconCash, IconCheck, IconCreditCard, IconReceipt } from "@tabler/icons-react"
import { useClientes, useProveedores, useEventos, useEquipos } from "@/hooks/use-relations"
import { useDolarBlue } from "@/hooks/use-dolar-blue"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Contabilidad } from "@/app/dashboard/contabilidad/page"

const formSchema = z.object({
  type: z.enum(["cobro", "pago"]),
  categoria: z.enum(["evento", "oficina"], {
    required_error: "Categoría requerida",
    invalid_type_error: "Seleccione una categoría válida"
  }),
  subcargo: z.enum(["clientes", "otros", "proveedores", "sueldos"], {
    required_error: "Subcargo requerido",
    invalid_type_error: "Seleccione un subcargo válido"
  }),
  detalle: z.enum(["comision", "handy", "honorarios", "maquillaje", "planner", "staff", "viandas"], {
    required_error: "Detalle requerido",
    invalid_type_error: "Seleccione un detalle válido"
  }),
  especie: z.enum(["efectivo", "transferencia", "otro"]),
  comentario: z.string().optional().nullable(),
  moneda: z.enum(["usd", "ars"]),
  montoEspera: z.coerce.number().positive({ message: "Monto debe ser mayor a 0" }),
  fechaEspera: z.date(),
  fechaEfectuado: z.date().nullable(),
  efectuado: z.boolean().default(false),
  cliente_id: z.string().nullable().default(null),
  proveedor_id: z.string().nullable().default(null),
  evento_id: z.string().nullable().default(null),
  equipo_id: z.string().nullable().default(null),
  dolarEsperado: z.number().nullable().default(null),
})

type FormValues = z.infer<typeof formSchema>

interface NewContabilidadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistroCreated?: (registro: Contabilidad) => void
}

export function NewContabilidadDialog({
  open,
  onOpenChange,
  onRegistroCreated,
}: NewContabilidadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { dolarBlue, loading: dolarLoading } = useDolarBlue()
  
  // Cargar datos relacionados
  const { data: clientes, loading: clientesLoading } = useClientes()
  const { data: proveedores, loading: proveedoresLoading } = useProveedores()
  const { data: eventos, loading: eventosLoading } = useEventos()
  const { data: equipos, loading: equiposLoading } = useEquipos()
  
  const isLoadingData = dolarLoading || clientesLoading || proveedoresLoading || eventosLoading || equiposLoading

  // Valores exactos según PocketBase - no modificar
  const categorias = ["evento", "oficina"];
  const subcargos = ["clientes", "otros", "proveedores", "sueldos"];
  const detalles = ["comision", "handy", "honorarios", "maquillaje", "planner", "staff", "viandas"]; 
  
  // Mapeo para nombres más legibles en la interfaz
  const categoriasLabel: Record<string, string> = {
    "evento": "Evento",
    "oficina": "Oficina"
  };
  
  const subcargosLabel: Record<string, string> = {
    "clientes": "Clientes",
    "otros": "Otros",
    "proveedores": "Proveedores", 
    "sueldos": "Sueldos"
  };
  
  const detallesLabel: Record<string, string> = {
    "comision": "Comisión",
    "handy": "Handy",
    "honorarios": "Honorarios",
    "maquillaje": "Maquillaje",
    "planner": "Planner",
    "staff": "Staff",
    "viandas": "Viandas"
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "cobro",
      categoria: "evento",
      subcargo: "clientes",
      detalle: "comision",
      especie: "efectivo",
      comentario: "",
      moneda: "usd",
      montoEspera: 0,
      fechaEspera: new Date(),
      fechaEfectuado: null,
      efectuado: false,
      cliente_id: null,
      proveedor_id: null,
      evento_id: null,
      equipo_id: null,
      dolarEsperado: null,
    },
  })

  const tipoCambio = React.useMemo(() => {
    return {
      ars: dolarBlue ? (form.watch("type") === "cobro" ? 1/dolarBlue.compra : 1/dolarBlue.venta) : 0.0011,
      usd: 1
    }
  }, [dolarBlue, form.watch("type")])

  const watchMoneda = form.watch("moneda")
  const watchMonto = form.watch("montoEspera")
  const watchTipo = form.watch("type")
  const montoDolares = watchMonto ? (watchMonto * tipoCambio[watchMoneda as keyof typeof tipoCambio]) : 0

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      
      // Preparar los datos para enviar a la API
      const formData = new FormData()
      
      // Formatear los datos según la estructura esperada por la API
      const formattedValues = {
        ...values,
        // Convertir fechas a formato ISO
        fechaEspera: values.fechaEspera instanceof Date 
          ? values.fechaEspera.toISOString() 
          : values.fechaEspera,
        fechaEfectuado: values.fechaEfectuado instanceof Date 
          ? values.fechaEfectuado.toISOString() 
          : null,
        // Calcular dolarEsperado
        dolarEsperado: montoDolares,
        // Manejar IDs de relaciones
        cliente_id: values.cliente_id === "ninguno" ? null : values.cliente_id,
        proveedor_id: values.proveedor_id === "ninguno" ? null : values.proveedor_id,
        evento_id: values.evento_id === "ninguno" ? null : values.evento_id,
        equipo_id: values.equipo_id === "ninguno" ? null : values.equipo_id,
        // Asegurar que los campos numéricos sean números
        montoEspera: Number(values.montoEspera),
      }
      
      // Agregar todos los campos al FormData, excluyendo los nulos
      Object.entries(formattedValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, String(value))
        }
      })
      
      // Enviar datos a la API
      const response = await fetch('/api/contabilidad', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el registro')
      }
      
      const newRegistro = await response.json()
      
      if (onRegistroCreated) {
        onRegistroCreated(newRegistro)
      }
      
      toast.success('Registro creado correctamente')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error al crear el registro:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el registro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Nuevo Registro Contable</DialogTitle>
          <DialogDescription>
            Crear un nuevo registro de {watchTipo === 'cobro' ? 'ingreso' : 'gasto'}.
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cobro" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            <IconReceipt className="inline-block w-4 h-4 mr-1 text-green-500" />
                            Cobro
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pago" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            <IconReceipt className="inline-block w-4 h-4 mr-1 text-red-500" />
                            Pago
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria} value={categoria}>
                              {categoriasLabel[categoria] || categoria}
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
                  name="subcargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcargo *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar subcargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {subcargos.map((subcargo) => (
                            <SelectItem key={subcargo} value={subcargo}>
                              {subcargosLabel[subcargo] || subcargo}
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
                      <FormLabel>Detalle *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar detalle" />
                        </SelectTrigger>
                        <SelectContent>
                          {detalles.map((detalle) => (
                            <SelectItem key={detalle} value={detalle}>
                              {detallesLabel[detalle] || detalle}
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
                    <FormItem>
                      <FormLabel>Forma de Pago *</FormLabel>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="efectivo" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            <IconCash className="inline-block w-4 h-4 mr-1" />
                            Efectivo
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="transferencia" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            <IconCreditCard className="inline-block w-4 h-4 mr-1" />
                            Transferencia
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="otro" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Otro
                          </FormLabel>
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
                          placeholder="Notas adicionales..."
                          className="resize-none"
                          {...field}
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
                      <FormItem>
                        <FormLabel>Moneda *</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                              ARS - Peso
                              {dolarBlue && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (Compra: ${dolarBlue.compra} / Venta: ${dolarBlue.venta})
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
                        {watchMonto > 0 && watchMoneda === 'ars' && dolarBlue && (
                          <FormDescription>
                            ≈ ${montoDolares.toFixed(2)} USD
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
                      <FormLabel>Fecha *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select
                          disabled={isLoadingData}
                          onValueChange={field.onChange}
                          value={field.value || "ninguno"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno">Ninguno</SelectItem>
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
                          value={field.value || "ninguno"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno">Ninguno</SelectItem>
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

                  <FormField
                    control={form.control}
                    name="evento_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evento</FormLabel>
                        <Select
                          disabled={isLoadingData}
                          onValueChange={field.onChange}
                          value={field.value || "ninguno"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar evento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno">Ninguno</SelectItem>
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
                          value={field.value || "ninguno"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar equipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ninguno">Ninguno</SelectItem>
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
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "min-w-[150px]",
                  watchTipo === 'cobro' ? "bg-green-600 hover:bg-green-700" : ""
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </div>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-4 w-4" />
                    {watchTipo === 'cobro' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}