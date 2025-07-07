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
import { useEffect, useState, useMemo, useCallback } from "react";
import { CalendarIcon, Plus, Edit2, Search, Loader2, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Cliente, Proveedor, Evento, Equipo, getClientes, getProveedores, getEventos, getEquipo, searchClientes, searchProveedores, searchEventos, searchEquipo } from "@/app/services/relations";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Comentado Command
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import debounce from 'lodash/debounce';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface DolarBlue {
  venta: number;
  compra: number;
}

type FormData = {
  type: 'cobro' | 'pago';
  especie: 'efectivo' | 'trasferencia';
  moneda: 'ars' | 'usd';
  categoria: 'evento' | 'oficina';
  subcargo: string;
  detalle?: string;
  montoEspera: number;
  dolarEsperado: number;
  fechaEspera: Date;
  esEsperado: boolean;
  comentario?: string;
  cliente_id?: string;
  proveedor_id?: string;
  evento_id?: string;
  equipo_id?: string;
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
      { value: 'clientes', label: 'Clientes (Comisión)' }
    ];
  }

  // Default, should ideally be more specific or empty
  return [{ value: 'otros', label: 'Otros' }];
};

const getAvailableDetalles = (type: string, categoria: string, subcargo: string) => {
  if (type === 'cobro' && categoria === 'oficina' && subcargo === 'cambio-divisas') {
    return [
      { value: 'compra-usd', label: 'Compra USD' },
      { value: 'venta-usd', label: 'Venta USD' }
    ];
  }
  if (type === 'cobro' && categoria === 'evento' && subcargo === 'clientes') {
    return [
      { value: 'comision', label: 'Comisión' },
      { value: 'honorarios', label: 'Honorarios' }
    ];
  }
  if (type === 'pago' && categoria === 'oficina' && subcargo === 'deriva') {
    return [
      { value: 'Noe', label: 'Noe' },
      { value: 'Loli', label: 'Loli' }
    ];
  }
  if (type === 'pago' && categoria === 'evento') {
    return [
      { value: 'maquillaje', label: 'Maquillaje' },
      { value: 'viandas', label: 'Viandas' },
      { value: 'viatico', label: 'Viático' },
      { value: 'handy', label: 'Handy' },
      { value: 'honorarios', label: 'Honorarios' },
      { value: 'planner', label: 'Planner' },
      { value: 'staff', label: 'Staff' },
      { value: 'seguro', label: 'Seguro' },
      { value: 'otros', label: 'Otros' }
    ];
  }
  if (type === 'pago' && categoria === 'oficina') {
    if (subcargo === 'impuestos') return [
      {value: 'iva', label: 'IVA'},
      {value: 'ingresos_brutos', label: 'Ingresos Brutos'},
      {value: 'autonomo', label: 'Autónomo'},
      {value: 'formulario_931', label: 'Formulario 931'},
      {value: 'ofceca', label: 'OFCECA'}
    ];
    if (subcargo === 'servicios') return [
      {value: 'luz', label: 'Luz'},
      {value: 'agua', label: 'Agua'},
      {value: 'otros', label: 'Otros'},
      {value: 'internet', label: 'Internet'},
      {value: 'abl', label: 'ABL'},
      {value: 'telefono', label: 'Teléfono'}
    ];
    return [{ value: 'otros', label: 'Otros' }];
  }
  return [{ value: 'otros', label: 'Otros' }];
};

// Componente de búsqueda reutilizable con Command
// interface SearchableCommandProps<T> {
//   valueId: string | null;
//   valueName: string | null;
//   onSearch: (query: string) => void;
//   placeholder: string;
//   searchPlaceholder: string;
//   items: T[];
//   onSelect: (item: T) => void;
//   getItemValue: (item: T) => string;
//   getItemLabel: (item: T) => string;
//   getItemSubtext?: (item: T) => string | null | undefined;
//   isLoading?: boolean;
//   triggerClassName?: string;
// }

// function SearchableCommand<T>({
//   valueId,
//   valueName,
//   onSearch,
//   placeholder,
//   searchPlaceholder,
//   items,
//   onSelect,
//   getItemValue,
//   getItemLabel,
//   getItemSubtext,
//   isLoading,
//   triggerClassName,
// }: SearchableCommandProps<T>) {
//   const [openPopover, setOpenPopover] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   const debouncedSearchHandler = useMemo(() => debounce(onSearch, 300), [onSearch]);

