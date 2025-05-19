'use client';

import { useState } from "react";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SearchInput } from "@/components/search-input";
import { 
  getClientes, 
  getProveedores, 
  getEventos,
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
  categoria?: string;
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
      categoria: undefined,
      cliente_id: undefined,
      proveedor_id: undefined,
      evento_id: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
    }
  });

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

  const loadInitialData = async () => {
    try {
      const [clientesData, proveedoresData, eventosData] = await Promise.all([
        getClientes(),
        getProveedores(),
        getEventos()
      ]);
      setClientes(clientesData);
      setProveedores(proveedoresData);
      setEventos(eventosData);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  const onSubmit = (values: FilterValues) => {
    // Limpiar valores undefined o vacíos
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([_, value]) => value !== undefined && value !== '')
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
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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