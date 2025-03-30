"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2 } from "@tabler/icons-react";
import { useToast } from "@/components/ui/use-toast";
import { es } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Nombres de los meses en español
const mesesEspanol = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

// Interfaz para los clientes
interface Cliente {
  id: string;
  nombre: string;
  email?: string;
}

// Interfaz para los planners
interface Planner {
  id: string;
  username: string;
  email: string;
  rol?: string;
  rolField?: string;
}

// Definir el esquema de validación usando Zod
const eventoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum([
    "aniversario", "bat-bar", "bautismo", "casamiento", 
    "civil", "comunion", "corporativo", "cumpleanos", 
    "egresados", "en-casa", "festejo", "fiesta15"
  ]),
  fecha: z.date({
    required_error: "La fecha es obligatoria",
  }),
  estado: z.enum(["en-curso", "finalizado", "cancelado"]),
  comentario: z.string().optional(),
  cliente_id: z.string().optional(),
  // Campos para cliente nuevo
  cliente_nuevo: z.boolean().default(false),
  cliente_nombre: z.string().optional(),
  cliente_email: z.string().email("Email inválido").optional(),
  planner_id: z.string().optional(),
});

type EventoFormValues = z.infer<typeof eventoFormSchema>;

const defaultValues: Partial<EventoFormValues> = {
  tipo: "festejo",
  estado: "en-curso",
  cliente_nuevo: false,
};

