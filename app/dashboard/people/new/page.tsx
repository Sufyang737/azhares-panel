"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconArrowLeft, IconDeviceFloppy, IconUserPlus } from "@tabler/icons-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  tipo_persona: z.string().optional().nullable(),
  cliente_id: z.string().optional().nullable(),
})

interface Cliente {
  id: string;
  nombre: string;
}

type FormValues = z.infer<typeof formSchema>

export default function NewPersonPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Cargar lista de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      setLoadingClientes(true)
      try {
        const response = await fetch('/api/clientes?page=1&perPage=100')
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            setClientes(data.data.map((cliente: any) => ({
              id: cliente.id,
              nombre: cliente.nombre
            })))
          }
        }
      } catch (error) {
        console.error('Error cargando clientes:', error)
      } finally {
        setLoadingClientes(false)
      }
    }
    
    fetchClientes()
  }, [])

  // Inicializar el formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      cumpleanio: undefined,
      pais: "",
      ciudad: "",
      instagram: "",
      direccion: "",
      comentario: "",
      tipo_persona: "",
      cliente_id: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Preparar objeto para crear
      const personaData = {
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
        tipo_persona: values.tipo_persona || null,
        cliente_id: values.cliente_id || null,
      }

      const response = await fetch(`/api/personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Persona creada correctamente')
        // Redirigir a la lista de personas
        router.push('/dashboard/people')
      } else {
        toast.error(`Error al crear persona: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error creando persona:', error)
      toast.error('Error de conexión al crear persona')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col flex-1">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link href="/dashboard/people">
                  <IconArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Nueva Persona</h1>
                <p className="text-sm text-muted-foreground">
                  Crear una nueva persona en el sistema
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Introduce los datos de la persona. Solo el nombre es obligatorio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre" {...field} />
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
                              <Input placeholder="Apellido" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tipo_persona"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Persona</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
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
                        name="cliente_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente Asociado</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingClientes ? "Cargando..." : "Seleccionar cliente"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
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
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="correo@ejemplo.com" {...field} value={field.value || ""} />
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
                              <Input placeholder="+34 600 123 456" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input placeholder="@usuario" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="ciudad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ciudad</FormLabel>
                            <FormControl>
                              <Input placeholder="Ciudad" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input placeholder="País" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="direccion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input placeholder="Calle, número, código postal..." {...field} value={field.value || ""} />
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
                          <FormLabel>Comentarios</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Añade información adicional aquí..."
                              {...field}
                              value={field.value || ""}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 justify-end">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => router.push('/dashboard/people')}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          "Guardando..."
                        ) : (
                          <>
                            <IconDeviceFloppy className="mr-2 h-4 w-4" />
                            Guardar Persona
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 