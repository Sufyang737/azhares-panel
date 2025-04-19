'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createContabilidadRecord, updateContabilidadRecord, ContabilidadRecord } from "@/app/services/contabilidad";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { CalendarIcon, Plus, Edit2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Cliente, Proveedor, Evento, Equipo, getClientes, getProveedores, getEventos, getEquipo } from "@/app/services/relations";

interface DolarBlue {
  venta: number;
  compra: number;
}

type FormData = {
  type: 'cobro' | 'pago';
  especie: 'efectivo' | 'trasferencia';
  moneda: 'ars' | 'usd';
  categoria: 'evento' | 'oficina';
  subcargo: 'clientes' | 'otros' | 'proveedores' | 'sueldos' | 'mensajeria' | 
    'cambio-divisas' | 'ajuste-caja' | 'obra-social-empleada' | 
    'mantencion-cuenta-corriente' | 'seguro-galicia' | 'tarjeta-credito' | 
    'deriva' | 'expensas' | 'alquiler' | 'prepaga' | 'contador' | 
    'mantenimiento-pc' | 'impuestos' | 'servicio' | 'regaleria' | 'compras';
  detalle: 'compra-usd' | 'comision' | 'handy' | 'honorarios' | 'maquillaje' | 
    'planner' | 'staff' | 'viandas' | 'venta-usd' | 'viatico' | 'seguro';
  montoEspera: number;
  dolarEsperado: number;
  fechaEspera: Date;
  esEsperado: boolean;
  comentario: string;
  cliente_id: string;
  proveedor_id: string;
  evento_id: string;
  equipo_id: string;
};

interface CreateRecordDialogProps {
  onRecordCreated?: () => void;
  mode?: 'create' | 'edit';
  recordToEdit?: ContabilidadRecord;
}

