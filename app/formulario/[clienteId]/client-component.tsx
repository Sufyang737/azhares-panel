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

// Esquema de validación usando Zod
const personaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  email: z.string().email("Email inválido"),
  cumpleanio: z.date().optional(),
  pais: z.string().optional(),
  ciudad: z.string().optional(),
  instagram: z.string().url("URL de Instagram inválida").optional().or(z.literal("")),
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

  async function onSubmit(values: PersonaFormValues) {
    setIsSubmitting(true);
    try {
      // Convertir el número de teléfono a número si es posible
      const telefono = parseInt(values.telefono);
      const telefonoValue = isNaN(telefono) ? values.telefono : telefono;

      // Preparar datos para enviar al endpoint
      const data = {
        ...values,
        telefono: telefonoValue,
        // Asegurarse de que cumpleanio tenga el formato correcto
        cumpleanio: values.cumpleanio ? values.cumpleanio.toISOString() : undefined,
        // Agregar relación con el cliente
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
      // Obtener los valores actuales del formulario
      const values = form.getValues();
      const telefono = parseInt(values.telefono);
      const telefonoValue = isNaN(telefono) ? values.telefono : telefono;

      // Preparar datos para enviar al endpoint
      const data = {
        ...values,
        telefono: telefonoValue,
        cumpleanio: values.cumpleanio ? values.cumpleanio.toISOString() : undefined,
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card className="border-slate-200 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="bg-white/20 text-white border-none">
                Evento Especial
              </Badge>
              <div className="text-xs text-white/70">
                ID: {clienteId.slice(0, 5)}...
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Tu información personal</CardTitle>
            {clienteInfo && (
              <CardDescription className="text-center text-white/80 text-base mt-2">
                Hola {clienteInfo.nombre}, nos encantaría conocerte mejor para hacer de tu evento algo único.
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="px-6 pt-6 pb-2">
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium text-slate-700">
                  {formStep === 0 ? "Información básica" : "Detalles adicionales"}
                </h3>
                <div className="text-sm text-slate-500">
                  Paso {formStep + 1} de 2
                </div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${(formStep + 1) * 50}%` }}
                ></div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {formStep === 0 && (
                  <div className="space-y-6">
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
                              <Input placeholder="Tu nombre" {...field} />
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
                              <Input placeholder="Tu apellido" {...field} />
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
                              <Input placeholder="Tu teléfono" type="tel" {...field} />
                            </FormControl>
                            <FormDescription>
                              Preferentemente WhatsApp o móvil
                            </FormDescription>
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
                              <Input placeholder="tu@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="cumpleanio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex gap-2 items-center">
                            <CalendarIcon className="h-4 w-4 text-slate-400" /> Fecha de cumpleaños
                          </FormLabel>
                          <div className="flex flex-col gap-2">
                            <Input 
                              placeholder="Ej: 01/01/1990 (DD/MM/AAAA)" 
                              type="text"
                              onChange={(e) => {
                                // Intentar convertir el texto a fecha
                                const dateString = e.target.value;
                                if (!dateString) {
                                  field.onChange(undefined); // Limpiar el campo si está vacío
                                  return;
                                }
                                
                                const parsedDate = parseDateString(dateString);
                                if (parsedDate) {
                                  field.onChange(parsedDate);
                                }
                              }}
                              value={field.value 
                                ? `${field.value.getDate().toString().padStart(2, '0')}/${(field.value.getMonth() + 1).toString().padStart(2, '0')}/${field.value.getFullYear()}`
                                : ''}
                            />
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <span>Formato: DD/MM/AAAA (ejemplo: 15/06/1985)</span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-3 mb-1">
                              <span>O seleccionar desde el calendario:</span>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal border-slate-300",
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
                                  locale={es}
                                  initialFocus
                                  captionLayout="dropdown-buttons"
                                  fromYear={1930}
                                  toYear={2024}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormDescription>
                            Nos ayudará a personalizar mejor tu evento
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {formStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex gap-2 items-center">
                              <Globe className="h-4 w-4 text-slate-400" /> País
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Tu país" {...field} />
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
                            <FormLabel className="flex gap-2 items-center">
                              <MapPin className="h-4 w-4 text-slate-400" /> Ciudad
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Tu ciudad" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex gap-2 items-center">
                              <Instagram className="h-4 w-4 text-slate-400" /> Instagram
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://instagram.com/tuusuario" {...field} />
                            </FormControl>
                            <FormDescription>URL completa de tu perfil</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="direccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex gap-2 items-center">
                              <Home className="h-4 w-4 text-slate-400" /> Dirección
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Tu dirección" {...field} />
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
                              placeholder="¿Hay algo más que quieras compartir con nosotros?"
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between gap-4 pt-2">
                  {formStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormStep(0)}
                      className="border-slate-300 hover:border-slate-400"
                    >
                      Atrás
                    </Button>
                  )}
                  
                  {!isLastStep && (
                    <Button
                      type="button"
                      className="ml-auto"
                      onClick={() => {
                        // Validar campos del primer paso antes de avanzar
                        form.trigger(['nombre', 'apellido', 'telefono', 'email']).then((isValid) => {
                          if (isValid) setFormStep(1);
                        });
                      }}
                    >
                      Continuar
                    </Button>
                  )}
                  
                  {isLastStep && (
                    <Button 
                      type="submit" 
                      className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Completar formulario"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="p-6 border-t bg-slate-50">
            <div className="w-full text-center text-xs text-slate-500">
              <p>Tu información está segura y solo será utilizada para los fines de tu evento.</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                <Heart className="h-3 w-3 text-red-400" /> 
                <span>Gracias por confiar en nosotros para tu evento especial</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 