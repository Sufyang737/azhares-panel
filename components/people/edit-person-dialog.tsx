"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { personaSchema } from "./people-data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Persona = z.infer<typeof personaSchema>

// Tipos de persona disponibles
const tiposPersona = [
  { value: "Cliente Principal", label: "Cliente Principal" },
  { value: "Padre", label: "Padre" },
  { value: "Madre", label: "Madre" },
  { value: "Hijo", label: "Hijo" },
  { value: "Hija", label: "Hija" },
  { value: "Familiar", label: "Familiar" },
  { value: "Otro", label: "Otro" },
]

// El esquema de validación para el formulario
const formSchema = z.object({
  id: z.string(),
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  apellido: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email({ message: "Email inválido" }).optional().nullable(),
  cumpleanio: z.date().optional().nullable(),
  pais: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  comentario: z.string().optional().nullable(),
  tipo_persona: z.string(),
})

interface Cliente {
  id: string;
  nombre: string;
}

interface EditPersonDialogProps {
  person: Persona
  open: boolean
  onOpenChange: (open: boolean) => void
  onPersonUpdated: (updatedPerson: Persona) => void
}

export function EditPersonDialog({
  person,
  open,
  onOpenChange,
  onPersonUpdated,
}: EditPersonDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Convertir fecha de cumpleaños para el formulario
  const getBirthdate = () => {
    if (!person.cumpleanio) return undefined
    try {
      return parseISO(person.cumpleanio)
    } catch (e) {
      console.error("Error parseando fecha:", e)
      return undefined
    }
  }

  // Inicializar el formulario con los valores actuales
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: person.id,
      nombre: person.nombre,
      apellido: person.apellido || "",
      telefono: person.telefono?.toString() || "",
      email: person.email || "",
      cumpleanio: getBirthdate(),
      pais: person.pais || "",
      ciudad: person.ciudad || "",
      instagram: person.instagram || "",
      direccion: person.direccion || "",
      comentario: person.comentario || "",
      tipo_persona: person.tipo_persona || "none",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Preparar objeto para actualizar
      const updateData = {
        id: values.id,
        nombre: values.nombre,
        apellido: values.apellido || null,
        telefono: values.telefono || null,
        email: values.email || null,
        cumpleanio: values.cumpleanio ? format(values.cumpleanio, 'yyyy-MM-dd') : null,
        pais: values.pais || null,
        ciudad: values.ciudad || null,
        instagram: values.instagram || null,
        direccion: values.direccion || null,
        comentario: values.comentario || null,
        tipo_persona: values.tipo_persona === "none" ? null : values.tipo_persona,
      }

      console.log('Enviando datos:', updateData);

      const response = await fetch(`/api/personas`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()
      console.log('Respuesta del servidor:', result);

      if (result.success) {
        toast.success('Persona actualizada correctamente')
        onPersonUpdated(result.data)
        onOpenChange(false)
      } else {
        toast.error(`Error al actualizar: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error actualizando persona:', error)
      toast.error('Error de conexión al actualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Persona</DialogTitle>
          <DialogDescription>
            Actualiza la información de la persona. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Persona</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            {field.value === "none" ? "Ninguno" : field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposPersona.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cumpleanio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de cumpleaños</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PP", { locale: es })
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 