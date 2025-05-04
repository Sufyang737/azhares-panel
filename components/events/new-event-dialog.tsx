"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Schema para validar el formulario
const formSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  fecha: z.date({
    required_error: "La fecha es requerida",
  }),
  hora: z.string().min(1, "La hora es requerida"),
  tipo: z.string().min(1, "El tipo es requerido"),
  cliente_id: z.string().optional(),
  planner_id: z.string().optional(),
  lugar: z.string().min(1, "El lugar es requerido"),
  descripcion: z.string().optional(),
  estado: z.string().min(1, "El estado es requerido"),
  cliente_nuevo: z.boolean().optional(),
  cliente_nombre: z.string().optional(),
  cliente_email: z.string().email("Email inválido").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventCreated: () => void
}

export function NewEventDialog({ open, onOpenChange, onEventCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([])
  const [planners, setPlanners] = useState<Array<{ id: string; nombre: string }>>([])
  const [isNewClient, setIsNewClient] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      fecha: new Date(),
      hora: "12:00",
      tipo: "",
      lugar: "",
      descripcion: "",
      estado: "en-curso",
      cliente_nuevo: false,
    },
  })

  // Cargar clientes y planners al abrir el diálogo
  useEffect(() => {
    if (open) {
      fetchClientes()
      fetchPlanners()
    }
  }, [open])

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes/frequent")
      if (!response.ok) throw new Error("Error al cargar clientes")
      const data = await response.json()
      if (data.success) {
        setClientes(data.clientes || [])
      }
    } catch (error) {
      console.error("Error fetching clientes:", error)
      toast.error("Error al cargar la lista de clientes")
    }
  }

  const fetchPlanners = async () => {
    try {
      const response = await fetch("/api/usuarios/planners")
      if (!response.ok) throw new Error("Error al cargar planners")
      const data = await response.json()
      if (data.success) {
        setPlanners(data.planners || [])
      }
    } catch (error) {
      console.error("Error fetching planners:", error)
      toast.error("Error al cargar la lista de planners")
    }
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      // Crear FormData con los valores
      const formData = new FormData()
      formData.append("nombre", values.nombre)
      formData.append("fecha", values.fecha.toISOString())
      formData.append("hora", values.hora)
      formData.append("tipo", values.tipo)
      formData.append("lugar", values.lugar)
      if (values.descripcion) {
        formData.append("descripcion", values.descripcion)
      }
      formData.append("estado", values.estado)

      // Agregar cliente_id o datos de nuevo cliente
      if (values.cliente_nuevo) {
        formData.append("cliente_nuevo", "true")
        formData.append("cliente_nombre", values.cliente_nombre || "")
        formData.append("cliente_email", values.cliente_email || "")
      } else if (values.cliente_id) {
        formData.append("cliente_id", values.cliente_id)
      }

      // Agregar planner_id si está seleccionado
      if (values.planner_id) {
        formData.append("planner_id", values.planner_id)
      }

      const response = await fetch("/api/eventos", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al crear el evento")
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success("Evento creado exitosamente")
        form.reset()
        onEventCreated()
        onOpenChange(false)
      } else {
        throw new Error(result.error || "Error al crear el evento")
      }
    } catch (error) {
      console.error("Error creating event:", error)
      toast.error("Error al crear el evento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Complete los detalles del evento. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
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
                            <span>Seleccione una fecha</span>
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
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Casamiento">Casamiento</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Aniversario">Aniversario</SelectItem>
                      <SelectItem value="Cumpleaños">Cumpleaños</SelectItem>
                      <SelectItem value="Egresados">Egresados</SelectItem>
                      <SelectItem value="Festejo">Festejo</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cliente_nuevo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={isNewClient}
                      onChange={(e) => {
                        setIsNewClient(e.target.checked)
                        field.onChange(e.target.checked)
                      }}
                      className="accent-primary"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Cliente nuevo</FormLabel>
                </FormItem>
              )}
            />

            {isNewClient ? (
              <>
                <FormField
                  control={form.control}
                  name="cliente_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del cliente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email del cliente</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente existente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            )}

            <FormField
              control={form.control}
              name="planner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planner</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar planner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {planners.map((planner) => (
                        <SelectItem key={planner.id} value={planner.id}>
                          {planner.nombre}
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
              name="lugar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lugar *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ubicación del evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles adicionales del evento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Evento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 