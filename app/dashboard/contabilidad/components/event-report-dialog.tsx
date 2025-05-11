'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3 } from "lucide-react";
import { ContabilidadRecord } from "@/app/services/contabilidad";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventReportDialogProps {
  records: ContabilidadRecord[];
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Fecha inválida';
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Error en fecha';
  }
};

const formatCurrency = (amount: number, currency: string): string => {
  return amount.toLocaleString('es-AR', {
    style: 'currency',
    currency: currency === 'ars' ? 'ARS' : 'USD'
  });
};

interface EventTotals {
  ingresos: {
    ars: number;
    usd: number;
  };
  egresos: {
    ars: number;
    usd: number;
  };
  records: ContabilidadRecord[];
}

export function EventReportDialog({ records }: EventReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'evento' | 'oficina'>('evento');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState<any[]>([]);

  // Cargar eventos al abrir el diálogo
  useEffect(() => {
    async function fetchEventos() {
      if (open && selectedCategory === 'evento') {
        setLoading(true);
        try {
          const response = await fetch('/api/eventos');
          const result = await response.json();
          if (result.success) {
            console.log("Eventos cargados:", result.data);
            setEventos(result.data);
          }
        } catch (error) {
          console.error("Error al cargar eventos:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchEventos();
  }, [open, selectedCategory]);

  // Filtrar registros por categoría y evento
  const filteredRecords = records.filter(r => {
    // Primero verificamos la categoría
    if (r.categoria !== selectedCategory) return false;
    
    // Si hay un evento seleccionado, filtramos por ese evento específico
    if (selectedEvent && r.evento_id) {
      console.log('Comparando evento:', {
        recordEventId: r.evento_id,
        selectedEvent: selectedEvent,
        match: r.evento_id === selectedEvent
      });
      return r.evento_id === selectedEvent;
    }
    
    return true;
  });

  // Obtener lista única de clientes
  const clients = filteredRecords
    .filter(r => {
      const cliente = r.cliente_id;
      return typeof cliente === 'object' && cliente?.nombre;
    })
    .reduce((acc, record) => {
      const cliente = record.cliente_id;
      if (!cliente || typeof cliente !== 'object') return acc;
      
      const clientId = cliente.id;
      const clientName = cliente.nombre;
      
      if (!acc.some(c => c.id === clientId)) {
        acc.push({
          id: clientId,
          nombre: clientName
        });
      }
      return acc;
    }, [] as Array<{ id: string; nombre: string }>)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Filtrar eventos basados en el cliente seleccionado
  const filteredEvents = eventos
    .filter(event => {
      if (selectedClient === 'all') return true;
      return event.cliente?.id === selectedClient;
    })
    .map(event => ({
      id: event.id,
      nombre: event.nombre,
      cliente_id: event.cliente?.id
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Calcular totales por evento
  const eventTotals = filteredRecords.reduce((acc, record) => {
    const evento = record.evento_id;
    if (!evento || typeof evento !== 'object') return acc;
    
    const eventId = evento.id;
    const eventName = evento.nombre;
    
    if (!acc[eventId]) {
      acc[eventId] = {
        nombre: eventName,
        ingresos: { ars: 0, usd: 0 },
        egresos: { ars: 0, usd: 0 },
        registros: []
      };
    }
    
    if (record.type === 'cobro') {
      if (record.moneda === 'ars') {
        acc[eventId].ingresos.ars += record.montoEspera;
      } else {
        acc[eventId].ingresos.usd += record.montoEspera;
      }
    } else {
      if (record.moneda === 'ars') {
        acc[eventId].egresos.ars += record.montoEspera;
      } else {
        acc[eventId].egresos.usd += record.montoEspera;
      }
    }
    
    acc[eventId].registros.push(record);
    return acc;
  }, {} as Record<string, {
    nombre: string;
    ingresos: { ars: number; usd: number };
    egresos: { ars: number; usd: number };
    registros: ContabilidadRecord[];
  }>);

  // Obtener los registros del evento seleccionado
  const selectedEventData = selectedEvent ? eventTotals[selectedEvent] : null;
  const selectedEventRecords = selectedEventData?.registros || [];

  // Calcular totales solo para el evento seleccionado
  const totals = selectedEvent ? {
    ingresos: selectedEventData?.ingresos || { ars: 0, usd: 0 },
    egresos: selectedEventData?.egresos || { ars: 0, usd: 0 }
  } : filteredRecords.reduce((acc, record) => {
    const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
    const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
    acc[type][moneda] += record.montoEspera;
    return acc;
  }, {
    ingresos: { ars: 0, usd: 0 },
    egresos: { ars: 0, usd: 0 }
  } as EventTotals);

  // Reset selected event when client or category changes
  useEffect(() => {
    setSelectedEvent(null);
  }, [selectedClient, selectedCategory]);

  // Calcular totales por cliente
  const clientTotals = filteredRecords.reduce((acc, record) => {
    const cliente = record.cliente_id;
    if (!cliente || typeof cliente !== 'object') return acc;
    
    const clientId = cliente.id;
    const clientName = cliente.nombre;
    
    if (!acc[clientId]) {
      acc[clientId] = {
        nombre: clientName,
        totalARS: 0,
        totalUSD: 0,
        registros: []
      };
    }
    
    if (record.moneda === 'ars') {
      acc[clientId].totalARS += record.montoEspera;
    } else {
      acc[clientId].totalUSD += record.montoEspera;
    }
    
    acc[clientId].registros.push(record);
    return acc;
  }, {} as Record<string, {
    nombre: string;
    totalARS: number;
    totalUSD: number;
    registros: ContabilidadRecord[];
  }>);

  // Calcular totales por proveedor
  const providerTotals = filteredRecords.reduce((acc, record) => {
    const proveedor = record.proveedor_id;
    if (!proveedor || typeof proveedor !== 'object') return acc;
    
    const providerId = proveedor.id;
    const providerName = proveedor.nombre;
    
    if (!acc[providerId]) {
      acc[providerId] = {
        nombre: providerName,
        totalARS: 0,
        totalUSD: 0,
        registros: []
      };
    }
    
    if (record.moneda === 'ars') {
      acc[providerId].totalARS += record.montoEspera;
    } else {
      acc[providerId].totalUSD += record.montoEspera;
    }
    
    acc[providerId].registros.push(record);
    return acc;
  }, {} as Record<string, {
    nombre: string;
    totalARS: number;
    totalUSD: number;
    registros: ContabilidadRecord[];
  }>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Reporte Analítico
          <Badge variant="secondary" className="ml-2">
            {filteredRecords.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Reporte Analítico</DialogTitle>
          <DialogDescription>
            Análisis detallado de ingresos y egresos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de Categoría */}
          <div className="w-full">
            <label className="text-sm font-medium mb-2 block text-muted-foreground">
              Categoría
            </label>
            <Select
              value={selectedCategory}
              onValueChange={(value: 'evento' | 'oficina') => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evento">Eventos</SelectItem>
                <SelectItem value="oficina">Oficina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros específicos para eventos */}
          {selectedCategory === 'evento' && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {clients.length > 0 && (
                <div className="w-full sm:w-auto">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Filtrar por Cliente
                  </label>
                  <Select
                    value={selectedClient}
                    onValueChange={(value) => setSelectedClient(value)}
                  >
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="w-full sm:w-auto">
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Seleccionar Evento
                </label>
                <Select
                  value={selectedEvent || ''}
                  onValueChange={(value) => setSelectedEvent(value)}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Seleccionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Cargando eventos...
                      </div>
                    ) : filteredEvents.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay eventos disponibles
                        {selectedClient !== 'all' && " para el cliente seleccionado"}
                      </div>
                    ) : (
                      filteredEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Resumen de Totales */}
          <div className="grid grid-cols-1 gap-4">
            {selectedEvent && selectedEventData ? (
              <div className="rounded-lg border p-6 bg-muted/30">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumen del Evento: {selectedEventData?.nombre || 'Sin nombre'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Ingresos */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-green-600">Ingresos</h4>
                    <div className="space-y-1">
                      <p className="text-sm flex justify-between">
                        <span>ARS:</span>
                        <span className="font-mono">{formatCurrency(selectedEventData.ingresos.ars, 'ars')}</span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span>USD:</span>
                        <span className="font-mono">{formatCurrency(selectedEventData.ingresos.usd, 'usd')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Egresos */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-red-600">Egresos</h4>
                    <div className="space-y-1">
                      <p className="text-sm flex justify-between">
                        <span>ARS:</span>
                        <span className="font-mono">{formatCurrency(selectedEventData.egresos.ars, 'ars')}</span>
                      </p>
                      <p className="text-sm flex justify-between">
                        <span>USD:</span>
                        <span className="font-mono">{formatCurrency(selectedEventData.egresos.usd, 'usd')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-blue-600">Balance</h4>
                    <div className="space-y-1">
                      <p className="text-sm flex justify-between font-medium">
                        <span>ARS:</span>
                        <span className={`font-mono ${(selectedEventData.ingresos.ars - selectedEventData.egresos.ars) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedEventData.ingresos.ars - selectedEventData.egresos.ars, 'ars')}
                        </span>
                      </p>
                      <p className="text-sm flex justify-between font-medium">
                        <span>USD:</span>
                        <span className={`font-mono ${(selectedEventData.ingresos.usd - selectedEventData.egresos.usd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedEventData.ingresos.usd - selectedEventData.egresos.usd, 'usd')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-2">Ingresos Totales</h3>
                  <div className="space-y-1">
                    <p className="text-sm">ARS: {formatCurrency(totals.ingresos.ars, 'ars')}</p>
                    <p className="text-sm">USD: {formatCurrency(totals.ingresos.usd, 'usd')}</p>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-2">Egresos Totales</h3>
                  <div className="space-y-1">
                    <p className="text-sm">ARS: {formatCurrency(totals.egresos.ars, 'ars')}</p>
                    <p className="text-sm">USD: {formatCurrency(totals.egresos.usd, 'usd')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Registros */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Subcargo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(selectedEvent ? selectedEventRecords : filteredRecords)
                  ?.sort((a, b) => new Date(b.fechaEspera || '').getTime() - new Date(a.fechaEspera || '').getTime())
                  .map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.especie}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.moneda === 'usd' ? 'outline' : 'secondary'}
                          className="font-medium"
                        >
                          {record.moneda.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.subcargo}</TableCell>
                      <TableCell>{record.detalle}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        <span className={record.type === 'cobro' ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(record.montoEspera, record.moneda)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(record.fechaEspera)}</TableCell>
                    </TableRow>
                  ))}
                {(selectedEvent ? selectedEventRecords : filteredRecords)?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No hay registros disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 