"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Instagram
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

// Agregar después de las importaciones existentes
const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" }
];

// Agregar las opciones de relación más específicas
const RELACIONES = [
  { value: "hijo", label: "Hijo/a" },
  { value: "hermano", label: "Hermano/a" },
  { value: "esposo", label: "Esposo" },
  { value: "esposa", label: "Esposa" },
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "primo", label: "Primo/a" },
  { value: "tio", label: "Tío/a" },
  { value: "sobrino", label: "Sobrino/a" },
  { value: "abuelo", label: "Abuelo/a" },
  { value: "nieto", label: "Nieto/a" },
  { value: "amigo", label: "Amigo/a" },
  { value: "otro", label: "Otro" }
];

// Modificar el esquema de validación
const personaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  email: z.string().email("Email inválido"),
  cumpleanio: z.object({
    dia: z.string().min(1, "El día es requerido").max(2, "Formato inválido"),
    mes: z.string().min(1, "El mes es requerido").max(2, "Formato inválido")
  }).optional(),
  pais: z.string().optional(),
  ciudad: z.string().optional(),
  instagram: z.string()
    .regex(/^[a-zA-Z0-9._]+$/, "Nombre de usuario inválido - solo letras, números, puntos y guiones bajos")
    .optional()
    .or(z.literal("")),
  direccion: z.string().optional(),
  comentario: z.string().optional(),
  personasAdicionales: z.array(z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    apellido: z.string().min(1, "El apellido es obligatorio"),
    telefono: z.string().min(1, "El teléfono es obligatorio"),
    email: z.string().email("Email inválido"),
    cumpleanio: z.object({
      dia: z.string().min(1, "El día es requerido").max(2, "Formato inválido"),
      mes: z.string().min(1, "El mes es requerido").max(2, "Formato inválido")
    }).optional(),
    pais: z.string().optional(),
    ciudad: z.string().optional(),
    instagram: z.string()
      .regex(/^[a-zA-Z0-9._]+$/, "Nombre de usuario inválido")
      .optional()
      .or(z.literal("")),
    direccion: z.string().optional(),
    comentario: z.string().optional(),
    relacion: z.string().min(1, "La relación es obligatoria")
  })).default([])
});

type PersonaFormValues = z.infer<typeof personaFormSchema>;

// Definir el tipo de props para el componente
export interface FormularioClienteComponentProps {
  clienteId: string;
}

