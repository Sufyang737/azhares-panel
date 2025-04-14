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
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Obtener lista única de clientes
  const clients = [...new Set(records
    .filter(r => r.cliente_id)
    .map(r => ({ id: r.cliente_id, nombre: r.cliente_id?.nombre })))
  ];

  // Obtener lista única de eventos
  const allEvents = [...new Set(records
    .filter(r => r.evento_id)
    .map(r => ({ 
      id: r.evento_id.id, 
      nombre: r.evento_id.nombre || 'Evento sin nombre',
      cliente_id: r.cliente_id
    })))
  ];

  // Agrupar registros por evento
  const eventRecords = records
    .filter(record => selectedClient === 'all' || record.cliente_id === selectedClient)
    .reduce((acc, record) => {
      if (!record.evento_id) return acc;
      
      const eventId = record.evento_id.id;
      if (!eventId) return acc;

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

  const selectedEventData = selectedEvent ? eventRecords[selectedEvent] : null;
  const filteredEvents = selectedClient === 'all' 
    ? allEvents 
    : allEvents.filter(event => event.cliente_id === selectedClient);

  // Reset selected event when client changes
  useEffect(() => {
    setSelectedEvent(null);
  }, [selectedClient]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Reporte por Evento
          <Badge variant="secondary" className="ml-2">
            {allEvents.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Reporte por Evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

            {filteredEvents.length > 0 && (
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
                    {filteredEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No hay eventos disponibles</p>
              {selectedClient !== 'all' && (
                <p className="text-sm">
                  para el cliente seleccionado
                </p>
              )}
            </div>
          ) : selectedEventData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-lg border p-6 bg-card">
                  <h3 className="text-lg font-semibold mb-4">Resumen del Evento</h3>
                  <div className="space-y-6">
                    <div className="bg-muted/10 rounded-md p-4">
                      <h4 className="font-medium mb-3 text-muted-foreground">ARS</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span className="text-green-600 font-medium">{formatCurrency(selectedEventData.ingresos.ars, 'ars')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Egresos</span>
                          <span className="text-red-600 font-medium">{formatCurrency(selectedEventData.egresos.ars, 'ars')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">Balance</span>
                          <span className={`font-bold ${selectedEventData.ingresos.ars - selectedEventData.egresos.ars >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(selectedEventData.ingresos.ars - selectedEventData.egresos.ars, 'ars')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/10 rounded-md p-4">
                      <h4 className="font-medium mb-3 text-muted-foreground">USD</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Ingresos</span>
                          <span className="text-green-600 font-medium">{formatCurrency(selectedEventData.ingresos.usd, 'usd')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Egresos</span>
                          <span className="text-red-600 font-medium">{formatCurrency(selectedEventData.egresos.usd, 'usd')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-medium">Balance</span>
                          <span className={`font-bold ${selectedEventData.ingresos.usd - selectedEventData.egresos.usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(selectedEventData.ingresos.usd - selectedEventData.egresos.usd, 'usd')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-6 bg-card">
                <h3 className="text-lg font-semibold mb-4">Movimientos del Evento</h3>
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Especie</TableHead>
                        <TableHead>Moneda</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEventData.records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'} className="capitalize">
                              {record.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{record.especie}</TableCell>
                          <TableCell>
                            <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                              {record.moneda.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(record.montoEspera, record.moneda)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={record.fechaEfectuado ? 'success' : 'secondary'} className="capitalize">
                              {record.fechaEfectuado ? 'Efectuado' : 'Pendiente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 