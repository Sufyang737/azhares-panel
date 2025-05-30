"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2, IconCalendar, IconSearch } from "@tabler/icons-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ReactSearchAutocomplete } from 'react-search-autocomplete';

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
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  // Convertir clientes al formato requerido por ReactSearchAutocomplete
  const clientesFormatted = clientes.map((cliente) => ({
    id: cliente.id,
    name: cliente.nombre,
    email: cliente.email,
  }));

  const handleOnSelect = (item: any) => {
    form.setValue("cliente_id", item.id);
  };

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
          <IconCalendar className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear nuevo evento</DialogTitle>
          <DialogDescription>
            Complete los detalles del evento a continuación.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha del evento</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
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
                {!clienteNuevo ? (
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <div style={{ zIndex: 100 }}>
                            <ReactSearchAutocomplete
                              items={clientesFormatted}
                              onSelect={handleOnSelect}
                              showIcon={false}
                              styling={{
                                height: "44px",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                backgroundColor: "white",
                                boxShadow: "none",
                                hoverBackgroundColor: "#f7fafc",
                                color: "#1a202c",
                                fontSize: "14px",
                                fontFamily: "inherit",
                                iconColor: "grey",
                                lineColor: "#e2e8f0",
                                placeholderColor: "#a0aec0",
                                clearIconMargin: "3px 8px 0 0",
                                zIndex: 2
                              }}
                              placeholder="Buscar cliente..."
                              formatResult={(item) => (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: "bold" }}>{item.name}</span>
                                  {item.email && (
                                    <span style={{ fontSize: "12px", color: "#718096" }}>
                                      {item.email}
                                    </span>
                                  )}
                                </div>
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Selecciona un cliente frecuente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="cliente_nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Cliente</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del cliente" {...field} />
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
                            <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Se enviará un correo de bienvenida personalizado a esta dirección con los detalles del evento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <FormField
                  control={form.control}
                  name="planner_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Planner asignado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
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
                                {planner.email && ` (${planner.email})`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No hay planners disponibles
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecciona el planner asignado al evento
                      </FormDescription>
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
            </form>
          </Form>
        </div>

        <DialogFooter className="mt-4">
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
      </DialogContent>
    </Dialog>
  );
}