// Componente de cliente que maneja el formulario
export default function FormularioClienteComponent({ clienteId }: FormularioClienteComponentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteInfo, setClienteInfo] = useState<{nombre: string, email: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPersonasSection, setShowPersonasSection] = useState(false);
  const [tempPersona, setTempPersona] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    cumpleanio: {
      dia: "",
      mes: ""
    },
    pais: "",
    ciudad: "",
    instagram: "",
    direccion: "",
    comentario: "",
    relacion: ""
  });

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      cumpleanio: {
        dia: "",
        mes: ""
      },
      pais: "",
      ciudad: "",
      instagram: "",
      direccion: "",
      comentario: "",
      personasAdicionales: []
    },
    mode: "onChange",
  });

  // Cargar información del cliente al iniciar - Ahora usando el endpoint público
  useEffect(() => {
    async function fetchClienteInfo() {
      setIsLoading(true);
      try {
        if (!clienteId || clienteId.trim() === '') {
          setError("ID de cliente no proporcionado o inválido");
          setIsLoading(false);
          return;
        }

        // Validar formato de ID (PocketBase generalmente usa IDs de 15 caracteres)
        if (clienteId.length < 8 || clienteId.length > 30) {
          console.warn("ID de cliente con formato sospechoso:", clienteId);
        }
        
        console.log("Consultando cliente con ID:", clienteId);
        
        // Usar el nuevo endpoint público
        const response = await fetch(`/api/formulario/cliente/${clienteId}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del cliente: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Error desconocido al obtener información del cliente");
        }
        
        const cliente = data.cliente;
        console.log("Cliente encontrado:", cliente);
        
        if (cliente) {
          setClienteInfo({
            nombre: cliente.nombre || "",
            email: cliente.email || ""
          });
          
          // Pre-llenar el formulario con datos del cliente
          form.setValue("nombre", cliente.nombre ? cliente.nombre.split(" ")[0] : "");
          if (cliente.nombre && cliente.nombre.split(" ").length > 1) {
            form.setValue("apellido", cliente.nombre.split(" ").slice(1).join(" "));
          }
          form.setValue("email", cliente.email || "");
        }
      } catch (error) {
        console.error("Error al cargar información del cliente:", error);
        setError("No se pudo encontrar el cliente. El enlace puede ser inválido o ha expirado.");
      } finally {
        setIsLoading(false);
      }
    }

    if (clienteId) {
      fetchClienteInfo();
    } else {
      setError("ID de cliente no proporcionado");
      setIsLoading(false);
    }
  }, [clienteId, form]);

  const agregarPersona = () => {
    if (tempPersona.nombre && tempPersona.apellido && tempPersona.telefono && tempPersona.email && tempPersona.relacion) {
      const personasActuales = form.getValues("personasAdicionales");
      form.setValue("personasAdicionales", [...personasActuales, {
        ...tempPersona,
        cumpleanio: {
          dia: tempPersona.cumpleanio.dia || "",
          mes: tempPersona.cumpleanio.mes || ""
        }
      }]);
      setTempPersona({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        cumpleanio: { dia: "", mes: "" },
        pais: "",
        ciudad: "",
        instagram: "",
        direccion: "",
        comentario: "",
        relacion: ""
      });
    }
  };

  const eliminarPersona = (index: number) => {
    const personasActuales = form.getValues("personasAdicionales");
    form.setValue("personasAdicionales", 
      personasActuales.filter((_, i) => i !== index)
    );
  };

  async function onSubmit(values: PersonaFormValues) {
    setIsSubmitting(true);
    try {
      // Convertir el número de teléfono a número si es posible
      const telefono = parseInt(values.telefono);
      const telefonoValue = isNaN(telefono) ? values.telefono : telefono;

      // Crear fecha de cumpleaños con el año actual si se proporcionaron mes y día
      let cumpleanio = undefined;
      if (values.cumpleanio?.mes && values.cumpleanio?.dia) {
        const currentYear = new Date().getFullYear();
        cumpleanio = new Date(currentYear, parseInt(values.cumpleanio.mes) - 1, parseInt(values.cumpleanio.dia));
      }

      // Transformar el nombre de usuario de Instagram en URL completa
      const instagramUrl = values.instagram 
        ? `https://instagram.com/${values.instagram.replace(/^@/, '')}`
        : undefined;

      // Preparar datos para enviar al endpoint
      const data = {
        ...values,
        telefono: telefonoValue,
        cumpleanio: cumpleanio ? cumpleanio.toISOString() : undefined,
        instagram: instagramUrl,
        cliente_id: clienteId
      };

      // Enviar datos al endpoint
      const response = await fetch('/api/formulario/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar el formulario");
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Error al procesar la información");
      }
      
      toast({
        title: "¡Formulario enviado con éxito!",
        description: "Gracias por completar tus datos.",
      });

      router.push('/gracias');
    } catch (error) {
      console.error("Error al enviar formulario:", error);
      toast({
        title: "Error al enviar el formulario",
        description: "Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <IconLoader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2">Cargando formulario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F1]">
      <div className="container mx-auto px-4 py-8">
        {/* Header con Logo */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Logo"
              width={200}
              height={80}
              className="h-auto"
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-[#F5D0C5] text-[#4A3531] p-8 text-center">
                <CardTitle className="text-3xl font-light">
                  {clienteInfo?.nombre 
                    ? `¡Hola ${clienteInfo.nombre}!`
                    : "Bienvenido/a"}
                </CardTitle>
                <CardDescription className="text-[#6B4D45] text-lg mt-2">
                  Nos encantaría conocerte mejor, para brindarte la mejor experiencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8 bg-white">
                {/* Sección de Datos Principales */}
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <User className="h-4 w-4 text-[#F5D0C5]" />
                            <span>Nombre</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="Tu nombre"
                            />
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <User className="h-4 w-4 text-[#F5D0C5]" />
                            <span>Apellido</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="Tu apellido"
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <Mail className="h-4 w-4 text-[#F5D0C5]" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="tu@email.com"
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <Phone className="h-4 w-4 text-[#F5D0C5]" />
                            <span>Teléfono</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel" 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="+1234567890"
                            />
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <CalendarIcon className="h-4 w-4 text-[#F5D0C5]" />
                            <span>¿Cuándo es tu cumpleaños?</span>
                          </FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              value={field.value?.mes || ""}
                              onChange={(e) => {
                                const newValue = {
                                  ...field.value,
                                  mes: e.target.value
                                };
                                field.onChange(newValue);
                              }}
                              className="w-full rounded-xl h-12 border-2 border-[#F5D0C5]/30 bg-white text-[#4A3531] px-3 placeholder:text-gray-400 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 transition-colors"
                            >
                              <option value="">Mes</option>
                              {MESES.map((mes) => (
                                <option key={mes.value} value={mes.value}>
                                  {mes.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="Día"
                              value={field.value?.dia || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                                  const newValue = {
                                    ...field.value,
                                    dia: value
                                  };
                                  field.onChange(newValue);
                                }
                              }}
                              className="w-full h-12 bg-white border-2 border-[#F5D0C5]/30 text-[#4A3531] placeholder:text-gray-400 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <Instagram className="h-4 w-4 text-[#F5D0C5]" />
                            <span>Instagram</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A3531] font-medium">@</span>
                              <Input 
                                {...field} 
                                className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 pl-8 rounded-xl h-12" 
                                placeholder="nombre.usuario"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-sm text-[#6B4D45]">
                            Solo el nombre de usuario, sin @
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nuevos campos */}
                    <FormField
                      control={form.control}
                      name="pais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <span>País</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="Tu país"
                            />
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <span>Ciudad</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="Tu ciudad"
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
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <span>Dirección</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12" 
                              placeholder="Tu dirección"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comentario"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="flex items-center space-x-2 text-[#4A3531] text-base">
                            <span>¿Cómo nos conociste?</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl min-h-[100px] resize-none" 
                              placeholder="Cuéntanos un poco sobre cómo llegaste a nosotros..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sección de Personas Adicionales */}
                <div className="mt-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-light text-[#4A3531] flex items-center gap-2">
                      <User className="h-5 w-5 text-[#F5D0C5]" />
                      ¿Quieres agregar algún familiar?
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPersonasSection(!showPersonasSection)}
                      className="border-[#F5D0C5] text-[#4A3531] hover:bg-[#F5D0C5]/10 rounded-xl"
                    >
                      {showPersonasSection ? "Ocultar" : "Agregar persona"}
                    </Button>
                  </div>
                  
                  {showPersonasSection && (
                    <div className="border border-[#F5D0C5]/20 rounded-xl p-8 bg-white/50 shadow-sm space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <Input
                          placeholder="Nombre"
                          value={tempPersona.nombre}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, nombre: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <Input
                          placeholder="Apellido"
                          value={tempPersona.apellido}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, apellido: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          value={tempPersona.email}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, email: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <Input
                          type="tel"
                          placeholder="Teléfono"
                          value={tempPersona.telefono}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, telefono: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={tempPersona.cumpleanio.mes}
                            onChange={(e) => setTempPersona(prev => ({
                              ...prev,
                              cumpleanio: { ...prev.cumpleanio, mes: e.target.value }
                            }))}
                            className="w-full rounded-xl h-12 border-2 border-[#F5D0C5]/30 bg-white px-3 py-2"
                          >
                            <option value="">Mes</option>
                            {MESES.map((mes) => (
                              <option key={mes.value} value={mes.value}>
                                {mes.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="Día"
                            value={tempPersona.cumpleanio.dia}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
                                setTempPersona(prev => ({
                                  ...prev,
                                  cumpleanio: { ...prev.cumpleanio, dia: value }
                                }));
                              }
                            }}
                            className="rounded-xl h-12"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A3531]">@</span>
                          <Input
                            placeholder="Instagram"
                            value={tempPersona.instagram}
                            className="pl-8 border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                            onChange={(e) => setTempPersona(prev => ({ ...prev, instagram: e.target.value }))}
                          />
                        </div>
                        <select
                          className="flex h-12 w-full rounded-xl border-2 border-[#F5D0C5]/30 bg-white px-3 py-2"
                          value={tempPersona.relacion}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, relacion: e.target.value }))}
                        >
                          <option value="">¿Qué relación tienen?</option>
                          {RELACIONES.map(rel => (
                            <option key={rel.value} value={rel.value}>{rel.label}</option>
                          ))}
                        </select>

                        {/* Nuevos campos de ubicación */}
                        <Input
                          placeholder="País"
                          value={tempPersona.pais}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, pais: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <Input
                          placeholder="Ciudad"
                          value={tempPersona.ciudad}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, ciudad: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12"
                        />
                        <Input
                          placeholder="Dirección"
                          value={tempPersona.direccion}
                          onChange={(e) => setTempPersona(prev => ({ ...prev, direccion: e.target.value }))}
                          className="border-2 border-[#F5D0C5]/30 focus:border-[#F5D0C5] focus:ring-[#F5D0C5]/20 rounded-xl h-12 col-span-2"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTempPersona({
                            nombre: "",
                            apellido: "",
                            telefono: "",
                            email: "",
                            cumpleanio: { dia: "", mes: "" },
                            pais: "",
                            ciudad: "",
                            instagram: "",
                            direccion: "",
                            comentario: "",
                            relacion: ""
                          })}
                          className="border-[#F5D0C5] text-[#4A3531] hover:bg-[#F5D0C5]/10 rounded-xl"
                        >
                          Limpiar
                        </Button>
                        <Button
                          type="button"
                          onClick={agregarPersona}
                          disabled={!tempPersona.nombre || !tempPersona.apellido || !tempPersona.telefono || !tempPersona.email || !tempPersona.relacion}
                          className="bg-[#F5D0C5] hover:bg-[#F5D0C5]/90 text-[#4A3531] rounded-xl"
                        >
                          Agregar Persona
                        </Button>
                      </div>

                      {form.watch("personasAdicionales").length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-light text-[#4A3531] mb-4">Personas agregadas:</h4>
                          <div className="space-y-3">
                            {form.watch("personasAdicionales").map((persona, index) => (
                              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#F5D0C5]/20">
                                <div className="space-y-1">
                                  <p className="font-medium text-[#4A3531]">{persona.nombre} {persona.apellido}</p>
                                  <p className="text-sm text-[#6B4D45]">
                                    {RELACIONES.find(r => r.value === persona.relacion)?.label} • {persona.email}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarPersona(index)}
                                  className="text-[#4A3531] hover:text-[#4A3531]/70 hover:bg-[#F5D0C5]/10 rounded-xl"
                                >
                                  Eliminar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-[#FFF5F1] px-8 py-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-[#F5D0C5] hover:bg-[#F5D0C5]/90 text-[#4A3531] rounded-xl h-12 text-lg font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
} 