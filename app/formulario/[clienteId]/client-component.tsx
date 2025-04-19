"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { CalendarIcon, User, Mail, Phone, MapPin, Instagram, Heart, Home, Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconLoader2 } from "@tabler/icons-react";
import { useToast } from "@/components/ui/use-toast";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

// Función para parsear fechas en formato DD/MM/YYYY
function parseDateString(dateString: string): Date | null {
  const dateRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/;
  const match = dateString.match(dateRegex);
  
  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    
    // Verificar que sea una fecha válida
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

type PersonaFormValues = z.infer<typeof personaFormSchema>;

// Definición para la relación
const relacionSchema = z.object({
  tipo: z.string().min(1, "El tipo de relación es obligatorio"),
});

type RelacionValues = z.infer<typeof relacionSchema>;

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
  const [formStep, setFormStep] = useState(0);
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

  // Función para agregar una persona adicional
  async function agregarPersonaAdicional() {
    if (!currentRelacion || !form.getValues("nombre") || !form.getValues("apellido")) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa al menos nombre, apellido y tipo de relación.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const telefono = parseInt(values.telefono);
      const telefonoValue = isNaN(telefono) ? values.telefono : telefono;

      // Transformar el nombre de usuario de Instagram en URL completa
      const instagramUrl = values.instagram 
        ? `https://instagram.com/${values.instagram.replace(/^@/, '')}`
        : undefined;

      // Crear fecha de cumpleaños con el año actual si se proporcionaron mes y día
      let cumpleanio = undefined;
      if (values.cumpleanio?.mes && values.cumpleanio?.dia) {
        const currentYear = new Date().getFullYear();
        cumpleanio = new Date(currentYear, parseInt(values.cumpleanio.mes) - 1, parseInt(values.cumpleanio.dia));
      }

      const data = {
        ...values,
        telefono: telefonoValue,
        cumpleanio: cumpleanio ? cumpleanio.toISOString() : undefined,
        instagram: instagramUrl, // Usar la URL completa
        cliente_id: clienteId,
        comentario: `Relación: ${currentRelacion}${values.comentario ? ` - ${values.comentario}` : ''}`
      };

      // Usar el mismo endpoint para guardar los datos
      const response = await fetch('/api/formulario/persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar los datos");
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || "Error al procesar la información");
      }
      
      // Agregar a la lista de personas adicionales para mostrar
      setPersonasAdicionales([
        ...personasAdicionales,
        { nombre: `${values.nombre} ${values.apellido}`, relacion: currentRelacion }
      ]);
      
      // Limpiar formulario para una nueva persona
      form.reset({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        pais: "",
        ciudad: "",
        instagram: "",
        direccion: "",
        comentario: "",
      });
      
      // Limpiar tipo de relación
      setCurrentRelacion("");
      
      toast({
        title: "¡Persona agregada!",
        description: "Se ha agregado correctamente una persona relacionada.",
      });
    } catch (error) {
      console.error("Error al agregar persona adicional:", error);
      toast({
        title: "Error al agregar persona",
        description: "Por favor, intenta nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className="bg-white/20 text-white border-none">
                  Personas adicionales
                </Badge>
                <div className="text-xs text-white/70">
                  ID: {clienteId.slice(0, 5)}...
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">¿Quieres añadir a alguien más?</CardTitle>
              <CardDescription className="text-center text-white/80 text-base mt-2">
                Puedes agregar información de otras personas relacionadas contigo para el evento.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pt-6 pb-2">
              {personasAdicionales.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-slate-700 mb-3">Personas agregadas:</h3>
                  <div className="space-y-2">
                    {personasAdicionales.map((persona, index) => (
                      <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex justify-between items-center">
                        <div>
                          <span className="font-medium">{persona.nombre}</span>
                          <span className="text-slate-500 text-sm ml-2">({persona.relacion})</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          Agregado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showAddPersona ? (
                <div className="space-y-6">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-medium text-slate-700">Agregar persona relacionada</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddPersona(false)}
                      className="text-slate-500"
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-md border border-blue-100 mb-4">
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-blue-600 font-medium">¿Qué relación tiene contigo?</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Familiar", "Pareja", "Amigo/a", "Compañero/a", "Hijo/a", "Padre/Madre", "Hermano/a", "Otro"].map((tipo) => (
                        <Badge 
                          key={tipo}
                          variant={currentRelacion === tipo ? "default" : "outline"}
                          className={`cursor-pointer ${currentRelacion === tipo 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "hover:bg-blue-100"}`}
                          onClick={() => setCurrentRelacion(tipo)}
                        >
                          {tipo}
                        </Badge>
                      ))}
                    </div>
                    {currentRelacion === "Otro" && (
                      <Input 
                        className="mt-2" 
                        placeholder="Especificar relación..." 
                        onChange={(e) => setCurrentRelacion(e.target.value)}
                      />
                    )}
                  </div>

                  <Form {...form}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex gap-2 items-center">
                                <User className="h-4 w-4 text-slate-400" /> Nombre
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Su nombre" {...field} />
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
                              <FormLabel className="flex gap-2 items-center">
                                <User className="h-4 w-4 text-slate-400" /> Apellido
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Su apellido" {...field} />
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
                              <FormLabel className="flex gap-2 items-center">
                                <Phone className="h-4 w-4 text-slate-400" /> Teléfono
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Su teléfono" type="tel" {...field} />
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
                              <FormLabel className="flex gap-2 items-center">
                                <Mail className="h-4 w-4 text-slate-400" /> Email
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="su@email.com" type="email" {...field} />
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
                            <FormLabel className="flex gap-2 items-center">
                              <FileText className="h-4 w-4 text-slate-400" /> Comentario adicional
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Información o preferencias especiales..."
                                className="resize-none min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddPersona(false)}
                          className="border-slate-300"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={agregarPersonaAdicional}
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {isSubmitting ? (
                            <>
                              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                              Agregando...
                            </>
                          ) : (
                            "Agregar persona"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-slate-700 mb-2">¿Deseas agregar información de alguien más?</h3>
                    <p className="text-slate-500">
                      Puedes agregar a familiares, amigos o acompañantes que asistirán al evento contigo.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => setShowAddPersona(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Sí, agregar a alguien más
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={finalizarProceso}
                      className="border-slate-300"
                    >
                      No, terminar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-6 border-t bg-slate-50 flex flex-col">
              <div className="w-full text-center text-xs text-slate-500">
                <p>La información de todas las personas será utilizada únicamente para los fines del evento.</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" /> 
                  <span>Gracias por confiar en nosotros para tu evento especial</span>
                </div>
              </div>
              {(personasAdicionales.length > 0 || showAddPersona) && (
                <Button 
                  variant="link" 
                  onClick={finalizarProceso}
                  className="mt-4 text-blue-600"
                >
                  Finalizar y continuar
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const isLastStep = formStep === 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
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
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    {formStep === 0 ? "Datos Principales" : "Personas Adicionales"}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  {clienteInfo?.nombre ? `Bienvenido/a, ${clienteInfo.nombre}` : "Bienvenido/a"}
                </CardTitle>
                <CardDescription className="text-white/90">
                  Por favor, completa tus datos para brindarte un mejor servicio.
                </CardDescription>
              </CardHeader>
            </Card>

            {formStep === 0 ? (
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <User className="h-4 w-4 text-gray-700" />
                                <span>Nombre</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <User className="h-4 w-4 text-gray-700" />
                                <span>Apellido</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <Mail className="h-4 w-4 text-gray-700" />
                                <span>Email</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <Phone className="h-4 w-4 text-gray-700" />
                                <span>Teléfono</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <CalendarIcon className="h-4 w-4 text-gray-700" />
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
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
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
                                    className="w-full bg-white text-gray-900"
                                  />
                                </div>
                              </div>
                              <FormDescription className="text-xs text-gray-500">
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <Instagram className="h-4 w-4 text-gray-700" />
                                <span>Instagram</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                                  <Input 
                                    {...field} 
                                    className="bg-white text-gray-900 pl-8 placeholder:text-gray-500" 
                                    placeholder="nombre.usuario"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <Globe className="h-4 w-4 text-gray-700" />
                                <span>País</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                              <FormLabel className="flex items-center space-x-2 text-gray-900">
                                <MapPin className="h-4 w-4 text-gray-700" />
                                <span>Ciudad</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                            <FormLabel className="flex items-center space-x-2 text-gray-900">
                              <Home className="h-4 w-4 text-gray-700" />
                              <span>Dirección</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white text-gray-900 placeholder:text-gray-500" />
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
                            <FormLabel className="flex items-center space-x-2 text-gray-900">
                              <FileText className="h-4 w-4 text-gray-700" />
                              <span>Comentarios Adicionales</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="min-h-[100px] bg-white text-gray-900 placeholder:text-gray-500" 
                                placeholder="Cualquier información adicional que quieras compartir..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-600" />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                        >
                          {isSubmitting && (
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Guardar y Continuar
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-indigo-200 bg-white shadow-lg">
                <CardHeader className="border-b border-indigo-100 bg-indigo-50/50">
                  <CardTitle className="text-xl text-indigo-900">Personas Adicionales</CardTitle>
                  <CardDescription className="text-gray-600">
                    ¿Deseas agregar información de familiares o acompañantes?
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {personasAdicionales.length > 0 && (
                    <div className="mb-6 space-y-4">
                      <h3 className="text-sm font-medium text-gray-500">Personas agregadas:</h3>
                      {personasAdicionales.map((persona, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 p-3"
                        >
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-purple-500" />
                            <span className="font-medium text-indigo-900">{persona.nombre}</span>
                            <span className="text-sm text-gray-600">({persona.relacion})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddPersona ? (
                    <div className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Tipo de Relación</label>
                          <select
                            value={currentRelacion}
                            onChange={(e) => setCurrentRelacion(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="Pareja">Pareja</option>
                            <option value="Familiar">Familiar</option>
                            <option value="Amigo/a">Amigo/a</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddPersona(false)}
                          className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={agregarPersonaAdicional}
                          disabled={!currentRelacion}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowAddPersona(true)}
                      className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Agregar Persona
                    </Button>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-indigo-100 bg-indigo-50/30 p-6">
                  <Button
                    variant="outline"
                    onClick={() => setFormStep(0)}
                    className="border-indigo-200 hover:bg-indigo-50 text-indigo-700"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={() => setFormCompleted(true)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                  >
                    Finalizar
                  </Button>
                </CardFooter>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
} 