export function CreateRecordDialog({ onRecordCreated, mode = 'create', recordToEdit }: CreateRecordDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dolarBlue, setDolarBlue] = useState<DolarBlue | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [equipo, setEquipo] = useState<Equipo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      type: recordToEdit?.type || "cobro",
      especie: recordToEdit?.especie || "efectivo",
      moneda: recordToEdit?.moneda || "ars",
      categoria: recordToEdit?.categoria || "oficina",
      subcargo: recordToEdit?.subcargo || "otros",
      detalle: recordToEdit?.detalle || "comision",
      montoEspera: recordToEdit?.montoEspera || 0,
      dolarEsperado: recordToEdit?.dolarEsperado || 0,
      fechaEspera: recordToEdit?.fechaEspera ? new Date(recordToEdit.fechaEspera) : new Date(),
      esEsperado: recordToEdit?.esEsperado ?? true,
      comentario: recordToEdit?.comentario || "",
      cliente_id: recordToEdit?.cliente_id || "none",
      proveedor_id: recordToEdit?.proveedor_id || "none",
      evento_id: recordToEdit?.evento_id || "none",
      equipo_id: recordToEdit?.equipo_id || "none",
    },
    mode: "onChange"
  });

  // Obtener los valores actuales
  const currentType = form.watch('type');
  const currentCategoria = form.watch('categoria');

  // Determinar las opciones disponibles de subcargo basadas en type y categoria
  const getAvailableSubcargos = () => {
    // Caso 1: Cobro en oficina
    if (currentType === 'cobro' && currentCategoria === 'oficina') {
      return [
        { value: 'cambio-divisas', label: 'Cambio de Divisas' },
        { value: 'ajuste-caja', label: 'Ajuste de Caja' },
        { value: 'mensajeria', label: 'Mensajería' }
      ];
    }
    
    // Caso 2: Pago en oficina
    if (currentType === 'pago' && currentCategoria === 'oficina') {
      return [
        { value: 'obra-social-empleada', label: 'Obra Social Empleada' },
        { value: 'mantencion-cuenta-corriente', label: 'Mantención Cuenta Corriente' },
        { value: 'seguro-galicia', label: 'Seguro Galicia' },
        { value: 'tarjeta-credito', label: 'Tarjeta de Crédito Business' },
        { value: 'deriva', label: 'Deriva' },
        { value: 'expensas', label: 'Expensas' },
        { value: 'alquiler', label: 'Alquiler' },
        { value: 'prepaga', label: 'Prepaga' },
        { value: 'contador', label: 'Contador' },
        { value: 'mantenimiento-pc', label: 'Mantenimiento PC' },
        { value: 'impuestos', label: 'Impuestos' },
        { value: 'servicio', label: 'Servicios' },
        { value: 'regaleria', label: 'Regalería' },
        { value: 'compras', label: 'Compras' },
        { value: 'sueldos', label: 'Sueldos' }
      ];
    }

    // Caso 3: Pago en evento
    if (currentType === 'pago' && currentCategoria === 'evento') {
      return [
        { value: 'otros', label: 'Otros' },
        { value: 'sueldos', label: 'Sueldos' }
      ];
    }

    // Caso 4: Cobro en evento
    if (currentType === 'cobro' && currentCategoria === 'evento') {
      return [
        { value: 'proveedores', label: 'Proveedores' },
        { value: 'clientes', label: 'Clientes' }
      ];
    }

    // Caso por defecto
    return [
      { value: 'clientes', label: 'Clientes' },
      { value: 'otros', label: 'Otros' },
      { value: 'proveedores', label: 'Proveedores' },
      { value: 'sueldos', label: 'Sueldos' }
    ];
  };

  // Determinar las opciones disponibles de detalle basadas en subcargo y categoria
  const getAvailableDetalles = () => {
    // Caso 1: Cobro en oficina con cambio de divisas
    if (currentType === 'cobro' && currentCategoria === 'oficina' && 
        form.watch('subcargo') === 'cambio-divisas') {
      return [
        { value: 'compra-usd', label: 'Compra USD' },
        { value: 'venta-usd', label: 'Venta USD' }
      ];
    }

    // Caso 2: Cobro en evento
    if (currentType === 'cobro' && currentCategoria === 'evento') {
      return [
        { value: 'comision', label: 'Comisión' }
      ];
    }

    // Caso 3: Pago en evento
    if (currentType === 'pago' && currentCategoria === 'evento') {
      return [
        { value: 'maquillaje', label: 'Maquillaje' },
        { value: 'viandas', label: 'Viandas' },
        { value: 'viatico', label: 'Viático' },
        { value: 'handy', label: 'Handy' },
        { value: 'honorarios', label: 'Honorarios' },
        { value: 'planner', label: 'Planner' },
        { value: 'staff', label: 'Staff' },
        { value: 'seguro', label: 'Seguro' }
      ];
    }

    // Caso 4: Pago en oficina - no mostrar detalles
    if (currentType === 'pago' && currentCategoria === 'oficina') {
      return [
        { value: 'honorarios', label: 'Honorarios' }
      ];
    }

    // Caso por defecto
    return [
      { value: 'compra-usd', label: 'Compra USD' },
      { value: 'comision', label: 'Comisión' },
      { value: 'handy', label: 'Handy' },
      { value: 'honorarios', label: 'Honorarios' },
      { value: 'maquillaje', label: 'Maquillaje' },
      { value: 'planner', label: 'Planner' },
      { value: 'staff', label: 'Staff' },
      { value: 'viandas', label: 'Viandas' },
      { value: 'venta-usd', label: 'Venta USD' },
      { value: 'viatico', label: 'Viático' },
      { value: 'seguro', label: 'Seguro' }
    ];
  };

  // Efecto para resetear subcargo y detalle cuando cambian type o categoria
  useEffect(() => {
    if (currentType === 'cobro' && currentCategoria === 'oficina') {
      form.setValue('subcargo', 'cambio-divisas');
      form.setValue('detalle', 'compra-usd');
    } else if (currentType === 'pago' && currentCategoria === 'oficina') {
      form.setValue('subcargo', 'obra-social-empleada');
      form.setValue('detalle', 'honorarios');
    } else if (currentType === 'pago' && currentCategoria === 'evento') {
      form.setValue('subcargo', 'otros');
      form.setValue('detalle', 'honorarios');
    } else if (currentType === 'cobro' && currentCategoria === 'evento') {
      form.setValue('subcargo', 'clientes');
      form.setValue('detalle', 'comision');
    }
  }, [currentType, currentCategoria, form]);

  useEffect(() => {
    const loadRelations = async () => {
      try {
        const [clientesData, proveedoresData, eventosData, equipoData] = await Promise.all([
          getClientes(),
          getProveedores(),
          getEventos(),
          getEquipo()
        ]);
        setClientes(clientesData);
        setProveedores(proveedoresData);
        setEventos(eventosData);
        setEquipo(equipoData);
      } catch (error) {
        console.error('Error loading relations:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos relacionados",
          variant: "destructive",
        });
      }
    };
    loadRelations();
  }, [toast]);

  useEffect(() => {
    const loadDolarBlue = async () => {
      try {
        const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
        const data = await response.json();
        setDolarBlue({
          venta: data.blue.value_sell,
          compra: data.blue.value_buy
        });
      } catch (error) {
        console.error('Error fetching dolar blue:', error);
        toast({
          title: "Error",
          description: "No se pudo obtener la cotización del dólar",
          variant: "destructive",
        });
      }
    };
    loadDolarBlue();
  }, [toast]);

  useEffect(() => {
    const moneda = form.watch('moneda');
    const montoEspera = form.watch('montoEspera');
    
    if (moneda === 'ars' && dolarBlue && montoEspera) {
      const dolarEsperado = montoEspera / dolarBlue.venta;
      form.setValue('dolarEsperado', Number(dolarEsperado.toFixed(2)));
    } else if (moneda === 'usd' && montoEspera) {
      form.setValue('dolarEsperado', montoEspera);
    }
  }, [form.watch('moneda'), form.watch('montoEspera'), dolarBlue, form]);

  const onSubmit = async (values: FormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let submitData = {
        ...values,
        fechaEspera: values.fechaEspera.toISOString(),
        cliente_id: values.cliente_id === "none" ? "" : values.cliente_id,
        proveedor_id: values.proveedor_id === "none" ? "" : values.proveedor_id,
        evento_id: values.evento_id === "none" ? "" : values.evento_id,
        equipo_id: values.equipo_id === "none" ? "" : values.equipo_id,
      };

      // Si es pago y oficina, eliminamos el campo detalle
      if (values.type === 'pago' && values.categoria === 'oficina') {
        const { detalle, ...dataWithoutDetalle } = submitData;
        submitData = dataWithoutDetalle;
      }
      
      if (mode === 'edit' && recordToEdit) {
        await updateContabilidadRecord(recordToEdit.id, submitData);
        toast({
          title: "Registro actualizado",
          description: "El registro contable se ha actualizado correctamente",
        });
      } else {
        await createContabilidadRecord(submitData);
        toast({
          title: "Registro creado",
          description: "El registro contable se ha creado correctamente",
        });
      }
      
      setOpen(false);
      form.reset();
      
      if (onRecordCreated) {
        onRecordCreated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el registro",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Registro' : 'Editar Registro'}
          </DialogTitle>
          <DialogDescription>
            {dolarBlue ? (
              `Dólar Blue: Compra $${dolarBlue.compra} | Venta $${dolarBlue.venta}`
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="grid gap-4"
          >
            {/* Primera fila: Tipo, Método, Moneda */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💰 Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cobro">Cobro</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="especie"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💳 Método *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="trasferencia">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💵 Moneda *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ars">ARS</SelectItem>
                        <SelectItem value="usd">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Segunda fila: Monto y Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="montoEspera"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💰 Monto *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Ingrese el monto"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    {form.watch('moneda') === "ars" && dolarBlue && field.value > 0 && (
                      <FormDescription className="text-xs">
                        ≈ USD {(field.value / dolarBlue.venta).toFixed(2)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="fechaEspera"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>📅 Fecha *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Seleccionar</span>
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
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="esEsperado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>⏳ Fecha Esperada</FormLabel>
                        <FormDescription className="text-xs">
                          Marcar si la fecha es estimada
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tercera fila: Categoría, Subcargo y Detalle */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>📁 Categoría *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subcargo"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>📑 Subcargo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getAvailableSubcargos().map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!(currentType === 'pago' && currentCategoria === 'oficina') && (
                <FormField
                  control={form.control}
                  name="detalle"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>🔍 Detalle *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailableDetalles().map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Cuarta fila: Cliente y Proveedor */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>👤 Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value}>
                            {field.value === "none" ? "Ninguno" : 
                              clientes.find(c => c.id === field.value)?.nombre || "Seleccionar"}
                          </SelectValue>
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
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>🏢 Proveedor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value}>
                            {field.value === "none" ? "Ninguno" : 
                              proveedores.find(p => p.id === field.value)?.nombre || "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {proveedores.map((proveedor) => (
                          <SelectItem key={proveedor.id} value={proveedor.id}>
                            {proveedor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quinta fila: Evento y Equipo */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="evento_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>🎉 Evento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value}>
                            {field.value === "none" ? "Ninguno" : 
                              eventos.find(e => e.id === field.value)?.nombre || "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {eventos.map((evento) => (
                          <SelectItem key={evento.id} value={evento.id}>
                            {evento.nombre}
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
                name="equipo_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>👥 Equipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value}>
                            {field.value === "none" ? "Ninguno" : 
                              equipo.find(m => m.id === field.value)?.nombre + " " + 
                              equipo.find(m => m.id === field.value)?.apellido || "Seleccionar"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {equipo.map((miembro) => (
                          <SelectItem key={miembro.id} value={miembro.id}>
                            {miembro.nombre} {miembro.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sexta fila: Comentarios */}
            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>💭 Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agregar comentarios adicionales..."
                      className="min-h-[60px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-muted-foreground">
                {form.formState.isValid ? "✅ Formulario completo" : "⚠️ Complete los campos requeridos"}
              </div>
              <Button
                type="submit"
                size="sm"
                className="ml-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 