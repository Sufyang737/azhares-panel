"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { IconCalendar } from "@tabler/icons-react"

// Definición del esquema de validación
const FormSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres",
  }),
  tipo: z.string({
    required_error: "Por favor selecciona un tipo de evento",
  }),
  fecha: z.date().optional(),
  estado: z.string({
    required_error: "Por favor selecciona un estado",
  }),
  comentario: z.string().optional(),
  cliente_id: z.string().optional(),
  planner_id: z.string().optional(),
})

type FormData = z.infer<typeof FormSchema>

interface EditEventFormProps {
  initialData?: FormData
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditEventForm({ initialData, onSuccess, onCancel }: EditEventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      nombre: initialData?.nombre || "",
      tipo: initialData?.tipo || "",
      fecha: initialData?.fecha || undefined,
      estado: initialData?.estado || "en-curso",
      comentario: initialData?.comentario || "",
      cliente_id: initialData?.cliente_id || undefined,
      planner_id: initialData?.planner_id || undefined,
    },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    
    try {
      // Si hay un ID, estamos actualizando un evento existente
      if (data.id) {
        const response = await fetch(`/api/eventos`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al actualizar el evento")
        }
        
        toast.success("Evento actualizado correctamente")
      } else {
        // Caso para crear nuevo evento
        const response = await fetch(`/api/eventos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Error al crear el evento")
        }
        
        toast.success("Evento creado correctamente")
      }
      
      // Refrescar los datos y llamar al callback de éxito
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error al guardar evento:", error)
      toast.error(error instanceof Error ? error.message : "Error al procesar la solicitud")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del evento</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa un nombre descriptivo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de evento</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="aniversario">Aniversario</SelectItem>
                    <SelectItem value="bat-bar">Bat/Bar Mitzvah</SelectItem>
                    <SelectItem value="bautismo">Bautismo</SelectItem>
                    <SelectItem value="casamiento">Casamiento</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="comunion">Comunión</SelectItem>
                    <SelectItem value="corporativo">Corporativo</SelectItem>
                    <SelectItem value="cumpleanos">Cumpleaños</SelectItem>
                    <SelectItem value="egresados">Egresados</SelectItem>
                    <SelectItem value="en-casa">En Casa</SelectItem>
                    <SelectItem value="festejo">Festejo</SelectItem>
                    <SelectItem value="fiesta15">15 Años</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha del evento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
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
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01")}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Estado del evento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-8">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="en-curso" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        En curso
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="finalizado" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Finalizado
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="cancelado" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Cancelado
                      </FormLabel>
                    </FormItem>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="comentario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios adicionales</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agrega cualquier información adicional sobre el evento"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Puedes incluir detalles específicos, requisitos o notas para el equipo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 