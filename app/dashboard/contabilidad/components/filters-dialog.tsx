'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const getAvailableSubcargos = (type: string, categoria: string) => {
  if (type === 'cobro' && categoria === 'oficina') {
    return [
      { value: 'cambio-divisas', label: 'Cambio de Divisas' },
      { value: 'ajuste-caja', label: 'Ajuste de Caja' },
      { value: 'caja-chica', label: 'Caja Chica' }
    ];
  }
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
      { value: 'servicios', label: 'Servicios' },
      { value: 'regaleria', label: 'Regalería' },
      { value: 'compras', label: 'Compras' },
      { value: 'sueldos', label: 'Sueldos' },
      { value: 'mensajeria', label: 'Mensajería' }
    ];
  }
  if (type === 'pago' && categoria === 'evento') {
    return [
      { value: 'otros', label: 'Otros' },
      { value: 'sueldos', label: 'Sueldos' }
    ];
  }
  if (type === 'cobro' && categoria === 'evento') {
    return [
      { value: 'clientes', label: 'Clientes' },
      { value: 'otros', label: 'Otros' }
    ];
  }
  return [];
};

const getAvailableDetalles = (type: string, categoria: string, subcargo: string) => {
    if (type === 'pago' && categoria === 'oficina' && subcargo === 'impuestos') {
        return [
            { value: 'iva', label: 'IVA' },
            { value: 'iibb', label: 'IIBB' },
            { value: 'monotributo', label: 'Monotributo' },
            { value: 'autonomos', label: 'Autónomos' },
            { value: 'sindicato', label: 'Sindicato' }
        ];
    }
    if (type === 'pago' && categoria === 'oficina' && subcargo === 'servicios') {
        return [
            { value: 'luz', label: 'Luz' },
            { value: 'gas', label: 'Gas' },
            { value: 'agua', label: 'Agua' },
            { value: 'internet', label: 'Internet' },
            { value: 'celular', label: 'Celular' }
        ];
    }
    if (type === 'pago' && categoria === 'evento' && subcargo === 'otros') {
        return [
            { value: 'comision', label: 'Comisión' },
            { value: 'viatico', label: 'Viático' },
            { value: 'seguro', label: 'Seguro' }
        ];
    }
    if (type === 'pago' && categoria === 'evento' && subcargo === 'sueldos') {
        return [
            { value: 'planner', label: 'Planner' },
            { value: 'handy', label: 'Handy' },
            { value: 'staff', label: 'Staff' },
            { value: 'maquillaje', label: 'Maquillaje' },
            { value: 'viandas', label: 'Viandas' }
        ];
    }
    if (type === 'cobro' && categoria === 'oficina' && subcargo === 'cambio-divisas') {
        return [
            { value: 'compra-usd', label: 'Compra USD' },
            { value: 'venta-usd', label: 'Venta USD' }
        ];
    }
    return [];
};
import { SearchInput } from "@/components/search-input";
import { 
  searchClientes,
  searchProveedores,
  searchEventos,
  Cliente,
  Proveedor,
  Evento
} from "@/app/services/relations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltersDialogProps {
  onFiltersChange: (filters: FilterValues) => void;
  activeFilters: number;
}

interface FilterValues {
  type?: 'cobro' | 'pago';
  categoria?: string;
  subcargo?: string;
  detalle?: string;
  cliente_id?: string;
  proveedor_id?: string;
  evento_id?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function FiltersDialog({ onFiltersChange, activeFilters }: FiltersDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(false);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);

  const form = useForm<FilterValues>({
    defaultValues: {
      type: undefined,
      categoria: undefined,
      subcargo: undefined,
      detalle: undefined,
      cliente_id: undefined,
      proveedor_id: undefined,
      evento_id: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
    }
  });

  const type = form.watch('type');
  const categoria = form.watch('categoria');
  const subcargo = form.watch('subcargo');

  const availableSubcargos = useMemo(() => {
    if (!type || !categoria) return [];
    return getAvailableSubcargos(type, categoria);
  }, [type, categoria]);

  const availableDetalles = useMemo(() => {
    if (!type || !categoria || !subcargo) return [];
    return getAvailableDetalles(type, categoria, subcargo);
  }, [type, categoria, subcargo]);

  useEffect(() => {
    if (form.getValues('subcargo')) {
      form.setValue('subcargo', undefined);
    }
  }, [type, categoria, form]);

  useEffect(() => {
    if (form.getValues('detalle')) {
      form.setValue('detalle', undefined);
    }
  }, [type, categoria, subcargo, form]);

  const handleClienteSearch = async (query: string) => {
    setIsLoadingClientes(true);
    try {
      const results = await searchClientes(query);
      setClientes(results);
    } catch (error) {
      console.error('Error buscando clientes:', error);
    } finally {
      setIsLoadingClientes(false);
    }
  };

  const handleProveedorSearch = async (query: string) => {
    setIsLoadingProveedores(true);
    try {
      const results = await searchProveedores(query);
      setProveedores(results);
    } catch (error) {
      console.error('Error buscando proveedores:', error);
    } finally {
      setIsLoadingProveedores(false);
    }
  };

  const handleEventoSearch = async (query: string) => {
    setIsLoadingEventos(true);
    try {
      const results = await searchEventos(query);
      setEventos(results);
    } catch (error) {
      console.error('Error buscando eventos:', error);
    } finally {
      setIsLoadingEventos(false);
    }
  };

  const onSubmit = (values: FilterValues) => {
    // Limpiar valores undefined o vacíos
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined && value !== '')
    );
    onFiltersChange(cleanedValues);
    setOpen(false);
  };

  const handleReset = () => {
    form.reset();
    onFiltersChange({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Filtrar Registros</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cobro">Cobro</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!type}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subcargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcargo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={availableSubcargos.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSubcargos.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detalle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalle</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={availableDetalles.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar detalle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDetalles.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaDesde"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Desde</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fechaHasta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Hasta</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <SearchInput
                      value={field.value}
                      onSearch={handleClienteSearch}
                      placeholder="Buscar cliente..."
                      isLoading={isLoadingClientes}
                      items={clientes}
                      onSelect={field.onChange}
                      formatLabel={(item) => `${item.nombre} ${item.apellido}`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proveedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <SearchInput
                      value={field.value}
                      onSearch={handleProveedorSearch}
                      placeholder="Buscar proveedor..."
                      isLoading={isLoadingProveedores}
                      items={proveedores}
                      onSelect={field.onChange}
                      formatLabel={(item) => item.nombre}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="evento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento</FormLabel>
                  <FormControl>
                    <SearchInput
                      value={field.value}
                      onSearch={handleEventoSearch}
                      placeholder="Buscar evento..."
                      isLoading={isLoadingEventos}
                      items={eventos}
                      onSelect={field.onChange}
                      formatLabel={(item) => item.nombre}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={handleReset}>
                Limpiar Filtros
              </Button>
              <Button type="submit">
                Aplicar Filtros
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 