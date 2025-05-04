"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
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
  Instagram,
  Globe,
  MapPin,
  Home,
  FileText,
  Heart
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
import { Badge } from "@/components/ui/badge";

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
  const [formCompleted, setFormCompleted] = useState(false);
  const [showAddPersona, setShowAddPersona] = useState(false);
  const [personasAdicionales, setPersonasAdicionales] = useState<{nombre: string, relacion: string}[]>([]);
  const [currentRelacion, setCurrentRelacion] = useState("");

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

  // Modificar la función onSubmit para manejar el nuevo formato de fecha
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
        instagram: instagramUrl, // Usar la URL completa
        cliente_id: clienteId
      };

      // Usar el nuevo endpoint para guardar los datos
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

      // Cambiar el estado para mostrar la opción de agregar más personas
      setFormCompleted(true);
      setIsSubmitting(false);
      
      // En lugar de redirigir inmediatamente, esperamos a que el usuario decida
      // si quiere agregar más personas relacionadas
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      toast({
        title: "Error al enviar el formulario",
        description: "Por favor, intenta nuevamente más tarde.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  // Actualizar la función agregarPersonaAdicional
  async function agregarPersonaAdicional() {
    const values = form.getValues();
    
    // Validar campos requeridos
    if (!values.nombre || !values.apellido || !values.telefono || !values.email || !currentRelacion) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos requeridos, incluyendo el tipo de relación",
      });
      return;
    }

    try {
      // Encontrar la etiqueta de la relación seleccionada
      const relacionLabel = RELACIONES.find(r => r.value === currentRelacion)?.label || currentRelacion;
      
      // Formatear la fecha de cumpleaños si existe
      let cumpleanio = null;
      if (values.cumpleanio?.mes && values.cumpleanio?.dia) {
        const year = new Date().getFullYear();
        const month = parseInt(values.cumpleanio.mes) - 1; // JavaScript months are 0-based
        const day = parseInt(values.cumpleanio.dia);
        cumpleanio = new Date(year, month, day).toISOString();
      }

      // Limpiar el número de teléfono (remover caracteres no numéricos)
      const telefonoLimpio = values.telefono.toString().replace(/\D/g, '');

      // Preparar los datos a enviar
      const dataToSend = {
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        telefono: telefonoLimpio, // Se convertirá a número en el backend
        email: values.email.trim(),
        cumpleanio: cumpleanio,
        pais: values.pais?.trim() || "",
        ciudad: values.ciudad?.trim() || "",
        instagram: values.instagram?.trim().replace(/^@/, '') || "", // Remover @ si existe
        direccion: values.direccion?.trim() || "",
        comentario: `Relación: ${relacionLabel}${values.comentario ? ` - ${values.comentario.trim()}` : ''}`,
        cliente_id: clienteId
      };

      console.log('Datos a enviar:', dataToSend);

      const response = await fetch("/api/formulario/persona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la persona adicional");
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar la lista de personas adicionales
        setPersonasAdicionales([
          ...personasAdicionales,
          { 
            nombre: `${values.nombre} ${values.apellido}`,
            relacion: relacionLabel
          }
        ]);

        // Limpiar el formulario
        form.reset({
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
        });

        setCurrentRelacion("");
        setShowAddPersona(false);

        toast({
          title: "¡Éxito!",
          description: "Persona agregada correctamente",
        });
      }
    } catch (error) {
      console.error("Error al agregar persona:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo agregar la persona",
      });
    }
  }

  // Función para finalizar y redirigir a la página de gracias
  function finalizarProceso() {
    router.push("/formulario/gracias");
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <IconLoader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Preparando tu formulario</h3>
          <p className="text-muted-foreground">Estamos cargando tu información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-center mb-4">{error}</p>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <Button onClick={() => router.push("/")} variant="outline" className="border-red-200 hover:bg-red-50 hover:text-red-600">
              Volver al inicio
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Si el formulario principal ya se completó, mostrar la interfaz para agregar personas adicionales
  if (formCompleted) {
    return (
      <FormProvider {...form}>
        <div className="min-h-screen p-4 md:p-8">
          <div className="mx-auto max-w-3xl">
            <Card className="border-indigo-200 bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    Personas adicionales
                  </Badge>
                  <div className="text-xs text-white/70">
                    ID: {clienteId.slice(0, 5)}...
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">¿Quieres añadir a alguien más?</CardTitle>
                <CardDescription className="text-white/90 text-base mt-2">
                  Puedes agregar información de otras personas relacionadas contigo para el evento.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {personasAdicionales.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Personas agregadas:</h3>
                    <div className="space-y-2">
                      {personasAdicionales.map((persona, index) => (
                        <div key={index} className="p-4 bg-white border border-indigo-100 rounded-lg flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Heart className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{persona.nombre}</span>
                              <span className="text-sm text-gray-500 ml-2">({persona.relacion})</span>
                            </div>
                          </div>
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Agregado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!showAddPersona ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">¿Deseas agregar información de alguien más?</h3>
                      <p className="text-gray-500">
                        Puedes agregar a familiares, amigos o acompañantes que asistirán al evento contigo.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => setShowAddPersona(true)}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Sí, agregar a alguien más
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={finalizarProceso}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        No, terminar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
              
              <CardFooter className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="w-full flex flex-col items-center gap-4">
                  <p className="text-sm text-gray-500 text-center">
                    La información de todas las personas será utilizada únicamente para los fines del evento.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span>Gracias por confiar en nosotros para tu evento especial</span>
                  </div>
                  {(personasAdicionales.length > 0 || showAddPersona) && (
                    <Button 
                      variant="link" 
                      onClick={finalizarProceso}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      Finalizar y continuar
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </FormProvider>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <IconLoader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <span className="ml-2 text-lg text-gray-700">Cargando formulario...</span>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
                <CardDescription className="text-red-500">{error}</CardDescription>
              </CardHeader>
            </Card>
          ) : formCompleted ? (
            <Card className="border-green-200 bg-green-50/80 shadow-lg">
              <CardHeader>
                <CardTitle className="text-green-600">¡Gracias por completar el formulario!</CardTitle>
                <CardDescription className="text-green-500">
                  Tus datos han sido guardados correctamente.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={finalizarProceso} className="mt-4 bg-green-600 hover:bg-green-700">
                  Finalizar
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <Card className="mb-6 border-indigo-200 bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      Datos Principales
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mt-2">
                    {clienteInfo?.nombre ? `Bienvenido/a, ${clienteInfo.nombre}` : "Bienvenido/a"}
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    Por favor, completa tus datos para brindarte un mejor servicio.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-indigo-200 bg-white shadow-lg">
                <CardHeader className="border-b border-indigo-100 bg-indigo-50/50">
                  <CardTitle className="text-xl text-indigo-900">Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <User className="h-4 w-4 text-indigo-600" />
                                <span>Nombre</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="Tu nombre"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="apellido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <User className="h-4 w-4 text-indigo-600" />
                                <span>Apellido</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="Tu apellido"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <Mail className="h-4 w-4 text-indigo-600" />
                                <span>Email</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email" 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="tu@email.com"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="telefono"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <Phone className="h-4 w-4 text-indigo-600" />
                                <span>Teléfono</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="tel" 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="+1234567890"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cumpleanio"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                                <span>Fecha de Cumpleaños</span>
                              </FormLabel>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <select
                                    value={field.value?.mes || ""}
                                    onChange={(e) => {
                                      const newValue = {
                                        ...field.value,
                                        mes: e.target.value
                                      };
                                      field.onChange(newValue);
                                    }}
                                    className="w-full rounded-md border border-gray-200 bg-white text-gray-900 px-3 py-2 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors"
                                  >
                                    <option value="">Mes</option>
                                    {MESES.map((mes) => (
                                      <option key={mes.value} value={mes.value}>
                                        {mes.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
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
                                    className="w-full bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors"
                                  />
                                </div>
                              </div>
                              <FormDescription className="text-sm text-gray-500">
                                Selecciona o escribe el mes y día
                              </FormDescription>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <Instagram className="h-4 w-4 text-indigo-600" />
                                <span>Instagram</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                                  <Input 
                                    {...field} 
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors pl-8" 
                                    placeholder="nombre.usuario"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-sm text-gray-500">
                                Solo el nombre de usuario, sin @
                              </FormDescription>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="pais"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <Globe className="h-4 w-4 text-indigo-600" />
                                <span>País</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="Tu país"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ciudad"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                                <span>Ciudad</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                  placeholder="Tu ciudad"
                                />
                              </FormControl>
                              <FormMessage className="text-red-600" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                              <Home className="h-4 w-4 text-indigo-600" />
                              <span>Dirección</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                placeholder="Tu dirección"
                              />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="comentario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2 font-medium text-gray-700">
                              <FileText className="h-4 w-4 text-indigo-600" />
                              <span>Comentarios Adicionales</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="min-h-[100px] bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:ring-indigo-200 transition-colors" 
                                placeholder="Cualquier información adicional que quieras compartir..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            "Guardar y Continuar"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </FormProvider>
  );
} 