"use client";

import { useState } from "react";
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

// Lista simulada de clientes frecuentes
const clientesFrecuentes = [
  { id: "cliente1", nombre: "Juan Pérez" },
  { id: "cliente2", nombre: "María González" },
  { id: "cliente3", nombre: "Carlos Rodríguez" },
  { id: "cliente4", nombre: "Ana Martínez" },
  { id: "cliente5", nombre: "Roberto Sánchez" },
];

// Lista simulada de planners
const planners = [
  { id: "planner1", nombre: "Sofia López" },
  { id: "planner2", nombre: "Diego Fernández" },
  { id: "planner3", nombre: "Valentina Torres" },
];

// Definir el esquema de validación usando Zod
const eventoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum(["aniversario", "boda", "corporativo", "cumpleaños", "otro"]),
  fecha: z.date({
    required_error: "La fecha es obligatoria",
  }),
  estado: z.enum(["en-curso", "completado", "cancelado", "pendiente"]),
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
  tipo: "otro",
  estado: "pendiente",
  cliente_nuevo: false,
};

export function CreateEventDialog({ onEventCreated }: { onEventCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteNuevo, setClienteNuevo] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventoFormValues>({
    resolver: zodResolver(eventoFormSchema),
    defaultValues,
  });

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
          description: "El evento se ha creado exitosamente",
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
                        <SelectItem value="boda">Boda</SelectItem>
                        <SelectItem value="corporativo">Corporativo</SelectItem>
                        <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
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
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en-curso">En curso</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientesFrecuentes.map(cliente => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </SelectItem>
                          ))}
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar planner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {planners.map(planner => (
                          <SelectItem key={planner.id} value={planner.id}>
                            {planner.nombre}
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