//   const handleSearchChange = (query: string) => {
//     setSearchQuery(query);
//     debouncedSearchHandler(query);
//   };

//   return (
//     <Command shouldFilter={false} className="border rounded-md">
//       <CommandInput
//         placeholder={searchPlaceholder}
//         value={searchQuery}
//         onValueChange={handleSearchChange}
//       />
//       <CommandList>
//         {isLoading && (
//           <div className="p-2 text-sm text-center text-muted-foreground flex items-center justify-center">
//             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//             Buscando...
//           </div>
//         )}
//         {!isLoading && items.length === 0 && searchQuery !== '' && (
//           <CommandEmpty>No se encontraron resultados.</CommandEmpty>
//         )}
//         {!isLoading && items.length === 0 && searchQuery === '' && (
//           <CommandEmpty>Escribe para buscar {placeholder.toLowerCase().replace("buscar ", "")}...</CommandEmpty>
//         )}
//         <CommandGroup>
//           {items.map((item) => (
//             <CommandItem
//               key={getItemValue(item)}
//               value={getItemValue(item)}
//               onSelect={() => {
//                 console.log("SearchableCommand: CommandItem onSelect triggered. Item:", item, "Value:", getItemValue(item));
//                 onSelect(item);
//                 setSearchQuery("");
//               }}
//             >
//               <div>
//                 {getItemLabel(item)}
//                 {getItemSubtext && getItemSubtext(item) && (
//                   <div className="text-xs text-muted-foreground">
//                     {getItemSubtext(item)}
//                   </div>
//                 )}
//               </div>
//             </CommandItem>
//           ))}
//         </CommandGroup>
//       </CommandList>
//     </Command>
//   );
// } // Fin de SearchableCommand comentado

const formSchema = z.object({
  type: z.enum(['cobro', 'pago']),
  especie: z.enum(['efectivo', 'trasferencia']),
  moneda: z.enum(['ars', 'usd']),
  categoria: z.enum(['evento', 'oficina']),
  subcargo: z.string().min(1, "Subcargo es requerido"),
  detalle: z.string().optional(),
  montoEspera: z.number().min(0.01, "El monto debe ser mayor a 0"),
  dolarEsperado: z.number(),
  fechaEspera: z.date(),
  esEsperado: z.boolean(),
  comentario: z.string().optional(),
  cliente_id: z.string().optional(),
  proveedor_id: z.string().optional(),
  evento_id: z.string().optional(),
  equipo_id: z.string().optional(),
});

