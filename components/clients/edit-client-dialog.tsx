"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { clientSchema } from "./clients-data-table"

// Esquema para el formulario de edición
const formSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
  contacto: z.string().min(1, { message: "El contacto es obligatorio" }),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  comentarios: z.string().optional().or(z.literal("")),
  estado: z.string().default("Activo"),
})

type Client = z.infer<typeof clientSchema>

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onClientUpdated?: () => void
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
  onClientUpdated
}: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: client?.id || "",
      nombre: client?.nombre || "",
      contacto: client?.contacto || "",
      email: client?.email || "",
      telefono: client?.telefono || "",
      direccion: client?.direccion || "",
      comentarios: client?.comentarios || "",
      estado: client?.estado || "Activo",
    },
  })

  // Actualizar el formulario cuando cambie el cliente
  React.useEffect(() => {
    if (client) {
      form.reset({
        id: client.id,
        nombre: client.nombre,
        contacto: client.contacto || "",
        email: client.email || "",
        telefono: client.telefono || "",
        direccion: client.direccion || "",
        comentarios: client.comentarios || "",
        estado: client.estado || "Activo",
      })
    }
  }, [client, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!client) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/clientes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el cliente")
      }

      toast.success(`Cliente "${values.nombre}" actualizado correctamente`)
      onOpenChange(false)
      
      // Notificar que el cliente ha sido actualizado
      if (onClientUpdated) {
        onClientUpdated()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el cliente"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Actualice la información del cliente. Haga clic en guardar cuando termine.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nombre de la persona de contacto" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="email@ejemplo.com" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+54 9 11 1234-5678" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Activo/Inactivo" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Dirección completa" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comentarios"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comentarios adicionales" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 