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
  { value: "Padre/Madre", label: "Padre/Madre" },
  { value: "Hijo/a", label: "Hijo/a" },
  { value: "Familiar", label: "Familiar" },
  { value: "Otro", label: "Otro" },
]

// El esquema de validación para el formulario
const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
  tipo_persona: z.string().min(1, "El tipo de persona es requerido"),
  telefono: z.string().nullable(),
  instagram: z
    .string()
    .transform((val) => {
      if (!val) return null;
      return val.startsWith("@") ? val : `@${val}`;
    })
    .nullable(),
  email: z.string().email("Email inválido").nullable(),
  fecha_nacimiento: z.object({
    dia: z.number().min(1).max(31),
    mes: z.number().min(1).max(12)
  }).nullable(),
  notas: z.string().nullable(),
  cliente_id: z.string().nullable(),
})

interface Cliente {
  id: string;
  nombre: string;
}

type FormValues = z.infer<typeof schema>

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
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      fecha_nacimiento: null,
      notas: "",
      tipo_persona: "",
      instagram: "",
      cliente_id: "",
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      // Convertir teléfono a número si existe
      const phoneNumber = values.telefono ? parseInt(values.telefono.replace(/\D/g, '')) : null;
      
      // Formatear Instagram como URL completa
      const instagramUrl = values.instagram ? 
        `https://instagram.com/${values.instagram.replace('@', '')}` : 
        null;

      // Preparar objeto para crear
      const personaData = {
        nombre: values.nombre,
        apellido: values.apellido,
        telefono: phoneNumber,
        email: values.email || null,
        cumpleanio: values.fecha_nacimiento ? 
          // Obtener el año siguiente al actual
          new Date(
            new Date().getFullYear() + 1, 
            values.fecha_nacimiento.mes - 1, 
            values.fecha_nacimiento.dia
          ).toISOString() : 
          null,
        pais: "",
        ciudad: "",
        instagram: instagramUrl,
        direccion: "",
        comentario: `Tipo de persona: ${values.tipo_persona}${values.notas ? `\n${values.notas}` : ''}`,
        cliente_id: values.cliente_id === "none" ? null : values.cliente_id
      }

      console.log('Enviando datos:', personaData);

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
                            <FormLabel className="required">Nombre</FormLabel>
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
                            <FormLabel className="required">Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Apellido" {...field} />
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
                            <FormLabel className="required">Tipo de Persona</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1 234 567 8900" {...field} value={field.value || ""} />
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
                              <Input type="email" placeholder="ejemplo@email.com" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fecha_nacimiento"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Cumpleaños</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                              <Select
                                onValueChange={(value) => {
                                  const currentValue = field.value || { dia: 1, mes: 1 };
                                  field.onChange({ ...currentValue, mes: parseInt(value) });
                                }}
                                value={field.value?.mes?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Mes" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Enero</SelectItem>
                                  <SelectItem value="2">Febrero</SelectItem>
                                  <SelectItem value="3">Marzo</SelectItem>
                                  <SelectItem value="4">Abril</SelectItem>
                                  <SelectItem value="5">Mayo</SelectItem>
                                  <SelectItem value="6">Junio</SelectItem>
                                  <SelectItem value="7">Julio</SelectItem>
                                  <SelectItem value="8">Agosto</SelectItem>
                                  <SelectItem value="9">Septiembre</SelectItem>
                                  <SelectItem value="10">Octubre</SelectItem>
                                  <SelectItem value="11">Noviembre</SelectItem>
                                  <SelectItem value="12">Diciembre</SelectItem>
                                </SelectContent>
                              </Select>

                              <Select
                                onValueChange={(value) => {
                                  const currentValue = field.value || { dia: 1, mes: 1 };
                                  field.onChange({ ...currentValue, dia: parseInt(value) });
                                }}
                                value={field.value?.dia?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Día" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                                    <SelectItem key={dia} value={dia.toString()}>
                                      {dia}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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

                    <FormField
                      control={form.control}
                      name="notas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notas adicionales..."
                              className="resize-none"
                              {...field}
                              value={field.value || ""}
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