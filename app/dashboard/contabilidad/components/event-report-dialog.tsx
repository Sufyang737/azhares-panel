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

  // Log records for debugging
  useEffect(() => {
    console.log('EventReportDialog - Records:', records);
    console.log('EventReportDialog - Records with events:', records.filter(r => r.evento_id));
  }, [records]);

  // Agrupar registros por evento
  const eventRecords = records.reduce((acc, record) => {
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

  // Log event records for debugging
  useEffect(() => {
    console.log('EventReportDialog - Event records:', eventRecords);
  }, [eventRecords]);

  const selectedEventData = selectedEvent ? eventRecords[selectedEvent] : null;

  // Si no hay eventos, mostrar mensaje
  const hasEvents = Object.keys(eventRecords).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Reporte por Evento
          {hasEvents && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(eventRecords).length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Reporte por Evento</DialogTitle>
          <DialogDescription>
            {!hasEvents ? (
              <div className="text-center py-4">
                No hay registros asociados a eventos
              </div>
            ) : (
              <div className="mt-4 mb-6">
                <Select
                  value={selectedEvent || ''}
                  onValueChange={(value) => setSelectedEvent(value)}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Selecciona un evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventRecords).map(([id, data]) => (
                      <SelectItem key={id} value={id}>
                        {data.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedEventData && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-3">Resumen del Evento</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">ARS</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Ingresos:</span>
                            <span className="text-green-600">{formatCurrency(selectedEventData.ingresos.ars, 'ars')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Egresos:</span>
                            <span className="text-red-600">{formatCurrency(selectedEventData.egresos.ars, 'ars')}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-1">
                            <span>Balance:</span>
                            <span className={selectedEventData.ingresos.ars - selectedEventData.egresos.ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(selectedEventData.ingresos.ars - selectedEventData.egresos.ars, 'ars')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">USD</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Ingresos:</span>
                            <span className="text-green-600">{formatCurrency(selectedEventData.ingresos.usd, 'usd')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Egresos:</span>
                            <span className="text-red-600">{formatCurrency(selectedEventData.egresos.usd, 'usd')}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t pt-1">
                            <span>Balance:</span>
                            <span className={selectedEventData.ingresos.usd - selectedEventData.egresos.usd >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(selectedEventData.ingresos.usd - selectedEventData.egresos.usd, 'usd')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">Movimientos del Evento</h3>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Especie</TableHead>
                          <TableHead>Moneda</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEventData.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Badge variant={record.type === 'cobro' ? 'default' : 'destructive'}>
                                {record.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.especie}</TableCell>
                            <TableCell>
                              <Badge variant={record.moneda === 'usd' ? 'outline' : 'secondary'}>
                                {record.moneda.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(record.montoEspera, record.moneda)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.fechaEfectuado ? 'success' : 'secondary'}>
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
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 