export function CreateEventDialog({ onEventCreated }: { onEventCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteNuevo, setClienteNuevo] = useState(false);
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [loadingPlanners, setLoadingPlanners] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoFormSchema),
    defaultValues,
  });

  // Cargar planners al abrir el diálogo
  useEffect(() => {
    async function fetchPlanners() {
      if (!isOpen) return;
      
      setLoadingPlanners(true);
      try {
        console.log('Solicitando planners a la API...');
        const response = await fetch('/api/usuarios/planners');
        console.log('Respuesta de la API:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Datos recibidos de planners:', data);
        
        if (data.success) {
          // Si hay un mensaje, mostrarlo como toast informativo
          if (data.message) {
            console.log('Mensaje de la API:', data.message);
            toast({
              title: "Información",
              description: data.message,
            });
          }
          
          console.log('Planners encontrados:', data.planners.length);
          
          // Mostrar detalle de cada planner para depuración
          if (data.planners && data.planners.length > 0) {
            console.log('Detalle de planners:');
            data.planners.forEach((planner: Planner, index: number) => {
              console.log(`Planner ${index + 1}:`, planner);
            });
          }
          
          setPlanners(data.planners);
        } else {
          console.error('Error al cargar planners:', data.message);
          toast({
            title: "Error",
            description: "No se pudieron cargar los planners: " + data.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error al cargar planners:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los planners",
          variant: "destructive",
        });
      } finally {
        setLoadingPlanners(false);
      }
    }
    
    fetchPlanners();
  }, [isOpen, toast]);

  // Cargar clientes al abrir el diálogo
  useEffect(() => {
    async function fetchClientes() {
      if (!isOpen) return;
      
      setLoadingClientes(true);
      try {
        const response = await fetch('/api/clientes/frequent');
        const data = await response.json();
        
        if (data.success) {
          setClientes(data.clientes);
        } else {
          console.error('Error al cargar clientes:', data.message);
          toast({
            title: "Error",
            description: "No se pudieron cargar los clientes",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          variant: "destructive",
        });
      } finally {
        setLoadingClientes(false);
      }
    }
    
    fetchClientes();
  }, [isOpen, toast]);

  async function onSubmit(data: EventoFormValues) {
    setIsSubmitting(true);
    
    try {
      // Validar que la fecha existe antes de continuar
      if (!data.fecha) {
        toast({
          title: "Error",
          description: "La fecha es obligatoria",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Convertir la fecha a formato ISO
      const formattedData = {
        ...data,
        fecha: data.fecha.toISOString(),
      };

      // Si es cliente nuevo, enviamos sus datos en lugar de un cliente_id
      if (clienteNuevo) {
        delete formattedData.cliente_id;
      } else {
        delete formattedData.cliente_nombre;
        delete formattedData.cliente_email;
      }

      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Evento creado",
          description: clienteNuevo 
            ? "El evento se ha creado exitosamente y se ha enviado un correo de bienvenida al cliente."
            : "El evento se ha creado exitosamente.",
        });
        form.reset(defaultValues);
        setIsOpen(false);
        setClienteNuevo(false);
        
        // Llamar al callback si existe
        if (onEventCreated) {
          onEventCreated();
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el evento. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al crear evento:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el evento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Función para cambiar entre cliente nuevo y cliente frecuente
  const handleClienteNuevoChange = (checked: boolean) => {
    setClienteNuevo(checked);
    // Limpiar campos relacionados con la opción no seleccionada
    if (checked) {
      form.setValue("cliente_id", undefined);
    } else {
      form.setValue("cliente_nombre", undefined);
      form.setValue("cliente_email", undefined);
    }
    form.setValue("cliente_nuevo", checked);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear un nuevo evento. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nombre del Evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del evento" {...field} />
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
                    <FormLabel>Tipo de Evento</FormLabel>
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
                        <SelectItem value="bat-bar">Bat/Bar mitzvah</SelectItem>
                        <SelectItem value="bautismo">Bautismo</SelectItem>
                        <SelectItem value="casamiento">Casamiento</SelectItem>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="comunion">Comunión</SelectItem>
                        <SelectItem value="corporativo">Corporativo</SelectItem>
                        <SelectItem value="cumpleanos">Cumpleaños</SelectItem>
                        <SelectItem value="egresados">Egresados</SelectItem>
                        <SelectItem value="en-casa">En Casa</SelectItem>
                        <SelectItem value="festejo">Festejo</SelectItem>
                        <SelectItem value="fiesta15">Fiesta de 15</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en-curso">En curso</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
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
                  <FormItem className="flex flex-col col-span-2">
                    <FormLabel>Fecha</FormLabel>
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
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-1">
                          <div className="mb-3 text-center font-medium">
                            {mesesEspanol[(field.value || new Date()).getMonth()]} {(field.value || new Date()).getFullYear()}
                          </div>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              // Asegurarnos de que una fecha nula no cause problemas
                              if (date) {
                                field.onChange(date);
                              }
                            }}
                            disabled={isSubmitting}
                            locale={es}
                            weekStartsOn={1}
                            initialFocus
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Toggle para cliente nuevo/frecuente */}
              <FormField
                control={form.control}
                name="cliente_nuevo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between col-span-2 rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Cliente nuevo</FormLabel>
                      <FormDescription>
                        Activa esta opción si es un cliente nuevo
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleClienteNuevoChange(checked);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Campos para cliente nuevo o selección de cliente frecuente */}
              {clienteNuevo ? (
                <>
                  <FormField
                    control={form.control}
                    name="cliente_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre del cliente" {...field} value={field.value || ""} />
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
                        <FormLabel>Email del Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Email del cliente" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Se enviará un correo de bienvenida personalizado a esta dirección con los detalles del evento.
                        </FormDescription>
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
                    <FormItem className="col-span-2">
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={loadingClientes}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingClientes ? "Cargando clientes..." : "Seleccionar cliente"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingClientes ? (
                            <div className="flex items-center justify-center p-2">
                              <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Cargando clientes...</span>
                            </div>
                          ) : clientes.length > 0 ? (
                            clientes.map(cliente => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nombre} {cliente.email && `(${cliente.email})`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No hay clientes disponibles
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecciona un cliente frecuente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="planner_id"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Planner asignado</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingPlanners}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingPlanners ? "Cargando planners..." : "Seleccionar planner"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingPlanners ? (
                          <div className="flex items-center justify-center p-2">
                            <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Cargando planners...</span>
                          </div>
                        ) : planners.length > 0 ? (
                          planners.map(planner => (
                            <SelectItem key={planner.id} value={planner.id}>
                              {planner.username} 
                              {planner.email ? `(${planner.email})` : ''} 
                              {planner.rol ? ` - ${planner.rol}` : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No hay planners disponibles. Asegúrate de que los usuarios tengan el rol &ldquo;planner&rdquo; asignado.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comentario"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comentarios adicionales sobre el evento" 
                        {...field} 
                        value={field.value || ""}
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
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Evento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}