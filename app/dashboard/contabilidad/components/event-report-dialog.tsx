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

  // Filtrar registros por categoría
  const filteredRecords = records.filter(r => r.categoria === selectedCategory);

  // Obtener lista única de clientes
  const clients = filteredRecords
    .filter(r => r.cliente_id && r.cliente_id.nombre)
    .reduce((acc, record) => {
      const clientId = record.cliente_id?.id || record.cliente_id;
      const clientName = record.cliente_id?.nombre;
      
      if (!acc.some(c => c.id === clientId) && clientName) {
        acc.push({ 
          id: clientId,
          nombre: clientName
        });
      }
      return acc;
    }, [] as Array<{ id: string; nombre: string }>)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Obtener lista única de eventos
  const allEvents = records
    .filter(r => r.categoria === selectedCategory)
    .reduce((acc, record) => {
      // Verificar si el registro tiene un evento asociado
      if (record.evento_id) {
        const eventId = record.evento_id.id;
        const eventName = record.evento_id.nombre;
        const clientId = record.cliente_id?.id;
        
        // Solo agregar si no existe ya en el acumulador
        if (!acc.some(e => e.id === eventId)) {
          acc.push({
            id: eventId,
            nombre: eventName || 'Evento sin nombre',
            cliente_id: clientId
          });
        }
      }
      return acc;
    }, [] as Array<{ id: string; nombre: string; cliente_id?: string }>)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  console.log('Registros totales:', records.length);
  console.log('Registros filtrados por categoría:', records.filter(r => r.categoria === selectedCategory).length);
  console.log('Eventos encontrados:', allEvents);

  // Agrupar registros por evento
  const eventRecords = records
    .filter(r => r.categoria === selectedCategory)
    .filter(record => selectedClient === 'all' || record.cliente_id?.id === selectedClient)
    .reduce((acc, record) => {
      if (!record.evento_id?.id) return acc;
      
      const eventId = record.evento_id.id;

      if (!acc[eventId]) {
        acc[eventId] = {
          ingresos: { ars: 0, usd: 0 },
          egresos: { ars: 0, usd: 0 },
          records: [],
          nombre: record.evento_id.nombre || 'Evento sin nombre'
        };
      }

      const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
      const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
      acc[eventId][type][moneda] += record.montoEspera;
      acc[eventId].records.push(record);

      return acc;
    }, {} as Record<string, EventTotals & { nombre: string }>);

  // Calcular totales generales
  const totals = records
    .filter(r => r.categoria === selectedCategory)
    .filter(record => {
      if (selectedEvent) {
        return record.evento_id?.id === selectedEvent;
      }
      if (selectedClient !== 'all') {
        return record.cliente_id?.id === selectedClient;
      }
      return true;
    })
    .reduce((acc, record) => {
      const moneda = record.moneda.toLowerCase() as 'ars' | 'usd';
      const type = record.type === 'cobro' ? 'ingresos' : 'egresos';
      acc[type][moneda] += record.montoEspera;
      return acc;
    }, {
      ingresos: { ars: 0, usd: 0 },
      egresos: { ars: 0, usd: 0 }
    } as EventTotals);

  // Filtrar eventos basados en el cliente seleccionado
  const filteredEvents = selectedClient === 'all' 
    ? allEvents 
    : allEvents.filter(event => event.cliente_id === selectedClient);

  console.log('Eventos disponibles:', allEvents);
  console.log('Eventos filtrados:', filteredEvents);
  console.log('Cliente seleccionado:', selectedClient);

  const selectedEventData = selectedEvent ? eventRecords[selectedEvent] : null;

  // Reset selected event when client or category changes
  useEffect(() => {
    setSelectedEvent(null);
    setSelectedClient('all');
  }, [selectedCategory]);

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
                    {filteredEvents.length === 0 ? (
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

          {/* Tabla de Registros */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
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
                {(selectedEventData?.records || filteredRecords).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant={record.type === 'cobro' ? 'success' : 'destructive'}>
                        {record.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.especie}</TableCell>
                    <TableCell>
                      <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                        {record.moneda.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.subcargo}</TableCell>
                    <TableCell>{record.detalle}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(record.montoEspera, record.moneda)}
                    </TableCell>
                    <TableCell>{formatDate(record.fechaEspera)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 