export function CreateRecordDialog({ onRecordCreated, mode = 'create', recordToEdit }: CreateRecordDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [dolarBlue, setDolarBlue] = useState<DolarBlue | null>(null);
  
  // Estados para las listas de resultados de búsqueda
  const [clientesResult, setClientesResult] = useState<Cliente[]>([]);
  const [proveedoresResult, setProveedoresResult] = useState<Proveedor[]>([]);
  const [eventosResult, setEventosResult] = useState<Evento[]>([]);
  const [equipoResult, setEquipoResult] = useState<Equipo[]>([]);

  // Estados para los nombres seleccionados (para mostrar en el trigger del Popover)
  const [selectedClienteName, setSelectedClienteName] = useState<string | null>(null);
  const [selectedProveedorName, setSelectedProveedorName] = useState<string | null>(null);
  const [selectedEventoName, setSelectedEventoName] = useState<string | null>(null);
  const [selectedEquipoName, setSelectedEquipoName] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(false);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [isLoadingEquipo, setIsLoadingEquipo] = useState(false);

  const defaultFormValues = useMemo(() => ({
    type: "cobro" as 'cobro' | 'pago',
    especie: "efectivo" as 'efectivo' | 'trasferencia',
    moneda: "ars" as 'ars' | 'usd',
    categoria: "oficina" as 'evento' | 'oficina',
    subcargo: "",
    detalle: "",
    montoEspera: 0,
    dolarEsperado: 0,
    fechaEspera: new Date(),
    esEsperado: true,
    comentario: "",
    cliente_id: "",
    proveedor_id: "",
    evento_id: "",
    equipo_id: "",
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
    mode: "onChange"
  });

  useEffect(() => {
    if (mode === 'edit' && recordToEdit) {
      const getNombreFromId = (id: string, list: any[], nameKey = 'nombre') => list.find(item => item.id === id)?.[nameKey] || null;
      
      form.reset({
        type: recordToEdit.type,
        especie: recordToEdit.especie,
        moneda: recordToEdit.moneda,
        categoria: recordToEdit.categoria,
        subcargo: recordToEdit.subcargo,
        detalle: recordToEdit.detalle,
        montoEspera: recordToEdit.montoEspera,
        dolarEsperado: recordToEdit.dolarEsperado,
        fechaEspera: recordToEdit.fechaEspera ? new Date(recordToEdit.fechaEspera) : new Date(),
        esEsperado: recordToEdit.esEsperado ?? true,
        comentario: recordToEdit.comentario || "",
        cliente_id: typeof recordToEdit.cliente_id === 'object' ? recordToEdit.cliente_id.id : (recordToEdit.cliente_id || ""),
        proveedor_id: typeof recordToEdit.proveedor_id === 'object' ? recordToEdit.proveedor_id.id : (recordToEdit.proveedor_id || ""),
        evento_id: typeof recordToEdit.evento_id === 'object' ? recordToEdit.evento_id.id : (recordToEdit.evento_id || ""),
        equipo_id: typeof recordToEdit.equipo_id === 'object' ? recordToEdit.equipo_id.id : (recordToEdit.equipo_id || ""),
      });

      if (typeof recordToEdit.cliente_id === 'object' && recordToEdit.cliente_id?.nombre) {
        setSelectedClienteName(recordToEdit.cliente_id.nombre);
      } else if (recordToEdit.cliente_id && typeof recordToEdit.cliente_id === 'string') {
        // Necesitaríamos una forma de obtener el nombre del cliente solo con el ID si no está expandido
        // Por ahora, si solo hay ID, el usuario tendrá que volver a buscarlo para ver el nombre.
        // O podríamos hacer un fetch específico aquí.
      }

      if (typeof recordToEdit.proveedor_id === 'object' && recordToEdit.proveedor_id?.nombre) {
        setSelectedProveedorName(recordToEdit.proveedor_id.nombre);
      }

      if (typeof recordToEdit.evento_id === 'object' && recordToEdit.evento_id?.nombre) {
        setSelectedEventoName(recordToEdit.evento_id.nombre);
      }

      if (typeof recordToEdit.equipo_id === 'object' && recordToEdit.equipo_id?.nombre) {
        setSelectedEquipoName(recordToEdit.equipo_id.nombre);
      }

    } else {
      form.reset(defaultFormValues);
      setSelectedClienteName(null);
      setSelectedProveedorName(null);
      setSelectedEventoName(null);
      setSelectedEquipoName(null);
    }
  }, [mode, recordToEdit, form, defaultFormValues, open]);

  const currentType = form.watch('type');
  const currentCategoria = form.watch('categoria');
  const currentSubcargo = form.watch('subcargo');

  const availableSubcargos = React.useMemo(() => getAvailableSubcargos(currentType, currentCategoria), [currentType, currentCategoria]);
  const availableDetalles = React.useMemo(() => getAvailableDetalles(currentType, currentCategoria, currentSubcargo), [currentType, currentCategoria, currentSubcargo]);

  useEffect(() => {
    const currentSubcargoValue = form.getValues('subcargo');
    if (!availableSubcargos.find(s => s.value === currentSubcargoValue)) {
      form.setValue('subcargo', availableSubcargos[0]?.value || '');
    }
  }, [availableSubcargos, form]);

  useEffect(() => {
    const currentDetalleValue = form.getValues('detalle');
    if (!availableDetalles.find(d => d.value === currentDetalleValue)) {
      form.setValue('detalle', availableDetalles[0]?.value || '');
    }
  }, [availableDetalles, form]);

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
  }, [open, form.watch('moneda'), dolarBlue]);

  useEffect(() => {
    const moneda = form.watch('moneda');
    const montoEspera = form.watch('montoEspera');
    if (moneda === 'ars' && dolarBlue && montoEspera > 0) {
      const dolarCalculado = montoEspera / dolarBlue.venta;
      form.setValue('dolarEsperado', Number(dolarCalculado.toFixed(2)));
    } else if (moneda === 'usd' && montoEspera > 0) {
      form.setValue('dolarEsperado', montoEspera);
    } else {
       form.setValue('dolarEsperado', 0);
    }
  }, [form.watch('moneda'), form.watch('montoEspera'), dolarBlue, form]);

  // Funciones para buscar en la API (sin debounce aquí, se aplica en SearchableCommand)
  const searchAPI = useMemo(
    () => ({
      cliente: async (value: string) => {
        if (!value.trim()) {
          setClientesResult([]);
          // No es necesario setIsLoadingClientes(false) aquí si no se puso true
          return;
        }
        setIsLoadingClientes(true);
        try {
          const results = await searchClientes(value);
          setClientesResult(results);
        } catch (error) {
          console.error('Error buscando clientes:', error);
          setClientesResult([]); // Limpiar resultados en caso de error
        } finally {
          setIsLoadingClientes(false);
        }
      },
      proveedor: async (value: string) => {
        if (!value.trim()) {
          setProveedoresResult([]);
          return;
        }
        setIsLoadingProveedores(true);
        try {
          const results = await searchProveedores(value);
          setProveedoresResult(results);
        } catch (error) {
          console.error('Error buscando proveedores:', error);
          setProveedoresResult([]);
        } finally {
          setIsLoadingProveedores(false);
        }
      },
      evento: async (value: string) => {
        if (!value.trim()) {
          setEventosResult([]);
          return;
        }
        setIsLoadingEventos(true);
        try {
          const results = await searchEventos(value);
          setEventosResult(results);
        } catch (error) {
          console.error('Error buscando eventos:', error);
          setEventosResult([]);
        } finally {
          setIsLoadingEventos(false);
        }
      },
      equipo: async (value: string) => {
        if (!value.trim()) {
          setEquipoResult([]);
          return;
        }
        setIsLoadingEquipo(true);
        try {
          const results = await searchEquipo(value);
          setEquipoResult(results);
        } catch (error) {
          console.error('Error buscando equipo:', error);
          setEquipoResult([]);
        } finally {
          setIsLoadingEquipo(false);
        }
      }
    }),
    [] // Dependencies: searchClientes, searchProveedores, etc. si fueran props o cambiaran. Como son imports, está bien vacío.
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const recordData: Partial<ContabilidadRecord> = {
        type: values.type,
        especie: values.especie,
        moneda: values.moneda,
        categoria: values.categoria,
        subcargo: values.subcargo as ContabilidadRecord['subcargo'],
        detalle: (values.detalle || 'otros') as ContabilidadRecord['detalle'],
        montoEspera: Number(values.montoEspera),
        dolarEsperado: Number(values.dolarEsperado),
        fechaEspera: values.fechaEspera.toISOString(),
        esEsperado: values.esEsperado,
      };

      // Solo agregar campos opcionales si tienen valor
      if (values.comentario) recordData.comentario = values.comentario;
      if (values.cliente_id) recordData.cliente_id = values.cliente_id;
      if (values.proveedor_id) recordData.proveedor_id = values.proveedor_id;
      if (values.evento_id) recordData.evento_id = values.evento_id;
      if (values.equipo_id) recordData.equipo_id = values.equipo_id;

      if (!values.esEsperado) {
        recordData.fechaEfectuado = new Date().toISOString();
      }

      if (mode === 'create') {
        await createContabilidadRecord(recordData as Omit<ContabilidadRecord, 'id' | 'created' | 'updated'>);
        toast({ title: "¡Registro creado!", description: "El registro contable ha sido creado exitosamente." });
      } else {
        if (!recordToEdit?.id) throw new Error('No se puede editar sin ID de registro existente.');
        await updateContabilidadRecord(recordToEdit.id, recordData);
        toast({ title: "¡Registro actualizado!", description: "El registro contable ha sido actualizado exitosamente." });
      }

      setOpen(false);
      form.reset(defaultFormValues);
      setSelectedClienteName(null);
      setSelectedProveedorName(null);
      setSelectedEventoName(null);
      setSelectedEquipoName(null);
      setClientesResult([]);
      setProveedoresResult([]);
      setEventosResult([]);
      setEquipoResult([]);

      if (onRecordCreated) {
        onRecordCreated();
      }
    } catch (error) {
      console.error('Error en la operación:', error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar el registro";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if (!open) {
      form.reset(defaultFormValues);
      setSelectedClienteName(null);
      setSelectedProveedorName(null);
      setSelectedEventoName(null);
      setSelectedEquipoName(null);
      setClientesResult([]);
      setProveedoresResult([]);
      setEventosResult([]);
      setEquipoResult([]);
      setDolarBlue(null);
    }
  }, [open, form, defaultFormValues]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button> <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8"> <Edit2 className="h-4 w-4" /> </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle>{mode === 'create' ? 'Crear Nuevo Registro' : 'Editar Registro'}</DialogTitle>
          {dolarBlue && form.getValues('moneda') === 'usd' && (
          <DialogDescription>
              Dólar Blue: Compra ${dolarBlue.compra} | Venta ${dolarBlue.venta}
          </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {/* Primera fila: Tipo, Método, Moneda */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💰 Tipo *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value as 'cobro' | 'pago')} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="cobro">Cobro</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="especie" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💳 Método *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value as 'efectivo' | 'trasferencia')} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="efectivo">Efectivo</SelectItem><SelectItem value="trasferencia">Transferencia</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="moneda" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💵 Moneda *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value as 'ars' | 'usd')} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="ars">ARS</SelectItem><SelectItem value="usd">USD</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
            </div>

            {/* Segunda fila: Monto y Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="montoEspera" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>💰 Monto *</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.01" min="0.01" placeholder="Ingrese el monto"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) || value <= 0 ? '' : value);
                        }}
                      value={field.value || ''}
                      />
                    </FormControl>
                    {form.watch('moneda') === "ars" && dolarBlue && field.value > 0 && (
                      <FormDescription className="text-xs">
                      ≈ USD {(Number(field.value) / dolarBlue.venta).toFixed(2)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
              )} />
              <div className="space-y-3">
                <FormField control={form.control} name="fechaEspera" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>📅 Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                      <FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                      </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                      <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="esEsperado" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>⏳ Fecha Programada</FormLabel>
                        <FormDescription className="text-xs">
                        {field.value ? "Esta fecha es programada (el pago aún no se realizó)" : "Esta fecha es efectiva (el pago ya se realizó)"}
                        </FormDescription>
                      </div>
                    </FormItem>
                )} />
              </div>
            </div>

            {/* Tercera fila: Categoría, Subcargo y Detalle */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>📁 Categoría *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value as 'evento' | 'oficina')} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="evento">Evento</SelectItem><SelectItem value="oficina">Oficina</SelectItem></SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="subcargo" render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>📑 Subcargo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>
                      {availableSubcargos.map(({ value, label }) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )} />
              {(currentType === 'cobro' || 
                (currentType === 'pago' && currentCategoria === 'oficina' && 
                  (currentSubcargo === 'deriva' || currentSubcargo === 'servicios' || currentSubcargo === 'impuestos')
                )
              ) && (
                 <FormField control={form.control} name="detalle" render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>🔍 Detalle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar (opcional)" /></SelectTrigger></FormControl>
                        <SelectContent>
                        {availableDetalles.map(({ value, label }) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />
              )}
            </div>

            {/* Cuarta fila: Cliente y Proveedor */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="cliente_id" render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                    <FormLabel>👤 Cliente</FormLabel>
                  {isLoadingClientes && <div className="p-2 text-sm flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                  <ReactSearchAutocomplete
                    items={clientesResult.map(c => ({ ...c, name: c.nombre }))}
                    onSearch={(string, results) => {
                      searchAPI.cliente(string);
                    }}
                    onSelect={(item: Cliente) => {
                      console.log("Cliente selected (RSA):", item);
                      field.onChange(item.id);
                      setSelectedClienteName(item.nombre);
                    }}
                    onClear={() => {
                      field.onChange("");
                      setSelectedClienteName(null);
                      setClientesResult([]);
                    }}
                        placeholder="Buscar cliente..."
                    autoFocus={false}
                    resultStringKeyName="name"
                    inputSearchString={selectedClienteName || ""}
                    styling={{
                      height: "38px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      boxShadow: "none",
                      hoverBackgroundColor: "#F3F4F6",
                      color: "#111827",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      clearIconMargin: "3px 8px 0 0",
                      zIndex: 10,
                    }}
                      />
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="proveedor_id" render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                    <FormLabel>🏢 Proveedor</FormLabel>
                  {isLoadingProveedores && <div className="p-2 text-sm flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                  <ReactSearchAutocomplete
                    items={proveedoresResult.map(p => ({ ...p, name: p.nombre }))}
                    onSearch={(string, results) => searchAPI.proveedor(string)}
                    onSelect={(item: Proveedor) => {
                      field.onChange(item.id);
                      setSelectedProveedorName(item.nombre);
                    }}
                    onClear={() => {
                        field.onChange("");
                        setSelectedProveedorName(null);
                        setProveedoresResult([]);
                    }}
                        placeholder="Buscar proveedor..."
                    autoFocus={false}
                    resultStringKeyName="name"
                    inputSearchString={selectedProveedorName || ""}
                    styling={{
                      height: "38px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      boxShadow: "none",
                      hoverBackgroundColor: "#F3F4F6",
                      color: "#111827",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      clearIconMargin: "3px 8px 0 0",
                      zIndex: 9,
                    }}
                      />
                    <FormMessage />
                  </FormItem>
              )} />
            </div>

            {/* Quinta fila: Evento y Equipo */}
            <div className="grid grid-cols-2 gap-3">
               <FormField control={form.control} name="evento_id" render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                    <FormLabel>🎉 Evento</FormLabel>
                  {isLoadingEventos && <div className="p-2 text-sm flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                  <ReactSearchAutocomplete
                    items={eventosResult.map(e => ({ ...e, name: e.nombre }))}
                    onSearch={(string, results) => searchAPI.evento(string)}
                    onSelect={(item: Evento) => {
                      field.onChange(item.id);
                      setSelectedEventoName(item.nombre);
                    }}
                    onClear={() => {
                        field.onChange("");
                        setSelectedEventoName(null);
                        setEventosResult([]);
                    }}
                        placeholder="Buscar evento..."
                    autoFocus={false}
                    resultStringKeyName="name"
                    inputSearchString={selectedEventoName || ""}
                    styling={{
                      height: "38px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      boxShadow: "none",
                      hoverBackgroundColor: "#F3F4F6",
                      color: "#111827",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      clearIconMargin: "3px 8px 0 0",
                      zIndex: 8,
                    }}
                      />
                    <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="equipo_id" render={({ field }) => (
                <FormItem className="flex flex-col space-y-1">
                    <FormLabel>👥 Equipo</FormLabel>
                  {isLoadingEquipo && <div className="p-2 text-sm flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</div>}
                   <ReactSearchAutocomplete
                    items={equipoResult.map(eq => ({ ...eq, name: eq.nombre }))}
                    onSearch={(string, results) => searchAPI.equipo(string)}
                    onSelect={(item: Equipo) => {
                      field.onChange(item.id);
                      setSelectedEquipoName(item.nombre);
                    }}
                    onClear={() => {
                        field.onChange("");
                        setSelectedEquipoName(null);
                        setEquipoResult([]);
                    }}
                    placeholder="Buscar miembro..."
                    autoFocus={false}
                    resultStringKeyName="name"
                    inputSearchString={selectedEquipoName || ""}
                    styling={{
                      height: "38px",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      backgroundColor: "white",
                      boxShadow: "none",
                      hoverBackgroundColor: "#F3F4F6",
                      color: "#111827",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      clearIconMargin: "3px 8px 0 0",
                      zIndex: 7,
                    }}
                  />
                    <FormMessage />
                  </FormItem>
              )} />
            </div>

            {/* Sexta fila: Comentarios */}
            <FormField control={form.control} name="comentario" render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>💭 Comentarios</FormLabel>
                  <FormControl>
                  <Textarea placeholder="Agregar comentarios adicionales..." className="min-h-[60px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-muted-foreground">
                {form.formState.isValid ? (
                  "✅ Formulario listo"
                ) : (
                  <span className="text-destructive">
                    ⚠️ {Object.values(form.formState.errors)[0]?.message || "Complete los campos requeridos"}
                  </span>
                )}
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="ml-auto" 
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  mode === 'create' ? 'Guardar' : 'Actualizar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 