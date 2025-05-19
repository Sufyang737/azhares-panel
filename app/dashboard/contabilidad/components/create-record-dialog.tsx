'use client';

import * as React from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { CalendarIcon, Plus, Edit2, Search, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Cliente, Proveedor, Evento, Equipo, getClientes, getProveedores, getEventos, getEquipo, searchClientes, searchProveedores, searchEventos, searchEquipo } from "@/app/services/relations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import debounce from 'lodash/debounce';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';

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

// Funciones memoizadas para las opciones
const getAvailableSubcargos = (type: string, categoria: string) => {
  // Caso 1: Cobro en oficina
  if (type === 'cobro' && categoria === 'oficina') {
    return [
      { value: 'cambio-divisas', label: 'Cambio de Divisas' },
      { value: 'ajuste-caja', label: 'Ajuste de Caja' },
      { value: 'mensajeria', label: 'Mensajería' }
    ];
  }
  
  // Caso 2: Pago en oficina
  if (type === 'pago' && categoria === 'oficina') {
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
  if (type === 'pago' && categoria === 'evento') {
    return [
      { value: 'otros', label: 'Otros' },
      { value: 'sueldos', label: 'Sueldos' }
    ];
  }

  // Caso 4: Cobro en evento
  if (type === 'cobro' && categoria === 'evento') {
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

const getAvailableDetalles = (type: string, categoria: string, subcargo: string) => {
  // Caso 1: Cobro en oficina con cambio de divisas
  if (type === 'cobro' && categoria === 'oficina' && subcargo === 'cambio-divisas') {
    return [
      { value: 'compra-usd', label: 'Compra USD' },
      { value: 'venta-usd', label: 'Venta USD' }
    ];
  }

  // Caso 2: Cobro en evento
  if (type === 'cobro' && categoria === 'evento') {
    return [
      { value: 'comision', label: 'Comisión' }
    ];
  }

  // Caso 3: Pago en evento
  if (type === 'pago' && categoria === 'evento') {
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

  // Caso 4: Pago en oficina
  if (type === 'pago' && categoria === 'oficina') {
    return [
      { value: 'honorarios', label: 'Honorarios' }
    ];
  }

  // Caso por defecto
  return [
    { value: 'honorarios', label: 'Honorarios' }
  ];
};

// Componente de búsqueda simplificado
interface SearchInputProps {
  value: string;
  onSearch: (query: string) => Promise<void>;
  placeholder: string;
  isLoading?: boolean;
  items: any[];
  onSelect: (value: string) => void;
}

function SearchInput({
  value,
  onSearch,
  placeholder,
  isLoading,
  items,
  onSelect
}: SearchInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
    }, 300),
    [onSearch]
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  // Función para formatear el nombre completo
  const formatName = (item: any) => {
    const nombre = item.nombre || '';
    const apellido = item.apellido ? ` ${item.apellido}` : '';
    return `${nombre}${apellido}`;
  };

  // Función para formatear el email/contacto
  const formatEmail = (email: string) => {
    if (!email) return '';
    const atIndex = email.indexOf('@');
    if (atIndex > 15) {
      return email.substring(0, 12) + '...' + email.substring(atIndex);
    }
    return email;
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? items.find(item => item.id === value)?.nombre || placeholder : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Buscar ${placeholder.toLowerCase()}...`}
              value={inputValue}
              onValueChange={handleInputChange}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Buscando...</span>
                  </div>
                ) : (
                  "No se encontraron resultados."
                )}
              </CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{formatName(item)}</span>
                      {(item.email || item.contacto) && (
                        <span className="text-xs text-muted-foreground">
                          {formatEmail(item.email || item.contacto)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
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
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(false);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [isLoadingEquipo, setIsLoadingEquipo] = useState(false);

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
      cliente_id: typeof recordToEdit?.cliente_id === 'object' ? recordToEdit.cliente_id.id : (recordToEdit?.cliente_id || "none"),
      proveedor_id: typeof recordToEdit?.proveedor_id === 'object' ? recordToEdit.proveedor_id.id : (recordToEdit?.proveedor_id || "none"),
      evento_id: typeof recordToEdit?.evento_id === 'object' ? recordToEdit.evento_id.id : (recordToEdit?.evento_id || "none"),
      equipo_id: typeof recordToEdit?.equipo_id === 'object' ? recordToEdit.equipo_id.id : (recordToEdit?.equipo_id || "none"),
    },
    mode: "onSubmit"
  });

  // Memoizar las opciones disponibles para evitar recálculos innecesarios
  const currentType = form.watch('type');
  const currentCategoria = form.watch('categoria');
  const currentSubcargo = form.watch('subcargo');

  const availableSubcargos = React.useMemo(() => getAvailableSubcargos(currentType, currentCategoria), [currentType, currentCategoria]);
  const availableDetalles = React.useMemo(() => getAvailableDetalles(currentType, currentCategoria, currentSubcargo), [currentType, currentCategoria, currentSubcargo]);

  // Cargar relaciones solo cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      const loadRelations = async () => {
        console.log('🔄 Iniciando carga de relaciones...');
        setIsLoadingClientes(true);
        setIsLoadingProveedores(true);
        setIsLoadingEventos(true);
        setIsLoadingEquipo(true);
        try {
          // Cargar todas las relaciones necesarias
          const [clientesData, proveedoresData, eventosData, equipoData] = await Promise.all([
            getClientes(),
            getProveedores(),
            getEventos(),
            getEquipo()
          ]);
          
          console.log('👥 Datos del equipo recibidos:', equipoData);
          
          // Si hay un ID de equipo seleccionado, verificar que exista
          const currentEquipoId = form.getValues('equipo_id');
          if (currentEquipoId && currentEquipoId !== 'none') {
            const equipoExists = equipoData.some(e => e.id === currentEquipoId);
            if (!equipoExists) {
              console.warn('🚨 ID de equipo inválido, reseteando a none');
              form.setValue('equipo_id', 'none');
            }
          }
          
          setClientes(clientesData);
          setProveedores(proveedoresData);
          setEventos(eventosData);
          setEquipo(equipoData);
        } catch (error) {
          console.error('❌ Error cargando relaciones:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar algunos datos. Por favor, intente nuevamente.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingClientes(false);
          setIsLoadingProveedores(false);
          setIsLoadingEventos(false);
          setIsLoadingEquipo(false);
        }
      };

      loadRelations();
    }
  }, [open, form]);

  // Cargar dólar blue solo si es necesario
  useEffect(() => {
    if (open && form.watch('moneda') === 'usd' && !dolarBlue) {
      const loadDolarBlue = async () => {
        try {
          const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
          const data = await response.json();
          setDolarBlue({
            venta: data.blue.value_sell,
            compra: data.blue.value_buy
          });
        } catch (error) {
          console.error('Error loading dolar blue:', error);
        }
      };

      loadDolarBlue();
    }
  }, [open, form.watch('moneda')]);

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

  // Funciones de búsqueda con debounce
  const debouncedSearch = useMemo(
    () => ({
      cliente: debounce(async (value: string) => {
        console.log('🔍 Buscando cliente:', value);
        setIsLoadingClientes(true);
        try {
          const results = await searchClientes(value);
          console.log('📋 Resultados clientes:', results);
          setClientes(results);
        } catch (error) {
          console.error('❌ Error buscando clientes:', error);
        } finally {
          setIsLoadingClientes(false);
        }
      }, 300),

      proveedor: debounce(async (value: string) => {
        console.log('🔍 Buscando proveedor:', value);
        setIsLoadingProveedores(true);
        try {
          const results = await searchProveedores(value);
          console.log('📋 Resultados proveedores:', results);
          setProveedores(results);
        } catch (error) {
          console.error('❌ Error buscando proveedores:', error);
        } finally {
          setIsLoadingProveedores(false);
        }
      }, 300),

      evento: debounce(async (value: string) => {
        console.log('🔍 Buscando evento:', value);
        setIsLoadingEventos(true);
        try {
          const results = await searchEventos(value);
          console.log('📋 Resultados eventos:', results);
          setEventos(results);
        } catch (error) {
          console.error('❌ Error buscando eventos:', error);
        } finally {
          setIsLoadingEventos(false);
        }
      }, 300),

      equipo: debounce(async (value: string) => {
        console.log('🔍 Buscando equipo:', value);
        setIsLoadingEquipo(true);
        try {
          const results = await searchEquipo(value);
          console.log('📋 Resultados equipo:', results);
          setEquipo(results);
        } catch (error) {
          console.error('❌ Error buscando equipo:', error);
        } finally {
          setIsLoadingEquipo(false);
        }
      }, 300)
    }),
    []
  );

  // Limpiar los debounces al desmontar
  useEffect(() => {
    return () => {
      debouncedSearch.cliente.cancel();
      debouncedSearch.proveedor.cancel();
      debouncedSearch.evento.cancel();
      debouncedSearch.equipo.cancel();
    };
  }, [debouncedSearch]);

  const onSubmit = async (values: FormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Validar que el ID del equipo exista antes de enviar
      if (values.equipo_id && values.equipo_id !== "none") {
        const equipoExists = equipo.some(e => e.id === values.equipo_id);
        if (!equipoExists) {
          throw new Error(`ID de equipo inválido: ${values.equipo_id}`);
        }
      }

      const recordData = {
        ...values,
        fechaEspera: values.fechaEspera.toISOString(),
        // Si no es fecha programada, establecer fechaEfectuado
        ...(values.esEsperado ? {} : { fechaEfectuado: new Date().toISOString() }),
        // Convertir "none" a cadena vacía para las relaciones
        cliente_id: values.cliente_id === "none" ? "" : values.cliente_id,
        proveedor_id: values.proveedor_id === "none" ? "" : values.proveedor_id,
        evento_id: values.evento_id === "none" ? "" : values.evento_id,
        equipo_id: values.equipo_id === "none" ? "" : values.equipo_id,
      };

      // Remover campos vacíos para evitar errores de validación
      Object.keys(recordData).forEach(key => {
        if (recordData[key] === "") {
          delete recordData[key];
        }
      });

      console.log('📤 Datos a enviar:', recordData);

      if (mode === 'create') {
        await createContabilidadRecord(recordData);
        toast({
          title: "¡Registro creado!",
          description: "El registro contable ha sido creado exitosamente.",
        });
      } else {
        if (!recordToEdit?.id) throw new Error('No se puede editar sin ID');
        await updateContabilidadRecord(recordToEdit.id, recordData);
        toast({
          title: "¡Registro actualizado!",
          description: "El registro contable ha sido actualizado exitosamente.",
        });
      }

      setOpen(false);
      if (onRecordCreated) {
        onRecordCreated();
      }
    } catch (error) {
      console.error('❌ Error en la operación:', error);
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
                      <FormLabel>📅 Fecha</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              // Crear la fecha usando los componentes locales
                              const [year, month, day] = e.target.value.split('-').map(Number);
                              const date = new Date(year, month - 1, day, 12, 0, 0);
                              field.onChange(date);
                            } else {
                              // Si no hay valor, usar la fecha actual
                              const now = new Date();
                              const today = new Date(
                                now.getFullYear(),
                                now.getMonth(),
                                now.getDate(),
                                12, 0, 0
                              );
                              field.onChange(today);
                            }
                          }}
                        />
                      </FormControl>
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
                        <FormLabel>⏳ Fecha Programada</FormLabel>
                        <FormDescription className="text-xs">
                          {field.value 
                            ? "Esta fecha es programada (el pago aún no se realizó)"
                            : "Esta fecha es efectiva (el pago ya se realizó)"}
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
                        {availableSubcargos.map(({ value, label }) => (
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
                          {availableDetalles.map(({ value, label }) => (
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
                    <FormControl>
                      <SearchInput
                        value={field.value}
                        onSearch={debouncedSearch.cliente}
                        placeholder="Buscar cliente..."
                        isLoading={isLoadingClientes}
                        items={clientes}
                        onSelect={field.onChange}
                      />
                    </FormControl>
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
                    <FormControl>
                      <SearchInput
                        value={field.value}
                        onSearch={debouncedSearch.proveedor}
                        placeholder="Buscar proveedor..."
                        isLoading={isLoadingProveedores}
                        items={proveedores}
                        onSelect={field.onChange}
                      />
                    </FormControl>
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
                    <FormControl>
                      <SearchInput
                        value={field.value}
                        onSearch={debouncedSearch.evento}
                        placeholder="Buscar evento..."
                        isLoading={isLoadingEventos}
                        items={eventos}
                        onSelect={field.onChange}
                      />
                    </FormControl>
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
                    <FormControl>
                      <SearchInput
                        value={field.value}
                        onSearch={debouncedSearch.equipo}
                        placeholder="Buscar miembro del equipo..."
                        isLoading={isLoadingEquipo}
                        items={equipo}
                        onSelect={field.onChange}
                      />
                    </FormControl>
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